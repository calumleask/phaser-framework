import framework, {
  type InputKeyEvent,
  type InputResetEvent,
  type Meter,
  type MusicClock,
  type MusicTimer,
  type MusicPosition,
  type MusicScheduleAction,
  type MusicScheduleHandle,
  type MusicTransportOptions,
  type MusicLayer,
  type LayerChange,
} from 'phaser-framework';
import type * as Phaser from 'phaser';

const scale = new framework.Core.GameScaleManager(320, 240, 1, 480, 240);
const ratio: number = scale.getAssetScaleRatio();
const pixels: number[] = scale.gameUnitsToPixels([1, 2]);
void ratio;
void pixels;

type ButtonStyle = ConstructorParameters<
  typeof framework.Objects.TextButton
>[4];
type IsOptional<T, K extends keyof T> =
  Record<never, never> extends Pick<T, K> ? true : false;
type AssertFalse<T extends false> = T;
type RequiredTextColor = AssertFalse<IsOptional<ButtonStyle, 'textColor'>>;
const requiredTextColor: RequiredTextColor = false;
void requiredTextColor;

const requiredTimer: AssertFalse<IsOptional<MusicTransportOptions, 'timer'>> =
  false;
const requiredBoundary: AssertFalse<IsOptional<MusicLayer, 'defaultBoundary'>> =
  false;
const noContentRole: AssertFalse<
  'role' extends keyof MusicLayer ? true : false
> = false;
void requiredTimer;
void requiredBoundary;
void noContentRole;

function musicConsumer(
  context: AudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
): void {
  const meter: Meter = { numerator: 4, denominator: 4 };
  const clock: MusicClock = context;
  const timer: MusicTimer = {
    set: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clear: handle => window.clearTimeout(handle),
  };
  const options: MusicTransportOptions = {
    clock,
    timer,
    bpm: 120,
    meter,
    phraseBars: 4,
  };
  const transport = new framework.Audio.MusicTransport(options);
  const layer: MusicLayer = { id: 'texture', buffer, defaultBoundary: 'bar' };
  const mixer = new framework.Audio.MusicLayerMixer({
    context,
    destination,
    transport,
    loopTicks: framework.Audio.ticksPerBar(meter) * 4,
    layers: [layer],
  });
  const action: MusicScheduleAction = atAudioTime => {
    void atAudioTime;
    return () => {};
  };
  const handle: MusicScheduleHandle = transport.scheduleAtTick(
    framework.Audio.TICKS_PER_QUARTER,
    action,
  );
  const change: LayerChange = {
    boundary: 'phrase',
    atTick: 384,
    fadeSeconds: 0.2,
  };
  mixer.setStemGain('texture', 0.5, change);
  mixer.setMasterVolume(0.75);
  mixer.setMuted(false);
  if (mixer.start()) {
    const position: MusicPosition | null = transport.getPosition();
    const tick: number = transport.getNextBarTick();
    const phrase: number = transport.getNextPhraseTick();
    const atTime: number = transport.tickToTime(tick);
    const barTime: number = transport.getNextBarTime();
    const phraseTime: number = transport.getNextPhraseTime();
    void position;
    void phrase;
    void atTime;
    void barTime;
    void phraseTime;
    transport.pump();
    mixer.pause();
    const resumed: boolean = mixer.resume();
    void resumed;
  }
  handle.cancel();
  mixer.stop();
  mixer.dispose();
}
void musicConsumer;

class ConsumerScene extends framework.Scene {
  constructor() {
    super('consumer');
  }

  create(): void {
    const button = new framework.Objects.TextButton(this, 20, 20, 'Play', {
      textColor: '#ffffff',
      downTextColor: '#cccccc',
    });
    this.add.existing(button);
    button.onSelect = () => {};
    button.onPointerOut();
    button.setUp();

    const input = new framework.Input.InputManager({
      input: this.input,
      keys: [{ key: 'A', name: 'action' }],
    });
    const onAction = (event: InputKeyEvent): void => {
      const native: KeyboardEvent = event.event;
      const down: boolean = event.down;
      const up: boolean = event.up;
      const pressed: boolean = event.pressed;
      const released: boolean = event.released;
      const name: string = event.type;
      const target: typeof input = event.target;
      void native;
      void down;
      void up;
      void pressed;
      void released;
      void name;
      void target;
    };
    input.onKey('action', onAction);
    input.offKey('action', onAction);
    const onReset = (event: InputResetEvent): void => {
      const reason: 'blur' = event.reason;
      const codes: string[] = event.codes;
      const name: 'input:reset' = event.type;
      const target: typeof input = event.target;
      void reason;
      void codes;
      void name;
      void target;
    };
    input.onReset(onReset);
    input.offReset(onReset);
    const pointer: Phaser.Input.Pointer = input.getActivePointer();
    void pointer;
    input.dispose();
    input.dispose();
    this.context?.scaling.gameUnitToPixel(1);
  }
}

void ConsumerScene;
