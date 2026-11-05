import assert from 'node:assert/strict';
import test from 'node:test';

import { MusicLayerMixer, MusicTransport } from './audio-source.mjs';

class FakeParam {
  value = 1;
  events = [];

  cancelAndHoldAtTime(time) {
    this.events.push(['hold', time]);
  }

  cancelScheduledValues(time) {
    this.events.push(['cancel', time]);
  }

  setValueAtTime(value, time) {
    this.events.push(['set', value, time]);
    this.value = value;
  }

  linearRampToValueAtTime(value, time) {
    this.events.push(['ramp', value, time]);
  }
}

class FakeGain {
  gain = new FakeParam();
  connections = [];
  disconnected = false;

  connect(node) {
    this.connections.push(node);
  }

  disconnect() {
    this.disconnected = true;
  }
}

class FakeSource {
  buffer = null;
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  playbackRate = { value: 1 };
  connections = [];
  starts = [];
  stops = 0;
  disconnected = false;

  connect(node) {
    this.connections.push(node);
  }

  start(...args) {
    this.starts.push(args);
  }

  stop() {
    this.stops++;
  }

  disconnect() {
    this.disconnected = true;
  }
}

class FakeContext {
  currentTime = 0;
  state = 'running';
  gains = [];
  sources = [];
  listeners = new Set();
  destination = {};

  createGain() {
    const node = new FakeGain();
    this.gains.push(node);
    return node;
  }

  createBufferSource() {
    const node = new FakeSource();
    this.sources.push(node);
    return node;
  }

  addEventListener(name, callback) {
    assert.equal(name, 'statechange');
    this.listeners.add(callback);
  }

  removeEventListener(name, callback) {
    assert.equal(name, 'statechange');
    this.listeners.delete(callback);
  }

  changeState(state) {
    this.state = state;
    for (const callback of this.listeners) callback();
  }
}

class FakeTimer {
  callbacks = new Map();
  nextId = 1;

  set(callback) {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  }

  clear(id) {
    this.callbacks.delete(id);
  }
}

const buffer = Object.freeze({
  duration: 10,
  length: 220500,
  sampleRate: 22050,
  numberOfChannels: 1,
});

function fixture(
  layers = [
    { id: 'exploration', defaultBoundary: 'immediate', buffer },
    { id: 'combat', defaultBoundary: 'bar', buffer },
  ],
) {
  const context = new FakeContext();
  const timer = new FakeTimer();
  const transport = new MusicTransport({
    clock: context,
    timer,
    bpm: 96,
    meter: { numerator: 4, denominator: 4 },
    phraseBars: 4,
  });
  const mixer = new MusicLayerMixer({
    context,
    destination: context.destination,
    transport,
    loopTicks: 384,
    layers,
  });
  return { context, timer, transport, mixer };
}

test('starts one aligned looping source per stem through a separate master', () => {
  const { context, mixer, timer } = fixture();
  assert.equal(mixer.start(), true);
  assert.equal(mixer.start(), true);
  assert.equal(context.sources.length, 2);
  assert.deepEqual(
    context.sources.map(source => source.starts),
    [[[0.05, 0]], [[0.05, 0]]],
  );
  assert.ok(context.sources.every(source => source.loop));
  assert.ok(context.sources.every(source => source.playbackRate.value === 1));
  assert.equal(context.gains[0].connections[0], context.destination);
  assert.equal(context.sources[0].connections[0], context.gains[1]);
  assert.equal(context.sources[1].connections[0], context.gains[2]);
  mixer.dispose();
  assert.equal(context.sources[0].stops, 1);
  assert.equal(context.listeners.size, 0);
  assert.equal(timer.callbacks.size, 0);
  assert.ok(context.gains.every(node => node.disconnected));
});

test('rapid bar toggles schedule only the latest target at one audio timestamp', () => {
  const { context, transport, mixer } = fixture();
  mixer.start();
  mixer.setStemGain('combat', 0.8);
  mixer.setStemGain('combat', 0.2);
  context.currentTime = 2.41;
  transport.pump();
  const ramps = context.gains[2].gain.events.filter(
    event => event[0] === 'ramp',
  );
  assert.equal(ramps.length, 2);
  assert.equal(ramps[0][1], 0);
  assert.ok(Math.abs(ramps[0][2] - 0.17) < 1e-9);
  assert.deepEqual(ramps[1], ['ramp', 0.2, 2.67]);
  assert.equal(context.sources.length, 2);

  context.currentTime = 2.45;
  mixer.setStemGain('combat', 0.6);
  transport.pump();
  const lastRamp = context.gains[2].gain.events
    .filter(event => event[0] === 'ramp')
    .at(-1);
  assert.deepEqual(lastRamp, ['ramp', 0.6, 2.67]);
  assert.ok(context.gains[2].gain.events.some(event => event[0] === 'hold'));
  mixer.dispose();
});

