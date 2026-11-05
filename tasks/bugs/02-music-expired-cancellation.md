# Task 04 — Retire elapsed music work before cancellation

**Status:** Planned  
**Priority:** P2

Issued transport entries are retired during polling. A handle cancelled after its audio timestamp but before the next poll can still invoke its cleanup, even though playback has begun. Pause or suspension in that interval can also clean up elapsed work.

Reproduce the interval with a fake clock. Ensure cancellation and freezing distinguish future issued work from elapsed work, preserving cleanup for future events and the existing boundary and ordering contracts. Account for clock suspension and exact timestamp tolerances explicitly.

Acceptance: tests cover cancellation, pause and suspension on both sides of the scheduled timestamp, including repeated cancellation; elapsed work is not undone and future work is cleaned up once. Document any clarified timing contract. Run `npm test`, `npm run format:check`, and `npm run verify:consumer`; finish with `npm run build`. Do not edit generated artifacts by hand or integrate into the game.
