import type { WritableSignal } from '@angular/core';

/**
 * Prevents duplicate submits while an async save is in flight.
 * Returns false if already busy; otherwise sets the flag and returns true.
 */
export function beginInFlight(flag: WritableSignal<boolean>): boolean {
  if (flag()) {
    return false;
  }
  flag.set(true);
  return true;
}
