import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MusicTransport,
  TICKS_PER_QUARTER,
  ticksPerBar,
} from './audio-source.mjs';

class FakeTimer {
  nextHandle = 1;
  callbacks = new Map();
  delays = [];

  set(callback, delayMs) {
    const handle = this.nextHandle++;
    this.callbacks.set(handle, callback);
    this.delays.push(delayMs);
    return handle;
  }

  clear(handle) {
    this.callbacks.delete(handle);
  }

  fireNext() {
    const next = this.callbacks.entries().next().value;
    assert.ok(next, 'expected a timer callback');
    const [handle, callback] = next;
    this.callbacks.delete(handle);
    callback();
  }
}

function fixture(options = {}) {
  const clock = { currentTime: 0, state: 'running' };
  const timer = new FakeTimer();
  const transport = new MusicTransport({
    clock,
    timer,
    bpm: 96,
    meter: { numerator: 4, denominator: 4 },
    phraseBars: 4,
    ...options,
  });
  return { clock, timer, transport };
}

test('position and strict next-bar/phrase boundaries use the audio clock', () => {
  const { clock, transport } = fixture();
  transport.start(10);
  assert.equal(transport.getNextBarTime(), 12.5);
  assert.equal(transport.getNextPhraseTime(), 20);
  clock.currentTime = 11.25;
  assert.deepEqual(transport.getPosition(), {
    tick: 48,
    beat: 2,
    bar: 0,
    phrase: 0,
    barInPhrase: 0,
  });
  clock.currentTime = 12.5;
  assert.equal(transport.getNextBarTick(), 192);
  assert.equal(transport.getNextPhraseTick(), 384);
  transport.dispose();
});

test('timer wakes lookahead work but callbacks receive absolute audio times', () => {
  const { clock, timer, transport } = fixture();
  const calls = [];
  transport.scheduleAtTick(24, atTime => {
    calls.push(atTime);
    return () => {};
  });
  transport.start();
  assert.deepEqual(calls, []);
  assert.deepEqual(timer.delays, [25]);
  clock.currentTime = 0.48;
  timer.fireNext();
  assert.deepEqual(calls, [0.625]);
  assert.equal(timer.callbacks.size, 1);
  transport.dispose();
  assert.equal(timer.callbacks.size, 0);
});

test('ten minutes of bar scheduling has no cumulative timing drift', () => {
  const { clock, transport } = fixture({ bpm: 97 });
  const times = [];
  const lastBar = 243;
  const secondsPerBar = 240 / 97;
  for (let bar = 0; bar <= lastBar; bar++) {
    transport.scheduleAtTick(bar * 96, atTime => {
      times.push(atTime);
      return () => {};
    });
  }
  transport.start();
  for (let bar = 1; bar <= lastBar; bar++) {
    clock.currentTime = bar * secondsPerBar - 0.1;
    transport.pump();
  }
  assert.equal(times.length, lastBar + 1);
  for (let bar = 0; bar <= lastBar; bar++) {
    assert.ok(Math.abs(times[bar] - bar * secondsPerBar) < 1e-9);
  }
  clock.currentTime = lastBar * secondsPerBar;
  assert.equal(transport.getPosition().bar, lastBar);
  assert.equal(transport.getPosition().phrase, 60);
  transport.dispose();
});

test('cancelling a lookahead event calls its cleanup before playback', () => {
  const { clock, transport } = fixture();
  let scheduled = 0;
  let cancelled = 0;
  const handle = transport.scheduleAtTick(96, () => {
    scheduled++;
    return () => cancelled++;
  });
  transport.start();
  clock.currentTime = 2.4;
  transport.pump();
  assert.equal(scheduled, 1);
  handle.cancel();
  handle.cancel();
  assert.equal(cancelled, 1);
  clock.currentTime = 2.5;
  transport.pump();
  assert.equal(scheduled, 1);
  transport.dispose();
});

test('pause cancels issued work and resume rebases it to the next full bar', () => {
  const { clock, timer, transport } = fixture();
  const times = [];
  let cancelled = 0;
  transport.scheduleAtTick(96, atTime => {
    times.push(atTime);
    return () => cancelled++;
  });
  transport.scheduleAtTick(192, atTime => {
    times.push(atTime);
    return () => cancelled++;
  });
  transport.start();
  clock.currentTime = 2.4;
  transport.pump();
  assert.deepEqual(times, [2.5]);
  transport.pause();
  assert.equal(transport.state, 'paused');
  assert.equal(cancelled, 1);
  assert.equal(timer.callbacks.size, 0);
  clock.currentTime = 7.4;
  transport.resume();
  assert.equal(transport.getPosition().bar, 1);
  assert.deepEqual(times, [2.5, 7.4]);
  clock.currentTime = 9.8;
  transport.pump();
  assert.deepEqual(times, [2.5, 7.4, 9.9]);
  transport.dispose();
});

test('suspension resumes on a bar, and timer throttling skips expired events', () => {
  const { clock, transport } = fixture();
  const times = [];
  for (const bar of [1, 2, 3]) {
    transport.scheduleAtTick(bar * 96, atTime => {
      times.push(atTime);
      return () => {};
    });
  }
  transport.start();
  clock.currentTime = 1.2;
  clock.state = 'suspended';
  transport.pump();
  assert.equal(transport.state, 'suspended');
  clock.currentTime = 4.2;
  clock.state = 'running';
  transport.pump();
  assert.equal(transport.state, 'running');
  assert.deepEqual(times, [4.2]);
  transport.stop();

  const late = fixture();
  const fired = [];
  for (const bar of [1, 2, 3]) {
    late.transport.scheduleAtTick(bar * 96, atTime => {
      fired.push(atTime);
      return () => {};
    });
  }
  late.transport.start();
  late.clock.currentTime = 7.4;
  late.transport.pump();
  assert.deepEqual(fired, [7.5]);
  late.transport.dispose();
});

