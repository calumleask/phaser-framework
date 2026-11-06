import type { Bounds } from './Bounds';

/** Caller-owned static rectangles. Query stamps avoid Sets; geometry must stay unchanged. */
export class StaticBoxIndex<T extends Bounds> {
  readonly boxes: readonly T[];
  readonly bucketSize: number;
  readonly referenceCount: number;
  readonly bucketCount: number;
  private readonly _buckets = new Map<number, readonly number[]>();
  private readonly _minColumn: number;
  private readonly _maxColumn: number;
  private readonly _minRow: number;
  private readonly _maxRow: number;
  private readonly _columns: number;
  private readonly _seen: Uint32Array;
  private _generation = 0;

  constructor(boxes: readonly T[], bucketSize: number) {
    if (!Number.isFinite(bucketSize) || bucketSize <= 0)
      throw new Error('Invalid spatial bucket size');
    this.boxes = boxes;
    this.bucketSize = bucketSize;
    this._seen = new Uint32Array(boxes.length);
    let left = 0,
      right = 0,
      top = 0,
      bottom = 0;
    for (const box of boxes) {
      if (
        !Number.isSafeInteger(Math.floor(box.left / bucketSize)) ||
        !Number.isSafeInteger(Math.floor(box.right / bucketSize)) ||
        !Number.isSafeInteger(Math.floor(box.top / bucketSize)) ||
        !Number.isSafeInteger(Math.floor(box.bottom / bucketSize))
      )
        throw new RangeError(
          'Spatial bucket coordinates must be safe integers',
        );
      left = Math.min(left, box.left);
      right = Math.max(right, box.right);
      top = Math.min(top, box.top);
      bottom = Math.max(bottom, box.bottom);
    }
    this._minColumn = Math.floor(left / bucketSize);
    this._maxColumn = Math.floor(right / bucketSize);
    this._minRow = Math.floor(top / bucketSize);
    this._maxRow = Math.floor(bottom / bucketSize);
    this._columns = this._maxColumn - this._minColumn + 1;
    const buckets = new Map<number, number[]>();
    let references = 0;
    for (let id = 0; id < boxes.length; id++) {
      const box = boxes[id];
      if (box === undefined) continue;
      for (
        let row = Math.floor(box.top / bucketSize);
        row <= Math.floor(box.bottom / bucketSize);
        row++
      ) {
        for (
          let column = Math.floor(box.left / bucketSize);
          column <= Math.floor(box.right / bucketSize);
          column++
        ) {
          const key =
            (row - this._minRow) * this._columns + column - this._minColumn;
          const bucket = buckets.get(key) ?? [];
          bucket.push(id);
          buckets.set(key, bucket);
          references++;
        }
      }
    }
    this._buckets = buckets;
    this.referenceCount = references;
    this.bucketCount = buckets.size;
  }

  /** Inclusive overlap in row/column bucket order; nonfinite bounds return boxes itself. */
  query(
    left: number,
    right: number,
    top: number,
    bottom: number,
  ): readonly T[] {
    if (this.boxes.length === 0) return [];
    if (![left, right, top, bottom].every(Number.isFinite)) return this.boxes;
    this._generation = (this._generation + 1) >>> 0;
    if (this._generation === 0) {
      this._seen.fill(0);
      this._generation = 1;
    }
    const candidates: T[] = [];
    const firstRow = Math.max(this._minRow, Math.floor(top / this.bucketSize));
    const lastRow = Math.min(
      this._maxRow,
      Math.floor(bottom / this.bucketSize),
    );
    const firstColumn = Math.max(
      this._minColumn,
      Math.floor(left / this.bucketSize),
    );
    const lastColumn = Math.min(
      this._maxColumn,
      Math.floor(right / this.bucketSize),
    );
    for (let row = firstRow; row <= lastRow; row++) {
      for (let column = firstColumn; column <= lastColumn; column++) {
        const bucket = this._buckets.get(
          (row - this._minRow) * this._columns + column - this._minColumn,
        );
        if (bucket === undefined) continue;
        for (const id of bucket) {
          if (this._seen[id] === this._generation) continue;
          this._seen[id] = this._generation;
          const box = this.boxes[id];
          if (
            box === undefined ||
            box.right < left ||
            box.left > right ||
            box.bottom < top ||
            box.top > bottom
          )
            continue;
          candidates.push(box);
        }
      }
    }
    return candidates;
  }
}
