import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/state/session';

export const loginPageGuard: CanActivateFn = async () => {
  const session = inject(SessionService);
  const router = inject(Router);
  await session.whenReady();
  if (session.isLoggedIn()) {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
