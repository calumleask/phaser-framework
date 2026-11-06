# Dialogue scheduling

`framework.Dialogue` provides pure, deterministic state transitions. It has no
Phaser, browser, voice, catalogue, timer or persistence imports. The package root
still needs the Phaser peer because other namespaces extend Phaser classes.

```ts
import framework, { type ScheduledLine, type SchedulerOptions } from 'phaser-framework';

type NpcLine = ScheduledLine & { readonly speaker: string };
const lines: readonly NpcLine[] = [{
  id: 'guide.arrival', scenario: 'arrival', trigger: 'nearby',
  priority: 'normal', cooldownSeconds: 5, once: false,
  expirySeconds: 10, speaker: 'Guide',
}];
const options: SchedulerOptions<NpcLine, { nearby: boolean }> = {
  queueLimit: 3, globalCooldownSeconds: 1,
  eligible: (_line, context) => context.nearby,
};
let state = framework.Dialogue.createDialogueDirectorState(42);
state = framework.Dialogue.triggerDialogue(lines, state, {
  trigger: 'nearby', nowSeconds: 0, context: { nearby: true },
}, options).state;
const line: NpcLine | null = framework.Dialogue.activeDialogueLine(lines, state);
state = framework.Dialogue.finishActiveDialogue(lines, state, 2, options).state;
```

Root types: `ScheduledLine`, `SchedulerOptions<L, C>`, `DialoguePriority`,
`DialogueTrigger<C>`, `PendingDialogue`, `DialogueDirectorState`, and
`DialogueTransition`. All five runtime functions live in `Dialogue`:

- `createDialogueDirectorState(seed)` requires a positive uint32 seed.
- `triggerDialogue(lines, state, event, options)` returns
  `{ state, interruptedLineId }`.
- `finishActiveDialogue(lines, state, nowSeconds, options)` returns the same
  transition shape and starts the next unexpired queued entry.
- `expireStaleDialogue(lines, state, nowSeconds, options)` returns state and expires
  both active and queued entries at `expiresAtSeconds <= nowSeconds`.
- `activeDialogueLine(lines, state)` returns the supplied line object (and subtype)
  or null.

Hosts supply finite nonnegative time, a positive integer queue limit, nonnegative
global cooldown and optional positive per-ID weights. `expirySeconds` is a host
descriptor: null means durable; hosts supply positive durations otherwise. The
seeded LCG, input scenario/variant order, one random advance per accepted scenario,
no immediate variant repeat, priority/sequence ordering and queue truncation match
the original scheduler. Once history and cooldowns start when a line starts, not
when it queues. Critical lines bypass global cooldown and interrupt lower priority
active entries; another critical line queues.

The eligibility callback must be pure. Scheduler gates use the state snapshot
after queued expiry pruning, shared across all scenarios in one trigger. Global
cooldown started by an earlier scenario does not block later scenarios in that
same trigger. Host eligibility is evaluated during candidate selection and is
never checked on dequeue. Queued entries retain their original absolute expiry.
Triggering prunes queued expiry; active expiry advances through the explicit
expiry function. The host controls call order and playback interruption handling.

Create one state per run, advance with host time, and discard on shutdown. There
are no subscriptions or resources to dispose. Keep lines available while entries
reference them; starting an unknown queued ID throws. Presentation, voice, skip,
ducking, event bindings and saves remain host responsibilities.

## Verification and rollback (2026-11-05)

Task engine-005 was requested explicitly, accepting the generic eligibility/expiry
boundary. Framework baseline revision:
`86e8c40c93386f179e899d4a7998cf58adf88228`; game baseline:
`5388569ee1ab5a82a7db8fc3bcca0ff642808b20`. Pre-existing sibling changes were
`AGENTS.md`, `moonfall-modernisation/`, and the Task 11 platform-boundaries task
and prompt. Game changes were `.gitignore`, `index.html`, and
`src/game-objects/player/sprint-energy.ts`. Preserve them on rollback.

Five synthetic scheduler tests and all 32 framework tests pass, including lint
and strict types; formatting passes. Packed root types preserve custom line and
context types, and both UMD and bundled ESM Chrome consumers exercise all five
functions. Phaser remains 4.2.1 and the package version remains 2.0.0; release
version policy still requires owner review.

Moonfall keeps its original policy facade and defaults. The copied production
bundle passes 35 targeted game tests. The pre-extraction oracle captures 249
transitions for seeds 1, 42 and 4294967295, including state, selected IDs, random
advancement, multi-scenario snapshots, overflow, interruption, cooldown, once,
weights and exact active/queued expiry boundaries. Fixture SHA-256:
`7bfb08bfe2541ca6ba1252350608ce2c504cafc085c3b92c8fab1493b182065f`.
The game full Node gate reports 574 passes and 24 failures, all reproduced with
the original director; later chained gates were not reached. Game lint/types,
direct Vite build and focused Chrome adapter checks pass. Synthetic sounds check
fallback, skip callback, radio/story blocking, ducking controls and shutdown for
Campaign/Survival. Audible playback, physical X input and full gameplay remain
manual acceptance work. No second game or native host has been validated.

Rollback restores only this task's additive dialogue source/exports/tests/docs
and the game facade/test wiring, then rebuilds and copies the complete previous
framework package. Do not edit generated output manually. See the game migration
roadmap for integration hashes and validation limitations. No geometry task was
started.