test('phrase changes quantise while ambience and master controls fade immediately', () => {
  const { context, transport, mixer } = fixture();
  mixer.start();
  context.currentTime = 1;
  mixer.setStemGain('exploration', 0.4);
  mixer.setStemGain('combat', 0.5, { boundary: 'phrase', fadeSeconds: 0.5 });
  mixer.setMasterVolume(0.3);
  mixer.setMuted(true);
  assert.deepEqual(context.gains[1].gain.events.at(-1), ['ramp', 0.4, 1.12]);
  assert.deepEqual(context.gains[0].gain.events.at(-1), ['ramp', 0, 1.03]);
  assert.equal(
    context.gains[2].gain.events.some(
      event => event[0] === 'ramp' && event[1] === 0.5,
    ),
    false,
  );
  context.currentTime = 9.95;
  transport.pump();
  assert.deepEqual(context.gains[2].gain.events.at(-1), ['ramp', 0.5, 10.55]);
  mixer.setMuted(false);
  const unmute = context.gains[0].gain.events.at(-1);
  assert.equal(unmute[0], 'ramp');
  assert.equal(unmute[1], 0.3);
  assert.ok(Math.abs(unmute[2] - 9.98) < 1e-9);
  mixer.dispose();
});

test('director-selected tick keeps separate stem fades on the same boundary', () => {
  const { context, transport, mixer } = fixture();
  mixer.start();
  mixer.setStemGain('exploration', 0.4, {
    boundary: 'bar',
    atTick: 192,
  });
  mixer.setStemGain('combat', 0.5, { boundary: 'bar', atTick: 192 });
  context.currentTime = 4.91;
  transport.pump();
  assert.deepEqual(context.gains[1].gain.events.at(-1), ['ramp', 0.4, 5.17]);
  assert.deepEqual(context.gains[2].gain.events.at(-1), ['ramp', 0.5, 5.17]);
  assert.throws(
    () => mixer.setStemGain('combat', 0.5, { atTick: -1 }),
    /atTick/,
  );
  mixer.dispose();
});

test('pause and resume restart sources at the transport bar offset', () => {
  const { context, transport, mixer } = fixture();
  mixer.start();
  context.currentTime = 1.1;
  mixer.pause();
  assert.equal(transport.state, 'paused');
  assert.ok(context.sources.every(source => source.stops === 1));
  context.currentTime = 5;
  assert.equal(mixer.resume(), true);
  assert.equal(transport.state, 'running');
  assert.deepEqual(
    context.sources.slice(2).map(source => source.starts),
    [[[5, 2.5]], [[5, 2.5]]],
  );
  mixer.dispose();
  assert.equal(context.sources.length, 4);
  assert.equal(context.sources[2].stops, 1);
});

test('context suspension and restore do not leave duplicate playback', () => {
  const { context, transport, mixer } = fixture();
  mixer.start();
  context.currentTime = 1.1;
  context.changeState('suspended');
  assert.equal(transport.state, 'suspended');
  assert.ok(context.sources.every(source => source.stops === 1));
  context.currentTime = 5;
  context.changeState('running');
  assert.equal(context.sources.length, 4);
  assert.deepEqual(context.sources[2].starts, [[5, 2.5]]);
  context.changeState('running');
  assert.equal(context.sources.length, 4);
  mixer.dispose();
});

test('locked context, invalid loops, and disposed mixer fail safely', () => {
  const locked = fixture();
  locked.context.state = 'suspended';
  assert.equal(locked.mixer.start(), false);
  assert.equal(locked.context.sources.length, 0);
  locked.mixer.dispose();

  assert.throws(
    () =>
      fixture([
        {
          id: 'tooShort',
          defaultBoundary: 'bar',
          buffer: { ...buffer, duration: 9 },
        },
      ]).mixer.start(),
    /loop length/,
  );
  assert.throws(
    () =>
      fixture([
        { id: 'combat', defaultBoundary: 'bar', buffer },
        { id: 'comBAT', defaultBoundary: 'bar', buffer },
      ]),
    /Duplicate music stem ID/,
  );

  const { mixer } = fixture();
  mixer.dispose();
  mixer.dispose();
  assert.throws(() => mixer.start(), /disposed/);
});

