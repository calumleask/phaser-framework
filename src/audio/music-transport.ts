import { TICKS_PER_QUARTER, ticksPerBar, type Meter } from './music-timing';

/** Phaser's WebAudioSoundManager.context satisfies this interface. */
export type MusicClock = {
  readonly currentTime: AudioContext['currentTime'];
  readonly state: AudioContext['state'] | 'interrupted';
};

export type MusicTimer = {
  set(callback: () => void, delayMs: number): number;
  clear(handle: number): void;
};

export type MusicPosition = {
  readonly tick: number;
  readonly beat: number;
  readonly bar: number;
  readonly phrase: number;
  readonly barInPhrase: number;
};

/** Return a cancellation function for audio work scheduled ahead of playback. */
export type MusicScheduleAction = (atAudioTime: number) => () => void;

export type MusicScheduleHandle = { cancel(): void };

export type MusicTransportOptions = {
  readonly clock: MusicClock;
  readonly bpm: number;
  readonly meter: Meter;
  readonly phraseBars: number;
  readonly timer: MusicTimer;
  readonly lookaheadSeconds?: number;
  readonly pollIntervalMs?: number;
};

type TransportState =
  'stopped' | 'running' | 'paused' | 'suspended' | 'disposed';

type ScheduledEntry = {
  readonly tick: number;
  readonly sequence: number;
  readonly action: MusicScheduleAction;
  cleanup: (() => void) | null;
  cancelled: boolean;
};

const tickEpsilon = 1e-7;
const timeEpsilon = 1e-6;

/**
 * Turns integer musical ticks into absolute AudioContext times. The timer only
 * wakes the lookahead queue; callbacks must schedule audio for atAudioTime.
 */
export class MusicTransport {
  private readonly _clock: MusicClock;
  private readonly _timer: MusicTimer;
  private readonly _secondsPerTick: number;
  private readonly _ticksPerBar: number;
  private readonly _ticksPerBeat: number;
  private readonly _phraseBars: number;
  private readonly _lookaheadSeconds: number;
  private readonly _pollIntervalMs: number;
  private _state: TransportState = 'stopped';
  private _epochTime: number | null = null;
  private _frozenTick = 0;
  private _timerHandle: number | null = null;
  private _sequence = 0;
  private _pending: ScheduledEntry[] = [];
  private readonly _issued = new Set<ScheduledEntry>();

  constructor(options: MusicTransportOptions) {
    if (!options.timer)
      throw new Error('Music transport needs an injected timer');
    if (!Number.isFinite(options.bpm) || options.bpm < 40 || options.bpm > 240)
      throw new Error('Music transport BPM must be within 40..240');
    if (
      !Number.isSafeInteger(options.phraseBars) ||
      options.phraseBars < 1 ||
      options.phraseBars > 32
    )
      throw new Error('Music phraseBars must be an integer from 1 to 32');
    const lookahead = options.lookaheadSeconds ?? 0.15;
    const poll = options.pollIntervalMs ?? 25;
    if (!Number.isFinite(lookahead) || lookahead < 0.02 || lookahead > 1)
      throw new Error('Music lookaheadSeconds must be within 0.02..1');
    if (!Number.isFinite(poll) || poll < 1 || poll >= lookahead * 1000)
      throw new Error(
        'Music pollIntervalMs must be shorter than the lookahead',
      );

    this._clock = options.clock;
    this._timer = options.timer;
    this._secondsPerTick = 60 / (options.bpm * TICKS_PER_QUARTER);
    this._ticksPerBar = ticksPerBar(options.meter);
    this._ticksPerBeat = this._ticksPerBar / options.meter.numerator;
    this._phraseBars = options.phraseBars;
    this._lookaheadSeconds = lookahead;
    this._pollIntervalMs = poll;
  }

  get state(): TransportState {
    return this._state;
  }

