import { MusicTransport, type MusicScheduleHandle } from './music-transport';

export type MusicLayer = {
  readonly id: string;
  readonly defaultBoundary: 'immediate' | 'bar' | 'phrase';
  readonly buffer: AudioBuffer;
};

export type LayerChange = {
  /** Overrides the layer default boundary. */
  readonly boundary?: 'immediate' | 'bar' | 'phrase';
  /** Use a director-selected tick so all stems enter on one boundary. */
  readonly atTick?: number;
  readonly fadeSeconds?: number;
};

type GainPlan = {
  start: number;
  end: number;
  from: number;
  to: number;
};

type LayerState = {
  readonly definition: MusicLayer;
  readonly node: GainNode;
  target: number;
  plan: GainPlan;
  pending: MusicScheduleHandle | null;
};

const defaultFadeSeconds = 0.12;
const masterFadeSeconds = 0.03;
const startLeadSeconds = 0.05;

function unitGain(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1)
    throw new Error('Music gain must be within 0..1');
  return value;
}

function planValue(plan: GainPlan, time: number): number {
  if (time <= plan.start) return plan.from;
  if (time >= plan.end) return plan.to;
  return (
    plan.from +
    ((plan.to - plan.from) * (time - plan.start)) / (plan.end - plan.start)
  );
}

/**
 * One caller-owned Web Audio layer graph, created after audio unlock.
 * Takes ownership of the supplied transport, but not the context or destination.
 */
export class MusicLayerMixer {
  private readonly _context: AudioContext;
  private readonly _transport: MusicTransport;
  private readonly _master: GainNode;
  private readonly _layers = new Map<string, LayerState>();
  private readonly _sources = new Map<string, AudioBufferSourceNode>();
  private readonly _loopTicks: number;
  private _masterVolume = 0.75;
  private _muted = false;
  private _masterPlan: GainPlan = { start: 0, end: 0, from: 0.75, to: 0.75 };
  private _started = false;
  private _disposed = false;
  private _suspended = false;
  private readonly _onContextStateChange = (): void =>
    this._handleContextState();

  constructor(options: {
    readonly context: AudioContext;
    readonly destination: AudioNode;
    readonly transport: MusicTransport;
    readonly loopTicks: number;
    readonly layers: readonly MusicLayer[];
  }) {
    if (!Number.isSafeInteger(options.loopTicks) || options.loopTicks <= 0)
      throw new Error('Music loopTicks must be a positive integer');
    if (options.layers.length === 0)
      throw new Error('Music mixer needs at least one stem');
    this._context = options.context;
    this._transport = options.transport;
    this._loopTicks = options.loopTicks;

    const reference = options.layers[0]?.buffer;
    if (!reference || reference.length <= 0 || reference.sampleRate <= 0)
      throw new Error('Music stems need valid AudioBuffers');
    const ids = new Set<string>();
    for (const definition of options.layers) {
      const { buffer, id } = definition;
      if (!/^[a-z][a-zA-Z0-9]*$/.test(id))
        throw new Error('Music stem IDs must be lowerCamelCase');
      if (ids.has(id.toLowerCase()))
        throw new Error(`Duplicate music stem ID: ${id}`);
      ids.add(id.toLowerCase());
      if (!['immediate', 'bar', 'phrase'].includes(definition.defaultBoundary))
        throw new Error('Unknown music layer default boundary');
      if (
        buffer.length !== reference.length ||
        buffer.sampleRate !== reference.sampleRate ||
        buffer.numberOfChannels !== reference.numberOfChannels ||
        !Number.isFinite(buffer.duration)
      )
        throw new Error('Music stems must share one sample-aligned loop');
    }

    this._master = this._context.createGain();
    this._master.gain.value = this._masterVolume;
    this._master.connect(options.destination);
    for (const definition of options.layers) {
      const node = this._context.createGain();
      node.gain.value = 0;
      node.connect(this._master);
      this._layers.set(definition.id, {
        definition,
        node,
        target: 0,
        plan: { start: 0, end: 0, from: 0, to: 0 },
        pending: null,
      });
    }
  }