test('stop and restart create one fresh aligned set without leaked timers', () => {
  const { context, timer, mixer } = fixture();
  mixer.start();
  mixer.stop();
  assert.equal(timer.callbacks.size, 0);
  assert.ok(context.sources.every(source => source.stops === 1));
  context.currentTime = 10;
  mixer.start();
  assert.equal(context.sources.length, 4);
  assert.deepEqual(
    context.sources.slice(2).map(source => source.starts),
    [[[10.05, 0]], [[10.05, 0]]],
  );
  mixer.dispose();
  assert.ok(context.sources.every(source => source.stops === 1));
});

test('explicit phrase default and exact tick override use the selected boundary', () => {
  const { context, transport, mixer } = fixture([
    { id: 'texture', defaultBoundary: 'phrase', buffer },
  ]);
  mixer.start();
  mixer.setStemGain('texture', 0.3);
  context.currentTime = 2.41;
  transport.pump();
  assert.equal(context.gains[1].gain.events.at(-1)[1], 0);
  context.currentTime = 9.95;
  transport.pump();
  assert.deepEqual(context.gains[1].gain.events.at(-1), ['ramp', 0.3, 10.17]);
  mixer.setStemGain('texture', 0.6, { atTick: 480 });
  context.currentTime = 12.45;
  transport.pump();
  assert.deepEqual(context.gains[1].gain.events.at(-1), ['ramp', 0.6, 12.67]);
  mixer.dispose();
});

test('second source startup failure disconnects all sources, clears timers, and permits retry', () => {
  const { context, timer, transport, mixer } = fixture();
  const create = context.createBufferSource.bind(context);
  context.createBufferSource = () => {
    const source = create();
    if (context.sources.length === 2)
      source.start = () => {
        throw new Error('source failed');
      };
    return source;
  };
  assert.throws(() => mixer.start(), /source failed/);
  assert.equal(context.sources[0].stops, 1);
  assert.equal(context.sources[1].stops, 0);
  assert.ok(context.sources.every(source => source.disconnected));
  assert.equal(context.listeners.size, 0);
  assert.equal(timer.callbacks.size, 0);
  assert.equal(transport.state, 'stopped');
  assert.equal(mixer.start(), true);
  assert.equal(context.sources.length, 4);
  mixer.dispose();
  mixer.dispose();
  assert.equal(context.sources[2].stops, 1);
  assert.equal(context.sources[3].stops, 1);
  assert.equal(timer.callbacks.size, 0);
  assert.equal(context.listeners.size, 0);
  assert.equal(transport.state, 'disposed');
});

test('startup automation failure removes the installed context listener', () => {
  const { context, timer, transport, mixer } = fixture();
  context.gains[1].gain.linearRampToValueAtTime = () => {
    throw new Error('automation failed');
  };
  assert.throws(() => mixer.start(), /automation failed/);
  assert.ok(
    context.sources.every(source => source.stops === 1 && source.disconnected),
  );
  assert.equal(context.listeners.size, 0);
  assert.equal(timer.callbacks.size, 0);
  assert.equal(transport.state, 'stopped');
  mixer.dispose();
});

test('loop duration mismatch fails before sources, while one-sample tolerance preserves rate correction', () => {
  const invalid = fixture([
    {
      id: 'invalid',
      defaultBoundary: 'bar',
      buffer: { ...buffer, duration: 9 },
    },
  ]);
  assert.throws(() => invalid.mixer.start(), /loop length/);
  assert.equal(invalid.context.sources.length, 0);
  assert.equal(invalid.context.listeners.size, 0);
  assert.equal(invalid.timer.callbacks.size, 0);
  assert.equal(invalid.transport.state, 'stopped');
  invalid.mixer.dispose();
  const duration = 10 + 0.5 / buffer.sampleRate;
  const valid = fixture([
    { id: 'rounded', defaultBoundary: 'bar', buffer: { ...buffer, duration } },
  ]);
  valid.mixer.start();
  assert.equal(valid.context.sources[0].playbackRate.value, duration / 10);
  valid.mixer.dispose();
});

