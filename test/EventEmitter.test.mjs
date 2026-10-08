import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from '../src/core/EventEmitter.ts';

test('supports arbitrary event names without changing delivery semantics', () => {
  const emitter = new EventEmitter();
  const received = [];
  const listener = event => received.push(event);

  for (const name of ['toString', '__proto__', 'constructor']) {
    emitter.on(name, listener);
    emitter.on(name, listener);
    emitter.fire(name, { value: 1, type: 'caller', target: 'caller' });
    emitter.off(name, listener);
    emitter.fire(name, { value: 2 });
  }

  assert.deepEqual(
    received.map(({ type, value, target }) => ({ type, value, target })),
    ['toString', '__proto__', 'constructor'].map(type => ({
      type,
      value: 1,
      target: emitter,
    })),
  );
});
