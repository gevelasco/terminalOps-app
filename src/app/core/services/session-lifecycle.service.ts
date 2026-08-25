import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacade } from '@core/services/auth.facade';
import { AuthService } from '@core/services/api/auth';
import { LogoutService } from '@core/services/logout.service';
import { SessionService } from '@core/services/state/session';
import { ToastService } from '@core/notifications/toast.service';
import {
  SESSION_TICK_MS,
  isIdlePastLimit,
  readSharedLastActivity,
  shouldRefreshAccessToken,
  writeSharedLastActivity,
} from '@core/utils/session-lifecycle.util';

const ACTIVITY_EVENTS: readonly (keyof DocumentEventMap)[] = [
  'pointerdown',
  'keydown',
  'touchstart',
];

@Injectable({ providedIn: 'root' })
export class SessionLifecycleService {
  private readonly session = inject(SessionService);
  private readonly auth = inject(AuthFacade);
  private readonly authApi = inject(AuthService);
  private readonly logoutService = inject(LogoutService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private started = false;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private offRemoteLogout: (() => void) | null = null;
  private readonly onActivity = (): void => {
    writeSharedLastActivity();
  };
  private readonly onVisibility = (): void => {
    if (document.visibilityState === 'visible') {
      this.tick();
    }
  };

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    writeSharedLastActivity();
    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, this.onActivity, { passive: true });
    }
    document.addEventListener('visibilitychange', this.onVisibility);
    this.offRemoteLogout = this.session.onRemoteLogout(() => this.handleRemoteLogout());
    this.tickTimer = setInterval(() => this.tick(), SESSION_TICK_MS);
    this.tick();
  }

  stop(): void {
    if (!this.started) {
      return;
    }
    this.started = false;
    for (const event of ACTIVITY_EVENTS) {
      document.removeEventListener(event, this.onActivity);
    }
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.offRemoteLogout?.();
    this.offRemoteLogout = null;
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  private tick(): void {
    if (!this.session.isLoggedIn()) {
      return;
    }
    if (isIdlePastLimit(readSharedLastActivity())) {
      this.endIdleSession();
      return;
    }
    if (shouldRefreshAccessToken(this.session.token())) {
      this.authApi.refreshAccessToken().subscribe({
        error: () => {
          this.stop();
          this.auth.logout();
          void this.router.navigateByUrl('/login', { replaceUrl: true });
        },
      });
    }
  }

  private endIdleSession(): void {
    this.stop();
    this.auth.logout();
    this.toast.show('Cerramos la sesión por inactividad.', 'info');
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private handleRemoteLogout(): void {
    this.stop();
    this.logoutService.clearClientState();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
