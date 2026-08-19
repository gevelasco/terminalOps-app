import type { Operator, Trip, TripIncident } from '@shared/models/logistics.models';
import { tripIncidentAuthorLabel } from '@shared/utils/trip-incident-feed';
import {
  isTripBitacoraIncident,
  tripBitacoraSorted,
  tripMarkedIncidentsSorted,
} from './trip-bitacora';

/** `true` si la maniobra tiene incidente (flag API o bitácora marcada). */
export function tripHasIncidents(
  trip: Pick<Trip, 'incidents'> & { hasIncident?: boolean },
): boolean {
  if (trip.hasIncident === true) {
    return true;
  }
  return (trip.incidents ?? []).some(isTripBitacoraIncident);
}

export function tripIncidentsSorted(trip: Pick<Trip, 'incidents'>): TripIncident[] {
  return tripMarkedIncidentsSorted(trip.incidents);
}

export function tripBitacoraEntriesSorted(trip: Pick<Trip, 'incidents'>): TripIncident[] {
  return tripBitacoraSorted(trip.incidents);
}

export function tripIncidentPostedBy(
  inc: TripIncident,
  operators: readonly Operator[] = [],
): string {
  return tripIncidentAuthorLabel(inc, operators);
}
