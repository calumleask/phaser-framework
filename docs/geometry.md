# Static rectangle index

`Geometry.StaticBoxIndex<T extends Bounds>` is a bucket index for static,
caller-owned rectangles. It imports no Phaser, game code, browser globals or
assets. It owns only buckets and query stamps; it has no subscriptions or
disposal method. Release the index with its owning map or scene, and build a
fresh index when the geometry changes.

```ts
import framework, { type Bounds } from 'phaser-framework';

type Obstacle = Bounds & { readonly material: string };
const rectangles: readonly Obstacle[] = [
  { left: -16, right: 80, top: 0, bottom: 16, material: 'stone' },
];
const index = new framework.Geometry.StaticBoxIndex(rectangles, 64);
const hits: readonly Obstacle[] = index.query(80, 100, 16, 32);
// hits[0] is rectangles[0], including its material metadata.
```

The default ESM object exposes `framework.Geometry`; UMD hosts use
`phfw.default.Geometry`. `Bounds` is a type exported from the package root with
readonly `left`, `right`, `top`, and `bottom` number fields. The constructor
accepts `(boxes: readonly T[], bucketSize: number)` and throws
`Invalid spatial bucket size` for nonfinite or nonpositive bucket sizes.
Every rectangle coordinate divided by the bucket size and rounded down must
be a safe integer; otherwise construction throws a `RangeError` with
`Spatial bucket coordinates must be safe integers` before populating buckets.
This rejects nonfinite coordinates and bucket divisions that overflow or
produce counters that cannot advance reliably.
Readonly properties expose the original `boxes` array, `bucketSize`,
`referenceCount` (input-index entries across buckets) and `bucketCount` (occupied
buckets). No cloning, freezing or coordinate normalisation is performed.
Array membership and all indexed coordinates must
remain unchanged for the lifetime of the index; readonly types do not enforce
that obligation at runtime.

The ESM build also emits `dist/geometry.mjs` for Node tooling and other hosts
that need geometry without Phaser browser globals. The root ESM namespace
imports this same module, preserving constructor identity. The pure module has
named `StaticBoxIndex`; its generated types are in
`dist/types/geometry/index.d.ts`. Moonfall's `#framework-geometry` package import
maps the runtime and type paths for Node, TypeScript and Vite. No existing
package root path, default export or UMD shape changes.

`query(left, right, top, bottom): readonly T[]` filters inclusive AABB overlap.
It clips buckets to index extents and visits rows, then columns, then each
bucket's input indices. Results retain that traversal order and the original
rectangle identities, once per input position. Repeating the same rectangle
reference at different input positions can therefore return it more than once.
There is no sorting, exact segment filtering, pooling or shared result buffer.
Generation stamps deduplicate bucket visits and clear on uint32 rollover.

Finite queries allocate a fresh result array, including empty results. An empty
index always returns a fresh empty array. A nonempty index returns `boxes`
itself if any query coordinate is nonfinite. Inverted query bounds are passed
through the existing bucket loops and overlap comparisons: they are not
normalised and can yield an overlap when both endpoints fall in a spanning
rectangle and visited bucket. Callers requiring ordered bounds supply them.
Results remain caller-owned snapshots of references, not snapshots of geometry.

## Extraction and validation

This is an additive extraction from Moonfall's static wall module, preserving
the algorithm and query allocation sites. The game retains wall construction,
metadata, dynamic obstacles, identity guards and navigation/collision policy.
Synthetic tests use a captured pre-extraction fixture with ordered queries,
input identities and bucket counters, plus explicit negative/inclusive bounds,
empty/nonfinite/inverted queries, duplicate input references, generation
rollover, invalid bucket sizes, unsafe bucket coordinates and 140,000 rectangles.
The unsafe-coordinate regression runs in a child process with a timeout so a
nonterminating constructor fails the test. The packed consumer
checks root types with custom metadata and runtime identity in ESM and UMD.

The geometry tests and framework unit tests pass, along with strict
types/lint and packed root types, pure Node, UMD Chrome and bundled ESM checks.
The default Babel iterator helper caused a repeatable query regression;
`.babelrc` now excludes `transform-for-of` only for `StaticBoxIndex.ts`.
Final paired process medians are 125.9 ns/query before and 125.8 ns after, with
overlapping ranges and unchanged query allocation behaviour. The owner approved
the median/range noise plan; human gameplay acceptance remains open.

See Moonfall's [extraction evidence](../../phaser-game/docs/development/performance-static-box-index-2026-11-06.md)
for measurement conditions, full browser results, repository revisions and
remaining acceptance gaps. Framework baseline revision is
`bc029b79896a8d9b9c7ebe4fc36b01049db79f14`; unrelated modified `AGENTS.md`,
`moonfall-modernisation/` and Task 11 platform-boundary files are preserved.
Rollback can leave the unused additive API in place; to remove it, restore only
this extraction's geometry source, entry export, consumer assertions, tests and
docs, then rebuild the complete package. Restore game consumption and refresh
all bundles/declarations from its matching sibling revision. No save migration
or content changes are needed. Package release/version policy remains for owner
review; no second game or native host has been verified.