  /** Returns false while the supplied AudioContext is not running. */
  start(): boolean {
    this._assertAlive();
    if (this._started) return true;
    if (this._context.state !== 'running') return false;
    const atTime = this._context.currentTime + startLeadSeconds;
    this._transport.start(atTime);
    try {
      this._validateLoopDuration();
      this._startSources(atTime, 0);
      this._started = true;
      this._context.addEventListener('statechange', this._onContextStateChange);
      this._restoreTargets(atTime);
    } catch (error) {
      this._started = false;
      this._context.removeEventListener(
        'statechange',
        this._onContextStateChange,
      );
      this._stopSources();
      this._transport.stop();
      throw error;
    }
    return true;
  }

  setStemGain(id: string, value: number, change: LayerChange = {}): void {
    this._assertAlive();
    const layer = this._layers.get(id);
    if (!layer) throw new Error(`Unknown music stem: ${id}`);
    const target = unitGain(value);
    const fade = change.fadeSeconds ?? defaultFadeSeconds;
    if (!Number.isFinite(fade) || fade < 0.01 || fade > 10)
      throw new Error('Music fade must be within 0.01..10 seconds');
    const boundary = change.boundary ?? layer.definition.defaultBoundary;
    if (!['immediate', 'bar', 'phrase'].includes(boundary))
      throw new Error('Unknown music layer boundary');
    if (
      change.atTick !== undefined &&
      (!Number.isSafeInteger(change.atTick) || change.atTick < 0)
    )
      throw new Error('Music layer atTick must be a nonnegative safe integer');
    if (boundary === 'immediate' && change.atTick !== undefined)
      throw new Error('Immediate music layers cannot specify atTick');
    layer.pending?.cancel();
    layer.pending = null;
    layer.target = target;
    if (!this._started || this._suspended) return;
    if (boundary === 'immediate') {
      this._ramp(
        layer.node.gain,
        layer.plan,
        target,
        this._context.currentTime,
        fade,
      );
      return;
    }
    const tick =
      change.atTick ??
      (boundary === 'phrase'
        ? this._transport.getNextPhraseTick()
        : this._transport.getNextBarTick());
    layer.pending = this._transport.scheduleAtTick(tick, atTime => {
      this._ramp(layer.node.gain, layer.plan, target, atTime, fade);
      return () => this._hold(layer.node.gain, layer.plan);
    });
  }

  setMasterVolume(value: number): void {
    this._assertAlive();
    this._masterVolume = unitGain(value);
    this._ramp(
      this._master.gain,
      this._masterPlan,
      this._muted ? 0 : this._masterVolume,
      this._context.currentTime,
      masterFadeSeconds,
    );
  }

  setMuted(muted: boolean): void {
    this._assertAlive();
    this._muted = muted;
    this._ramp(
      this._master.gain,
      this._masterPlan,
      muted ? 0 : this._masterVolume,
      this._context.currentTime,
      masterFadeSeconds,
    );
  }

  /** Stops sources and freezes the transport; resume starts at a full bar. */
  pause(): void {
    this._assertAlive();
    if (!this._started || this._transport.state === 'paused') return;
    for (const layer of this._layers.values()) {
      layer.pending?.cancel();
      layer.pending = null;
      this._hold(layer.node.gain, layer.plan);
    }
    this._transport.pause();
    this._stopSources();
    this._suspended = true;
  }

  resume(): boolean {
    this._assertAlive();
    if (!this._started) return this.start();
    if (this._context.state !== 'running') return false;
    if (!this._suspended) return true;
    this._transport.resume();
    const atTime = this._context.currentTime;
    const tick = this._transport.getPosition()?.tick ?? 0;
    try {
      this._startSources(atTime, tick);
    } catch (error) {
      this._stopSources();
      this._transport.pause();
      throw error;
    }
    this._suspended = false;
    this._restoreTargets(atTime);
    return true;
  }

  stop(): void {
    if (this._disposed || !this._started) return;
    this._context.removeEventListener(
      'statechange',
      this._onContextStateChange,
    );
    for (const layer of this._layers.values()) {
      layer.pending?.cancel();
      layer.pending = null;
      this._hold(layer.node.gain, layer.plan);
    }
    this._stopSources();
    this._transport.stop();
    this._started = false;
    this._suspended = false;
  }