  /** Start at the current audio time or at a future audio time. */
  start(atAudioTime = this._clock.currentTime): void {
    this._assertNotDisposed();
    if (this._state === 'running') return;
    if (this._state !== 'stopped')
      throw new Error('Resume a paused music transport');
    const now = this._runningClockTime();
    if (!Number.isFinite(atAudioTime) || atAudioTime < now - timeEpsilon)
      throw new Error('Music start time must be at or after the audio clock');
    this._epochTime = Math.max(now, atAudioTime);
    this._frozenTick = 0;
    this._state = 'running';
    this.pump();
    this._armTimer();
  }

  /** Freeze at the current position; resume begins at the next bar boundary. */
  pause(): void {
    this._assertNotDisposed();
    if (this._state === 'running') this._freeze('paused');
    else if (this._state === 'suspended') this._state = 'paused';
    this._clearTimer();
  }

  resume(): void {
    this._assertNotDisposed();
    if (this._state === 'running') return;
    if (this._state !== 'paused' && this._state !== 'suspended')
      throw new Error('Music transport is not paused');
    const now = this._runningClockTime();
    const resumeTick = this._resumeTick();
    this._epochTime = now - resumeTick * this._secondsPerTick;
    this._frozenTick = resumeTick;
    this._state = 'running';
    this.pump();
    this._armTimer();
  }

  stop(): void {
    if (this._state === 'disposed') return;
    this._clearTimer();
    for (const entry of [...this._pending, ...this._issued])
      this._cancelEntry(entry);
    this._pending = [];
    this._issued.clear();
    this._epochTime = null;
    this._frozenTick = 0;
    this._state = 'stopped';
  }

  dispose(): void {
    if (this._state === 'disposed') return;
    this.stop();
    this._state = 'disposed';
  }

  getPosition(): MusicPosition | null {
    if (this._epochTime === null) return null;
    const tick = Math.floor(this._elapsedTicks() + tickEpsilon);
    const bar = Math.floor(tick / this._ticksPerBar);
    return {
      tick,
      beat: Math.floor((tick % this._ticksPerBar) / this._ticksPerBeat),
      bar,
      phrase: Math.floor(bar / this._phraseBars),
      barInPhrase: bar % this._phraseBars,
    };
  }

  /** Strictly following boundary, even when already exactly on one. */
  getNextBarTick(): number {
    return this._nextBoundaryTick(1);
  }

  getNextPhraseTick(): number {
    return this._nextBoundaryTick(this._phraseBars);
  }

  getNextBarTime(): number {
    return this.tickToTime(this.getNextBarTick());
  }

  getNextPhraseTime(): number {
    return this.tickToTime(this.getNextPhraseTick());
  }

  tickToTime(tick: number): number {
    if (!Number.isSafeInteger(tick) || tick < 0)
      throw new Error('Music tick must be a non-negative integer');
    if (this._state !== 'running' || this._epochTime === null)
      throw new Error(
        'Music transport must be running to convert ticks to audio time',
      );
    return this._epochTime + tick * this._secondsPerTick;
  }

  /**
   * Enqueue work at an integer tick. It is delivered within the lookahead
   * window with an absolute audio timestamp. Cancellation also undoes work
   * already delivered for a future timestamp via the returned cleanup.
   */
  scheduleAtTick(
    tick: number,
    action: MusicScheduleAction,
  ): MusicScheduleHandle {
    this._assertNotDisposed();
    if (!Number.isSafeInteger(tick) || tick < 0)
      throw new Error('Music tick must be a non-negative integer');
    if (
      this._state === 'running' &&
      this.tickToTime(tick) < this._clock.currentTime - timeEpsilon
    )
      throw new Error('Cannot schedule a music event in the past');
    if (
      (this._state === 'paused' || this._state === 'suspended') &&
      tick < this._resumeTick()
    )
      throw new Error('Cannot schedule before the music resume bar');
    const entry: ScheduledEntry = {
      tick,
      sequence: this._sequence++,
      action,
      cleanup: null,
      cancelled: false,
    };
    this._pending.push(entry);
    this._pending.sort((a, b) => a.tick - b.tick || a.sequence - b.sequence);
    if (this._state === 'running') this.pump();
    return { cancel: () => this._cancelEntry(entry) };
  }

