export type TripTimelineStepId =
  | 'programmed'
  | 'load'
  | 'departure'
  | 'arrival'
  | 'completion'
  | 'empty_delivery';

export type TripTimelineStepInput = {
  id: TripTimelineStepId;
  iso: string | null | undefined;
};

function isoMs(iso: string | null | undefined): number | null {
  const raw = iso?.trim();
  if (!raw) {
    return null;
  }
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function isTripTimelineStepReached(
  iso: string | null | undefined,
  nowMs: number,
): boolean {
  const ms = isoMs(iso);
  return ms != null && ms <= nowMs;
}

export function buildTripTimelineProgress(
  steps: readonly TripTimelineStepInput[],
  nowMs: number,
): {
  reached: ReadonlySet<TripTimelineStepId>;
  current: TripTimelineStepId | null;
} {
  const reached = new Set<TripTimelineStepId>();
  let current: TripTimelineStepId | null = null;
  for (const step of steps) {
    if (!isTripTimelineStepReached(step.iso, nowMs)) {
      continue;
    }
    reached.add(step.id);
    current = step.id;
  }
  return { reached, current };
}

export function tripTimelineStepsFromSchedule(params: {
  createdAt: string | null | undefined;
  loadDate: string | null | undefined;
  hasLoadStep: boolean;
  departureIso: string | null | undefined;
  arrivalIso: string | null | undefined;
  completionIso: string | null | undefined;
  showEmptyDelivery: boolean;
  emptyDeliveryIso: string | null | undefined;
}): TripTimelineStepInput[] {
  const steps: TripTimelineStepInput[] = [{ id: 'programmed', iso: params.createdAt }];
  if (params.hasLoadStep) {
    steps.push({ id: 'load', iso: params.loadDate });
  }
  steps.push(
    { id: 'departure', iso: params.departureIso },
    { id: 'arrival', iso: params.arrivalIso },
    { id: 'completion', iso: params.completionIso },
  );
  if (params.showEmptyDelivery) {
    steps.push({ id: 'empty_delivery', iso: params.emptyDeliveryIso });
  }
  return steps;
}