  dispose(): void {
    if (this._disposed) return;
    this.stop();
    this._disposed = true;
    this._transport.dispose();
    for (const layer of this._layers.values()) layer.node.disconnect();
    this._master.disconnect();
    this._layers.clear();
  }

  private _validateLoopDuration(): void {
    const expected =
      this._transport.tickToTime(this._loopTicks) -
      this._transport.tickToTime(0);
    const buffer = this._layers.values().next().value?.definition.buffer;
    if (!buffer || Math.abs(buffer.duration - expected) > 1 / buffer.sampleRate)
      throw new Error(
        'Music loop length must match transport ticks within one sample',
      );
  }

  private _startSources(atTime: number, tick: number): void {
    if (this._sources.size > 0) return;
    const expected =
      this._transport.tickToTime(this._loopTicks) -
      this._transport.tickToTime(0);
    for (const layer of this._layers.values()) {
      const source = this._context.createBufferSource();
      source.buffer = layer.definition.buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = layer.definition.buffer.duration;
      source.playbackRate.value = layer.definition.buffer.duration / expected;
      source.connect(layer.node);
      const offset =
        ((tick % this._loopTicks) / this._loopTicks) *
        layer.definition.buffer.duration;
      try {
        source.start(atTime, offset);
      } catch (error) {
        source.disconnect();
        throw error;
      }
      this._sources.set(layer.definition.id, source);
    }
  }

  private _stopSources(): void {
    for (const source of this._sources.values()) {
      source.stop();
      source.disconnect();
    }
    this._sources.clear();
  }

  private _restoreTargets(atTime: number): void {
    for (const layer of this._layers.values()) {
      layer.node.gain.cancelScheduledValues(atTime);
      layer.node.gain.setValueAtTime(0, atTime);
      layer.node.gain.linearRampToValueAtTime(
        layer.target,
        atTime + defaultFadeSeconds,
      );
      layer.plan = {
        start: atTime,
        end: atTime + defaultFadeSeconds,
        from: 0,
        to: layer.target,
      };
    }
  }

  private _hold(param: AudioParam, plan: GainPlan): void {
    const now = this._context.currentTime;
    const value = planValue(plan, now);
    if (typeof param.cancelAndHoldAtTime === 'function')
      param.cancelAndHoldAtTime(now);
    else param.cancelScheduledValues(now);
    param.setValueAtTime(value, now);
    plan.start = now;
    plan.end = now;
    plan.from = value;
    plan.to = value;
  }

  private _ramp(
    param: AudioParam,
    plan: GainPlan,
    target: number,
    atTime: number,
    fade: number,
  ): void {
    this._hold(param, plan);
    const from = plan.to;
    param.setValueAtTime(from, atTime);
    param.linearRampToValueAtTime(target, atTime + fade);
    plan.start = atTime;
    plan.end = atTime + fade;
    plan.from = from;
    plan.to = target;
  }

  private _handleContextState(): void {
    if (!this._started || this._disposed) return;
    if (this._context.state !== 'running') {
      if (!this._suspended) {
        for (const layer of this._layers.values()) {
          layer.pending?.cancel();
          layer.pending = null;
          this._hold(layer.node.gain, layer.plan);
        }
        this._transport.pump();
        this._stopSources();
        this._suspended = true;
      }
      return;
    }
    if (this._suspended && this._transport.state !== 'paused') {
      if (this._transport.state === 'suspended') this._transport.pump();
      if (this._transport.state !== 'running') return;
      const atTime = this._context.currentTime;
      const tick = this._transport.getPosition()?.tick ?? 0;
      try {
        this._startSources(atTime, tick);
      } catch (error) {
        this._stopSources();
        this._transport.pause();
        throw error;
      }
      this._suspended = false;
      this._restoreTargets(atTime);
    }
  }

  private _assertAlive(): void {
    if (this._disposed) throw new Error('Music mixer is disposed');
  }
}
