# Task 06 — Clarify the mixer clock contract

**Status:** Planned  
**Priority:** P3

The mixer uses its `AudioContext` for sources and gain automation while its transport uses the supplied `MusicClock`. Different timebases can misalign scheduling and playback, but the ownership guidance does not state the requirement.

Document that the transport clock must share the mixer's context timebase, and show the context as the clock in the public example. Evaluate whether validation is possible without rejecting legitimate clock adapters or changing the public contract; document the decision and limitations. Add a focused test if runtime validation is introduced.

Acceptance: a host can identify the required clock relationship and its consequences from the music guide; any validation preserves supported adapters and has appropriate tests. Run checks appropriate to the final change, including `npm run verify:consumer` and a final `npm run build` if public behavior or types change. Do not edit generated artifacts by hand or integrate into the game.
