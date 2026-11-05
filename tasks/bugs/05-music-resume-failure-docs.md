# Task 07 — Correct resume failure guidance

**Status:** Planned  
**Priority:** P3

The music guide says source-resume failure clears scheduling, but the mixer pauses its transport on that path. The transport can retain eligible pending events for a later resume.

Confirm the actual retry behavior with the implementation and existing tests, then update the guide to describe which work is cancelled, retained, and retried. Distinguish source-resume failure from startup failure and keep the guidance consistent with any changes from Tasks 03–05.

Acceptance: the documented failure and retry contract matches the implementation and identifies the host's disposal responsibility. Run appropriate checks for any code or test changes; do not edit generated artifacts by hand or integrate into the game.
