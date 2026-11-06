# Bug 06 — Handle prototype-named dialogue IDs in weights

**Status:** Planned  
**Priority:** P2

The scheduler reads `lineWeights` with ordinary property lookup. When a line ID is an inherited object property such as `toString`, supplying an empty weights object returns the inherited function instead of the default weight and causes selection to throw. `ScheduledLine.id` permits arbitrary strings.

Use an own-property lookup when resolving optional weights. Preserve explicit positive weights, the default weight of one, seeded selection and random advancement for existing inputs. Consider other prototype-named IDs and records without an object prototype.

Acceptance: meaningful scheduler tests cover omitted weights, an empty weights object, explicit weights and prototype-named IDs; inherited properties do not act as weights. Existing dialogue parity traces continue to pass. Run `npm test`, `npm run format:check` and `npm run verify:consumer`; finish with `npm run build`. Do not edit generated artifacts by hand.
