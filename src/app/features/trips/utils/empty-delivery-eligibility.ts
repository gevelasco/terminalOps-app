import {
  isTripFollowUpLocked,
  type TripFollowUpLockInput,
} from './trip-post-completion-lock';

/** Entrega de vacío: opcional; se puede registrar en curso o completada. */
export function canRegisterTripEmptyDelivery(
  trip: TripFollowUpLockInput | null | undefined,
  canWrite: boolean,
  nowMs: number = Date.now(),
): boolean {
  if (!canWrite || !trip) {
    return false;
  }
  const status = trip.status;
  if (status !== 'in_transit' && status !== 'completed') {
    return false;
  }
  return !isTripFollowUpLocked(trip, nowMs);
}
