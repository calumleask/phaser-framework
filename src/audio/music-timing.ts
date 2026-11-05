/** Music content uses 24 ticks per quarter note; timing is independent of Phaser. */
export const TICKS_PER_QUARTER = 24;

export type Meter = {
  readonly numerator: number;
  readonly denominator: number;
};

export function ticksPerBar(meter: Meter): number {
  if (
    !Number.isSafeInteger(meter?.numerator) ||
    meter.numerator < 1 ||
    meter.numerator > 12 ||
    ![2, 4, 8, 16].includes(meter.denominator)
  ) {
    throw new Error(
      'Meter must have numerator 1..12 and denominator 2, 4, 8, or 16',
    );
  }
  const ticks = (TICKS_PER_QUARTER * meter.numerator * 4) / meter.denominator;
  if (!Number.isSafeInteger(ticks))
    throw new Error('Meter does not fit the music tick grid');
  return ticks;
}