test('stop and dispose clear callbacks and reject reuse', () => {
  const { clock, timer, transport } = fixture();
  let cleanup = 0;
  transport.scheduleAtTick(96, () => () => cleanup++);
  transport.start();
  clock.currentTime = 2.4;
  transport.pump();
  transport.stop();
  transport.stop();
  assert.equal(cleanup, 1);
  assert.equal(timer.callbacks.size, 0);
  assert.equal(transport.getPosition(), null);
  transport.dispose();
  transport.dispose();
  assert.throws(() => transport.start(), /disposed/);
  assert.throws(() => transport.scheduleAtTick(0, () => () => {}), /disposed/);
});

test('equal-tick delivery preserves insertion order and cancelled work stays removed', () => {
  const { clock, timer, transport } = fixture();
  const calls = [];
  const cleanups = [];
  for (const [tick, id] of [
    [96, 'a'],
    [192, 'later'],
    [96, 'b'],
    [96, 'c'],
  ]) {
    const handle = transport.scheduleAtTick(tick, atTime => {
      calls.push([id, atTime]);
      return () => cleanups.push(id);
    });
    if (id === 'b' || id === 'later') {
      handle.cancel();
      handle.cancel();
    }
  }
  transport.start();
  clock.currentTime = 2.4;
  timer.fireNext();
  assert.deepEqual(calls, [
    ['a', 2.5],
    ['c', 2.5],
  ]);
  transport.pause();
  assert.deepEqual(cleanups, ['a', 'c']);
  clock.currentTime = 5;
  transport.resume();
  assert.deepEqual(calls, [
    ['a', 2.5],
    ['c', 2.5],
    ['a', 5],
    ['c', 5],
  ]);
  transport.dispose();
  assert.deepEqual(cleanups, ['a', 'c', 'a', 'c']);
  assert.equal(timer.callbacks.size, 0);
});

test('scheduler startup failure cancels previously issued work and pending callbacks', () => {
  const { timer, transport } = fixture();
  let cleaned = 0;
  transport.scheduleAtTick(1, () => () => cleaned++);
  transport.scheduleAtTick(2, () => {
    throw new Error('schedule failed');
  });
  transport.scheduleAtTick(3, () => assert.fail('must be cancelled'));
  assert.throws(() => transport.start(), /schedule failed/);
  assert.equal(cleaned, 1);
  assert.equal(timer.callbacks.size, 0);
  assert.equal(transport.state, 'stopped');
  assert.equal(transport.getPosition(), null);
  transport.start();
  transport.dispose();
  transport.dispose();
  assert.equal(cleaned, 1);
  assert.equal(timer.callbacks.size, 0);
});

test('timing grid and validation retain supported meter and option limits', () => {
  assert.equal(TICKS_PER_QUARTER, 24);
  for (let numerator = 1; numerator <= 12; numerator++)
    for (const denominator of [2, 4, 8, 16])
      assert.equal(
        ticksPerBar({ numerator, denominator }),
        (96 * numerator) / denominator,
      );
  for (const meter of [
    null,
    {},
    { numerator: 0, denominator: 4 },
    { numerator: 13, denominator: 4 },
    { numerator: 1.5, denominator: 4 },
    { numerator: 4, denominator: 3 },
  ])
    assert.throws(() => ticksPerBar(meter), /Meter/);
  for (const options of [
    { timer: undefined },
    { bpm: 39 },
    { bpm: 241 },
    { bpm: NaN },
    { phraseBars: 0 },
    { phraseBars: 33 },
    { phraseBars: 1.5 },
    { lookaheadSeconds: 0.01 },
    { lookaheadSeconds: 1.01 },
    { pollIntervalMs: 0 },
    { pollIntervalMs: 150 },
  ])
    assert.throws(() => fixture(options));
  const { clock, transport } = fixture();
  for (const tick of [-1, 0.5, Infinity, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => transport.scheduleAtTick(tick, () => () => {}), /tick/);
  clock.state = 'suspended';
  assert.throws(() => transport.start(), /running AudioContext/);
  clock.state = 'running';
  clock.currentTime = 1;
  assert.throws(() => transport.start(0), /start time/);
  transport.start();
  clock.currentTime = 2;
  assert.throws(() => transport.scheduleAtTick(0, () => () => {}), /past/);
  transport.pause();
  assert.throws(
    () => transport.scheduleAtTick(1, () => () => {}),
    /resume bar/,
  );
  transport.dispose();
});

test('closed clock stops the queue and timer without disposing the host clock', () => {
  const { clock, timer, transport } = fixture();
  let cleaned = 0;
  transport.scheduleAtTick(1, () => () => cleaned++);
  transport.start();
  clock.state = 'closed';
  timer.fireNext();
  assert.equal(transport.state, 'stopped');
  assert.equal(cleaned, 1);
  assert.equal(timer.callbacks.size, 0);
  assert.equal(clock.state, 'closed');
  transport.dispose();
});
