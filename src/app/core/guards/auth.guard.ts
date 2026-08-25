import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/state/session';

export const authGuard: CanActivateFn = async () => {
  const session = inject(SessionService);
  const router = inject(Router);
  await session.whenReady();
  if (session.isLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
