# Task 03 — Clean up music timer startup failures

**Status:** Planned  
**Priority:** P2

An injected `MusicTimer.set()` can throw after `MusicTransport.start()` has set the transport to running. `MusicLayerMixer.start()` calls transport startup outside its cleanup block, so a retry can start sources with a running transport that has no polling timer.

Reproduce this with a fake timer, then make startup failure leave the mixer and its owned transport in a consistent, retryable state. Consider transport startup and resume independently, including cleanup of issued and pending work. Preserve existing ownership and successful startup behavior.

Acceptance: a throwing timer does not leave sources, listeners, queued work, or a running transport behind; a subsequent successful retry schedules and plays normally. Add meaningful fake-clock and fake-audio tests, and update ownership documentation if the resulting contract changes. Run `npm test`, `npm run format:check`, and `npm run verify:consumer`; finish with `npm run build`. Do not edit generated artifacts by hand or integrate into the game.
