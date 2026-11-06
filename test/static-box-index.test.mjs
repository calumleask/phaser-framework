import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import test from 'node:test';
import { URL } from 'node:url';
import { StaticBoxIndex } from '../src/geometry/StaticBoxIndex.ts';

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/static-box-queries.json', import.meta.url)),
);

test('captured pre-extraction queries preserve ordering, input identity and counters', () => {
  const boxes = fixture.inputIds.map(id => fixture.boxes[id]);
  const index = new StaticBoxIndex(boxes, fixture.bucketSize);
  assert.equal(index.boxes, boxes);
  assert.equal(index.bucketSize, fixture.bucketSize);
  assert.equal(index.referenceCount, fixture.referenceCount);
  assert.equal(index.bucketCount, fixture.bucketCount);
  for (const [i, query] of fixture.queries.entries()) {
    const found = index.query(...query);
    assert.deepEqual(
      found.map(box => box.id),
      fixture.results[i],
      `query ${i}`,
    );
    for (const [j, box] of found.entries())
      assert.equal(box, fixture.boxes[fixture.results[i][j]]);
  }
});

test('inclusive negative bucket boundaries return each input position in traversal order', () => {
  const positive = { left: 0, right: 16, top: 0, bottom: 16, tag: 'positive' };
  const negative = {
    left: -16,
    right: 0,
    top: -16,
    bottom: 0,
    tag: 'negative',
  };
  const span = { left: -32, right: 32, top: -32, bottom: 32, tag: 'span' };
  const boxes = [positive, negative, span, negative];
  const index = new StaticBoxIndex(boxes, 16);
  const found = index.query(-16, 0, -16, 0);
  assert.deepEqual(found, [negative, span, negative, positive]);
  assert.equal(found[0], negative);
  assert.equal(found[1], span);
  assert.equal(found[2], negative);
  assert.equal(found[3], positive);
  assert.equal(index.referenceCount, 37);
  assert.equal(index.bucketCount, 25);
  assert.notEqual(index.query(-16, 0, -16, 0), found);
  assert.equal(Object.isFrozen(boxes), false);
  assert.equal(Object.isFrozen(span), false);
});

test('empty, nonfinite, outside and inverted queries retain existing semantics', () => {
  const boxes = [{ left: -10, right: 10, top: -10, bottom: 10 }];
  const index = new StaticBoxIndex(boxes, 16);
  for (const value of [NaN, Infinity, -Infinity]) {
    for (let position = 0; position < 4; position++) {
      const query = [0, 0, 0, 0];
      query[position] = value;
      assert.equal(index.query(...query), boxes);
    }
  }
  assert.deepEqual(index.query(9, 1, 9, 1), boxes);
  assert.deepEqual(index.query(17, -17, 0, 0), []);
  assert.deepEqual(index.query(1000, 1001, 1000, 1001), []);
  const empty = [];
  const emptyIndex = new StaticBoxIndex(empty, 16);
  assert.equal(emptyIndex.referenceCount, 0);
  assert.equal(emptyIndex.bucketCount, 0);
  const first = emptyIndex.query(NaN, Infinity, -Infinity, 0);
  assert.deepEqual(first, []);
  assert.notEqual(first, empty);
  assert.notEqual(first, emptyIndex.query(0, 0, 0, 0));
});

test('generation rollover clears old stamps and retains duplicate input positions', () => {
  const box = { left: -20, right: 20, top: -20, bottom: 20 };
  const index = new StaticBoxIndex([box, box], 16);
  const first = index.query(-20, 20, -20, 20);
  index._generation = 0xffffffff;
  const wrapped = index.query(-20, 20, -20, 20);
  assert.equal(index._generation, 1);
  assert.deepEqual(wrapped, first);
  assert.equal(wrapped.length, 2);
  assert.equal(wrapped[0], box);
  assert.equal(wrapped[1], box);
  assert.deepEqual(index.query(-20, 20, -20, 20), first);
});

test('140,000 rectangles avoid function argument limits and retain every identity', () => {
  const boxes = Array.from({ length: 140000 }, (_, id) => ({
    left: 1,
    right: 2,
    top: 1,
    bottom: 2,
    id,
  }));
  const index = new StaticBoxIndex(boxes, 256);
  const found = index.query(1, 2, 1, 2);
  assert.equal(found.length, boxes.length);
  for (const [id, box] of found.entries()) assert.equal(box, boxes[id]);
  assert.equal(index.referenceCount, boxes.length);
  assert.equal(index.bucketCount, 1);
});

test('unsafe bucket coordinates throw without hanging construction', () => {
  const moduleUrl = new URL(
    '../src/geometry/StaticBoxIndex.ts',
    import.meta.url,
  ).href;
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
        import assert from 'node:assert/strict';
        import { StaticBoxIndex } from ${JSON.stringify(moduleUrl)};
        for (const field of ['left', 'right', 'top', 'bottom']) {
          for (const value of [NaN, Infinity, -Infinity, 2 ** 53, -(2 ** 53)]) {
            const box = { left: 0, right: 0, top: 0, bottom: 0, [field]: value };
            assert.throws(() => new StaticBoxIndex([box], 1), {
              name: 'RangeError',
              message: 'Spatial bucket coordinates must be safe integers',
            });
          }
        }
        assert.throws(
          () => new StaticBoxIndex([{left:1,right:1,top:1,bottom:1}], Number.MIN_VALUE),
          RangeError,
        );
        for (const value of [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]) {
          const box = {left:value,right:value,top:value,bottom:value};
          assert.equal(new StaticBoxIndex([box], 1).query(value,value,value,value)[0], box);
        }
      `,
    ],
    { timeout: 5000, windowsHide: true, stdio: 'pipe' },
  );
});

test('bucket size is validated; caller geometry is not cloned or normalised', () => {
  for (const bucketSize of [0, -1, NaN, Infinity, -Infinity])
    assert.throws(
      () => new StaticBoxIndex([], bucketSize),
      /Invalid spatial bucket size/,
    );
  const boxes = [{ left: 5, right: 1, top: 5, bottom: 1, metadata: 'host' }];
  const index = new StaticBoxIndex(boxes, 16);
  assert.equal(index.boxes, boxes);
  assert.equal(index.query(NaN, 0, 0, 0), boxes);
});