test('layer validation rejects missing boundaries and misaligned buffers before allocating gains', () => {
  const context = new FakeContext();
  const timer = new FakeTimer();
  const transport = new MusicTransport({
    clock: context,
    timer,
    bpm: 96,
    meter: { numerator: 4, denominator: 4 },
    phraseBars: 4,
  });
  const layer = { id: 'valid', defaultBoundary: 'bar', buffer };
  const construct = layers =>
    new MusicLayerMixer({
      context,
      destination: context.destination,
      transport,
      loopTicks: 384,
      layers,
    });
  for (const layers of [
    [],
    [{ ...layer, defaultBoundary: undefined }],
    [{ ...layer, defaultBoundary: 'beat' }],
    [{ ...layer, id: 'Invalid' }],
    [{ ...layer, buffer: { ...buffer, length: 0 } }],
    [
      layer,
      { ...layer, id: 'other', buffer: { ...buffer, numberOfChannels: 2 } },
    ],
    [
      layer,
      { ...layer, id: 'other', buffer: { ...buffer, sampleRate: 44100 } },
    ],
    [layer, { ...layer, id: 'other', buffer: { ...buffer, length: 123 } }],
    [{ ...layer, buffer: { ...buffer, duration: NaN } }],
  ])
    assert.throws(() => construct(layers));
  assert.equal(context.gains.length, 0);
  assert.equal(timer.callbacks.size, 0);
  transport.dispose();
});

test('gain and fade validation, held-value fallback and idempotent disposal preserve ownership', () => {
  const { context, timer, transport, mixer } = fixture();
  for (const value of [-0.1, 1.1, NaN]) {
    assert.throws(() => mixer.setStemGain('combat', value), /gain/);
    assert.throws(() => mixer.setMasterVolume(value), /gain/);
  }
  for (const fadeSeconds of [0, 10.1, NaN])
    assert.throws(
      () => mixer.setStemGain('combat', 0.5, { fadeSeconds }),
      /fade/,
    );
  assert.throws(() => mixer.setStemGain('missing', 0.5), /Unknown/);
  assert.throws(
    () => mixer.setStemGain('combat', 0.5, { boundary: 'beat' }),
    /boundary/,
  );
  assert.throws(
    () => mixer.setStemGain('exploration', 0.5, { atTick: 96 }),
    /Immediate/,
  );
  mixer.setStemGain('exploration', 0.4);
  mixer.start();
  const initialRamp = context.gains[1].gain.events.at(-1);
  assert.deepEqual(initialRamp.slice(0, 2), ['ramp', 0.4]);
  assert.ok(Math.abs(initialRamp[2] - 0.17) < 1e-9);
  context.currentTime = 0.11;
  context.gains[1].gain.cancelAndHoldAtTime = undefined;
  mixer.setStemGain('exploration', 0.8);
  const held = context.gains[1].gain.events.at(-2);
  assert.equal(held[0], 'set');
  assert.ok(Math.abs(held[1] - 0.2) < 1e-9);
  assert.ok(
    context.gains[1].gain.events.some(
      event => event[0] === 'cancel' && event[1] === 0.11,
    ),
  );
  let disconnects = 0;
  for (const gain of context.gains) gain.disconnect = () => disconnects++;
  mixer.dispose();
  mixer.dispose();
  mixer.stop();
  assert.equal(disconnects, 3);
  assert.equal(context.sources.length, 2);
  assert.ok(
    context.sources.every(source => source.stops === 1 && source.disconnected),
  );
  assert.equal(context.listeners.size, 0);
  assert.equal(timer.callbacks.size, 0);
  assert.equal(context.state, 'running');
  assert.equal(transport.state, 'disposed');
  for (const call of [
    () => mixer.start(),
    () => mixer.resume(),
    () => mixer.pause(),
    () => mixer.setMasterVolume(0.5),
    () => mixer.setMuted(true),
    () => mixer.setStemGain('combat', 0.5),
  ])
    assert.throws(call, /disposed/);
});

test('failed resume stops partial sources and freezes the transport for retry', () => {
  const { context, timer, transport, mixer } = fixture();
  mixer.start();
  context.currentTime = 1;
  mixer.pause();
  const create = context.createBufferSource.bind(context);
  context.createBufferSource = () => {
    const source = create();
    if (context.sources.length === 4)
      source.start = () => {
        throw new Error('resume failed');
      };
    return source;
  };
  context.currentTime = 5;
  assert.throws(() => mixer.resume(), /resume failed/);
  assert.equal(transport.state, 'paused');
  assert.equal(timer.callbacks.size, 0);
  assert.equal(context.sources[2].stops, 1);
  assert.ok(context.sources.every(source => source.disconnected));
  assert.equal(mixer.resume(), true);
  assert.equal(context.sources.length, 6);
  assert.deepEqual(context.sources[4].starts, [[5, 2.5]]);
  mixer.dispose();
  assert.equal(context.listeners.size, 0);
  assert.equal(timer.callbacks.size, 0);
});
