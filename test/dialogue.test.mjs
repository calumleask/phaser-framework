import assert from 'node:assert/strict';
import test from 'node:test';
import {
  activeDialogueLine,
  createDialogueDirectorState,
  triggerDialogue,
  finishActiveDialogue,
  expireStaleDialogue,
} from '../src/dialogue/index.ts';

const line = (id, overrides = {}) => ({
  id,
  scenario: id,
  trigger: 'event',
  priority: 'normal',
  cooldownSeconds: 0,
  once: false,
  expirySeconds: null,
  ...overrides,
});
const options = {
  queueLimit: 2,
  globalCooldownSeconds: 1.5,
  eligible: (line, context) => context.allowed.includes(line.id),
};
const trigger = (
  lines,
  state,
  time = 0,
  config = options,
  allowed = lines.map(line => line.id),
) =>
  triggerDialogue(
    lines,
    state,
    { trigger: 'event', nowSeconds: time, context: { allowed } },
    config,
  );

test('one trigger snapshots eligibility, advances random for discarded entries and sorts overflow stably', () => {
  const lines = [
    line('a'),
    line('b'),
    line('c', { priority: 'high' }),
    line('d', { priority: 'high' }),
    line('e'),
  ];
  const result = trigger(lines, createDialogueDirectorState(1)).state;
  assert.equal(activeDialogueLine(lines, result), lines[0]);
  assert.deepEqual(
    result.queue.map(item => item.lineId),
    ['c', 'd'],
  );
  assert.equal(result.nextSequence, 5);
  let random = 1;
  for (let i = 0; i < 5; i++)
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
  assert.equal(result.randomState, random);
  const blocked = trigger(lines, result, 1).state;
  assert.equal(blocked.randomState, random);
});

test('critical interrupts lower priority, bypasses global cooldown and cannot interrupt critical', () => {
  const normal = line('normal');
  const critical = line('critical', {
    priority: 'critical',
    expirySeconds: null,
  });
  const other = line('other', { priority: 'critical' });
  let state = trigger([normal], createDialogueDirectorState(2)).state;
  const result = trigger([normal, critical], state);
  assert.equal(result.interruptedLineId, 'normal');
  state = result.state;
  assert.equal(state.globalCooldownUntilSeconds, 1.5);
  const queued = trigger([normal, critical, other], state);
  assert.equal(queued.interruptedLineId, null);
  assert.equal(queued.state.active.lineId, 'critical');
  assert.equal(queued.state.queue[0].lineId, 'other');
});

test('expiry boundaries and dequeue preserve the trigger context decision', () => {
  const lines = [
    line('active', { expirySeconds: 2 }),
    line('stale', { expirySeconds: 2 }),
    line('queued', { expirySeconds: 3 }),
  ];
  let state = trigger(lines, createDialogueDirectorState(3)).state;
  state = expireStaleDialogue(lines, state, 2, {
    ...options,
    eligible: () => {
      throw Error('dequeue must not call eligibility');
    },
  });
  assert.equal(state.active.lineId, 'queued');
  assert.deepEqual(state.queue, []);
  assert.equal(state.cooldownUntilByScenario.queued, 2);
  state = expireStaleDialogue(lines, state, 3, options);
  assert.equal(state.active, null);
});

test('once and per-scenario cooldown are recorded at start; variants avoid immediate repeats', () => {
  const lines = [
    line('a', { scenario: 'variants', cooldownSeconds: 5 }),
    line('b', { scenario: 'variants', cooldownSeconds: 5 }),
  ];
  let state = trigger(lines, createDialogueDirectorState(4)).state;
  const first = state.active.lineId;
  state = finishActiveDialogue(lines, state, 1, options).state;
  assert.equal(trigger(lines, state, 4).state.active, null);
  state = trigger(lines, state, 5).state;
  assert.notEqual(state.active.lineId, first);
  const once = [line('once', { once: true })];
  state = trigger(once, createDialogueDirectorState(5)).state;
  state = finishActiveDialogue(once, state, 2, options).state;
  assert.equal(trigger(once, state, 20).state.active, null);
});

test('seed, time, options and selected weights retain validation', () => {
  for (const seed of [0, -1, 2 ** 32, NaN])
    assert.throws(() => createDialogueDirectorState(seed), /seed/);
  const state = createDialogueDirectorState(1);
  assert.throws(() => trigger([], state, -1), /time/);
  assert.throws(
    () => trigger([], state, 0, { ...options, queueLimit: 0 }),
    /queue limit/,
  );
  assert.throws(
    () => trigger([], state, 0, { ...options, globalCooldownSeconds: -1 }),
    /cooldown/,
  );
  assert.throws(
    () => trigger([line('a')], state, 0, { ...options, lineWeights: { a: 0 } }),
    /weight/,
  );
});
