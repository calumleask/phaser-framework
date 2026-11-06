export type DialoguePriority = 'critical' | 'high' | 'normal' | 'low';
export type ScheduledLine = {
  readonly id: string;
  readonly scenario: string;
  readonly trigger: string;
  readonly priority: DialoguePriority;
  readonly cooldownSeconds: number;
  readonly once: boolean;
  readonly expirySeconds: number | null;
};
export type SchedulerOptions<L extends ScheduledLine, C> = {
  readonly queueLimit: number;
  readonly globalCooldownSeconds: number;
  readonly lineWeights?: Readonly<Record<string, number>>;
  readonly eligible: (line: L, context: C) => boolean;
};
export type DialogueTrigger<C> = {
  readonly trigger: string;
  readonly nowSeconds: number;
  readonly context: C;
};
export type PendingDialogue = {
  readonly lineId: string;
  readonly scenario: string;
  readonly priority: DialoguePriority;
  readonly sequence: number;
  readonly expiresAtSeconds: number | null;
};

export type DialogueDirectorState = {
  readonly active: PendingDialogue | null;
  readonly queue: readonly PendingDialogue[];
  readonly playedScenarioIds: ReadonlySet<string>;
  readonly cooldownUntilByScenario: Readonly<Record<string, number>>;
  readonly lastLineIdByScenario: Readonly<Record<string, string>>;
  readonly globalCooldownUntilSeconds: number;
  readonly randomState: number;
  readonly nextSequence: number;
};

export type DialogueTransition = {
  readonly state: DialogueDirectorState;
  readonly interruptedLineId: string | null;
};

const priorityRank: Readonly<Record<DialoguePriority, number>> = {
  critical: 3,
  high: 2,
  normal: 1,
  low: 0,
};

function validateSeed(seed: number): void {
  if (!Number.isSafeInteger(seed) || seed < 1 || seed > 0xffffffff)
    throw new Error('Dialogue seed must be a positive uint32');
}

function validateTime(nowSeconds: number): void {
  if (!Number.isFinite(nowSeconds) || nowSeconds < 0)
    throw new Error('Dialogue time must be a nonnegative finite number');
}

