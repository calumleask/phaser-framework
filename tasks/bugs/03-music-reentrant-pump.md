# Task 05 — Handle transport state changes during scheduled actions

**Status:** Planned  
**Priority:** P2

A scheduled action can call `pause()` while the transport is pumping. If eligible pending entries remain, the pump can continue and call `tickToTime()` while paused, throwing instead of completing the state transition. `stop()` and `dispose()` clear the pending queue; verify their reentrant behavior separately rather than assuming the same failure.

Add fake-clock tests for actions that pause, stop, or dispose the transport while other work is queued. Make the pump stop processing when its state changes, preserving cleanup, ordering and resume behavior. Check reentrant scheduling and cancellation where relevant to the chosen fix.

Acceptance: state changes inside an action do not cause spurious errors, issue work while stopped or paused, or leak issued work; eligible paused work resumes according to the documented bar rules. Run `npm test`, `npm run format:check`, and `npm run verify:consumer`; finish with `npm run build`. Do not edit generated artifacts by hand or integrate into the game.