  /** Also callable by a fake timer; audio timing never depends on call cadence. */
  pump(): void {
    if (
      this._state === 'stopped' ||
      this._state === 'disposed' ||
      this._state === 'paused'
    )
      return;
    if (this._clock.state === 'closed') {
      this.stop();
      return;
    }
    if (this._state === 'suspended') {
      if (this._clock.state === 'running') this.resume();
      return;
    }
    if (this._clock.state !== 'running') {
      this._freeze('suspended');
      return;
    }
    const now = this._runningClockTime();
    for (const entry of this._issued) {
      if (this.tickToTime(entry.tick) <= now + timeEpsilon)
        this._issued.delete(entry);
    }
    const horizon = now + this._lookaheadSeconds;
    while (this._pending.length > 0) {
      const entry = this._pending[0];
      if (!entry) break;
      const atTime = this.tickToTime(entry.tick);
      if (atTime > horizon + timeEpsilon) break;
      this._pending.shift();
      if (atTime < now - timeEpsilon) {
        entry.cancelled = true;
        continue;
      }
      try {
        const cleanup = entry.action(atTime);
        if (entry.cancelled || this._state !== 'running') cleanup();
        else {
          entry.cleanup = cleanup;
          this._issued.add(entry);
        }
      } catch (error) {
        this.stop();
        throw error;
      }
    }
  }

  private _elapsedTicks(): number {
    if (this._state !== 'running' || this._epochTime === null)
      return this._frozenTick;
    return Math.max(
      0,
      (this._clock.currentTime - this._epochTime) / this._secondsPerTick,
    );
  }

  private _nextBoundaryTick(bars: number): number {
    if (this._epochTime === null)
      throw new Error('Music transport has not started');
    const groupTicks = bars * this._ticksPerBar;
    return (
      (Math.floor((this._elapsedTicks() + tickEpsilon) / groupTicks) + 1) *
      groupTicks
    );
  }

  private _resumeTick(): number {
    return (
      Math.ceil((this._frozenTick - tickEpsilon) / this._ticksPerBar) *
      this._ticksPerBar
    );
  }

  private _freeze(state: 'paused' | 'suspended'): void {
    this._frozenTick = this._elapsedTicks();
    const resumeTick = this._resumeTick();
    this._pending = this._pending.filter(entry => {
      if (entry.tick >= resumeTick) return true;
      entry.cancelled = true;
      return false;
    });
    for (const entry of this._issued) {
      entry.cleanup?.();
      entry.cleanup = null;
      this._issued.delete(entry);
      if (entry.tick >= resumeTick) this._pending.push(entry);
      else entry.cancelled = true;
    }
    this._pending.sort((a, b) => a.tick - b.tick || a.sequence - b.sequence);
    this._state = state;
  }

  private _cancelEntry(entry: ScheduledEntry): void {
    if (entry.cancelled) return;
    entry.cancelled = true;
    this._pending = this._pending.filter(pending => pending !== entry);
    if (this._issued.delete(entry)) {
      entry.cleanup?.();
      entry.cleanup = null;
    }
  }

  private _runningClockTime(): number {
    const now = this._clock.currentTime;
    if (this._clock.state !== 'running' || !Number.isFinite(now) || now < 0)
      throw new Error('Music needs a running AudioContext clock');
    return now;
  }

  private _assertNotDisposed(): void {
    if (this._state === 'disposed')
      throw new Error('Music transport is disposed');
  }

  private _clearTimer(): void {
    if (this._timerHandle === null) return;
    this._timer.clear(this._timerHandle);
    this._timerHandle = null;
  }

  private _armTimer(): void {
    if (
      this._timerHandle !== null ||
      (this._state !== 'running' && this._state !== 'suspended')
    )
      return;
    this._timerHandle = this._timer.set(() => {
      this._timerHandle = null;
      this.pump();
      this._armTimer();
    }, this._pollIntervalMs);
  }
}
