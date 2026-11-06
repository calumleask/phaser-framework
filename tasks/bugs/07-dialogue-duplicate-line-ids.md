# Bug 07 — Define and enforce dialogue line identity

**Status:** Planned  
**Priority:** P2

Pending entries store a line ID, and activation and lookup resolve that ID with the first matching line. If two supplied lines share an ID, selection can choose one while activation records the other's scenario, priority or cooldown and returns the wrong object. The public guide does not currently state that IDs must be unique.

Define the scheduler's identity contract, including whether IDs must be unique and stable while active or queued entries refer to them. Decide whether to validate duplicate IDs at an appropriate boundary or explicitly make uniqueness a host obligation; account for runtime cost and preserve the existing game's selection and state transitions for valid catalogues. Document the decision and any consequences of changing or removing lines during a run.

Acceptance: tests demonstrate the duplicate-ID behavior and verify the chosen contract, including correct activation, history and canonical-object lookup for valid lines. Existing game parity traces remain unchanged. Update the public dialogue guide and relevant declarations if the API changes. Run `npm test`, `npm run format:check` and `npm run verify:consumer`; finish with `npm run build`. Do not edit generated artifacts by hand.