function resolvedOptions(options: {
  readonly queueLimit: number;
  readonly globalCooldownSeconds: number;
}): { readonly queueLimit: number; readonly globalCooldownSeconds: number } {
  if (!Number.isSafeInteger(options.queueLimit) || options.queueLimit < 1)
    throw new Error('Dialogue queue limit must be a positive integer');
  if (
    !Number.isFinite(options.globalCooldownSeconds) ||
    options.globalCooldownSeconds < 0
  )
    throw new Error('Dialogue global cooldown must be nonnegative');
  return options;
}
function nextRandom(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function lineWeight(
  line: ScheduledLine,
  options: { readonly lineWeights?: Readonly<Record<string, number>> },
): number {
  const weight = options.lineWeights?.[line.id] ?? 1;
  if (!Number.isFinite(weight) || weight <= 0)
    throw new Error(`Dialogue weight for ${line.id} must be positive`);
  return weight;
}

function chooseVariant<L extends ScheduledLine>(
  candidates: readonly L[],
  previousLineId: string | undefined,
  randomState: number,
  options: { readonly lineWeights?: Readonly<Record<string, number>> },
): { readonly line: L; readonly randomState: number } {
  const withoutRepeat = candidates.filter(line => line.id !== previousLineId);
  const pool = withoutRepeat.length > 0 ? withoutRepeat : candidates;
  const weights = pool.map(line => lineWeight(line, options));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const updatedRandomState = nextRandom(randomState);
  let target = (updatedRandomState / 0x100000000) * total;
  for (let index = 0; index < pool.length; index += 1) {
    const line = pool[index];
    const weight = weights[index];
    if (line === undefined || weight === undefined) continue;
    target -= weight;
    if (target < 0) return { line, randomState: updatedRandomState };
  }
  const fallback = pool[pool.length - 1];
  if (fallback === undefined)
    throw new Error('Dialogue scenario has no variants');
  return { line: fallback, randomState: updatedRandomState };
}

function scenarioEligible<L extends ScheduledLine, C>(
  line: L,
  state: DialogueDirectorState,
  event: DialogueTrigger<C>,
  options: SchedulerOptions<L, C>,
): boolean {
  if (
    state.active?.scenario === line.scenario ||
    state.queue.some(item => item.scenario === line.scenario)
  )
    return false;
  if (line.once && state.playedScenarioIds.has(line.scenario)) return false;
  if ((state.cooldownUntilByScenario[line.scenario] ?? 0) > event.nowSeconds)
    return false;
  if (
    line.priority !== 'critical' &&
    state.globalCooldownUntilSeconds > event.nowSeconds
  )
    return false;
  return options.eligible(line, event.context);
}

function pendingForLine(
  line: ScheduledLine,
  sequence: number,
  nowSeconds: number,
): PendingDialogue {
  return {
    lineId: line.id,
    scenario: line.scenario,
    priority: line.priority,
    sequence,
    expiresAtSeconds:
      line.expirySeconds !== null ? nowSeconds + line.expirySeconds : null,
  };
}

function pruneExpired(
  queue: readonly PendingDialogue[],
  nowSeconds: number,
): readonly PendingDialogue[] {
  return queue.filter(
    item =>
      item.expiresAtSeconds === null || item.expiresAtSeconds > nowSeconds,
  );
}

function sortedQueue(
  queue: readonly PendingDialogue[],
  queueLimit: number,
): readonly PendingDialogue[] {
  return [...queue]
    .sort(
      (left, right) =>
        priorityRank[right.priority] - priorityRank[left.priority] ||
        left.sequence - right.sequence,
    )
    .slice(0, queueLimit);
}

function startPending(
  lines: readonly ScheduledLine[],
  state: DialogueDirectorState,
  pending: PendingDialogue,
  nowSeconds: number,
  globalCooldownSeconds: number,
): DialogueDirectorState {
  const line = lines.find(item => item.id === pending.lineId);
  if (line === undefined)
    throw new Error(`Unknown pending dialogue line ${pending.lineId}`);
  const playedScenarioIds = new Set(state.playedScenarioIds);
  playedScenarioIds.add(line.scenario);
  return {
    ...state,
    active: pending,
    playedScenarioIds,
    cooldownUntilByScenario: {
      ...state.cooldownUntilByScenario,
      [line.scenario]: nowSeconds + line.cooldownSeconds,
    },
    lastLineIdByScenario: {
      ...state.lastLineIdByScenario,
      [line.scenario]: line.id,
    },
    globalCooldownUntilSeconds:
      line.priority === 'critical'
        ? state.globalCooldownUntilSeconds
        : nowSeconds + globalCooldownSeconds,
  };
}

function startNext(
  lines: readonly ScheduledLine[],
  state: DialogueDirectorState,
  nowSeconds: number,
  config: ReturnType<typeof resolvedOptions>,
): DialogueDirectorState {
  if (state.active !== null) return state;
  const queue = pruneExpired(state.queue, nowSeconds);
  const [next, ...remaining] = queue;
  if (next === undefined) return { ...state, queue };
  return startPending(
    lines,
    { ...state, queue: remaining },
    next,
    nowSeconds,
    config.globalCooldownSeconds,
  );
}

export function createDialogueDirectorState(
  seed: number,
): DialogueDirectorState {
  validateSeed(seed);
  return {
    active: null,
    queue: [],
    playedScenarioIds: new Set(),
    cooldownUntilByScenario: {},
    lastLineIdByScenario: {},
    globalCooldownUntilSeconds: 0,
    randomState: seed,
    nextSequence: 0,
  };
}

export function triggerDialogue<L extends ScheduledLine, C>(
  lines: readonly L[],
  state: DialogueDirectorState,
  event: DialogueTrigger<C>,
  options: SchedulerOptions<L, C>,
): DialogueTransition {
  validateTime(event.nowSeconds);
  const config = resolvedOptions(options);
  let nextState: DialogueDirectorState = {
    ...state,
    queue: pruneExpired(state.queue, event.nowSeconds),
  };
  const eligibilityState = nextState;
  let interruptedLineId: string | null = null;
  const scenarioIds = [
    ...new Set(
      lines
        .filter(line => line.trigger === event.trigger)
        .map(line => line.scenario),
    ),
  ];

  for (const scenario of scenarioIds) {
    const candidates = lines.filter(
      line =>
        line.scenario === scenario &&
        line.trigger === event.trigger &&
        scenarioEligible(line, eligibilityState, event, options),
    );
    if (candidates.length === 0) continue;
    const selected = chooseVariant(
      candidates,
      nextState.lastLineIdByScenario[scenario],
      nextState.randomState,
      options,
    );
    const pending = pendingForLine(
      selected.line,
      nextState.nextSequence,
      event.nowSeconds,
    );
    nextState = {
      ...nextState,
      randomState: selected.randomState,
      nextSequence: nextState.nextSequence + 1,
    };

    if (
      pending.priority === 'critical' &&
      nextState.active !== null &&
      priorityRank[nextState.active.priority] < priorityRank.critical
    ) {
      interruptedLineId = nextState.active.lineId;
      nextState = startPending(
        lines,
        { ...nextState, active: null },
        pending,
        event.nowSeconds,
        config.globalCooldownSeconds,
      );
      continue;
    }
    if (nextState.active === null) {
      nextState = startPending(
        lines,
        nextState,
        pending,
        event.nowSeconds,
        config.globalCooldownSeconds,
      );
      continue;
    }
    nextState = {
      ...nextState,
      queue: sortedQueue([...nextState.queue, pending], config.queueLimit),
    };
  }

  return { state: nextState, interruptedLineId };
}

export function finishActiveDialogue<L extends ScheduledLine, C>(
  lines: readonly L[],
  state: DialogueDirectorState,
  nowSeconds: number,
  options: SchedulerOptions<L, C>,
): DialogueTransition {
  validateTime(nowSeconds);
  const config = resolvedOptions(options);
  return {
    state: startNext(
      lines,
      {
        ...state,
        active: null,
        queue: pruneExpired(state.queue, nowSeconds),
      },
      nowSeconds,
      config,
    ),
    interruptedLineId: null,
  };
}

export function expireStaleDialogue<L extends ScheduledLine, C>(
  lines: readonly L[],
  state: DialogueDirectorState,
  nowSeconds: number,
  options: SchedulerOptions<L, C>,
): DialogueDirectorState {
  validateTime(nowSeconds);
  const config = resolvedOptions(options);
  const activeExpired =
    state.active?.expiresAtSeconds !== null &&
    state.active?.expiresAtSeconds !== undefined &&
    state.active.expiresAtSeconds <= nowSeconds;
  return startNext(
    lines,
    {
      ...state,
      active: activeExpired ? null : state.active,
      queue: pruneExpired(state.queue, nowSeconds),
    },
    nowSeconds,
    config,
  );
}

export function activeDialogueLine<L extends ScheduledLine>(
  lines: readonly L[],
  state: DialogueDirectorState,
): L | null {
  if (state.active === null) return null;
  return lines.find(line => line.id === state.active?.lineId) ?? null;
}
