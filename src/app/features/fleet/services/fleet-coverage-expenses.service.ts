import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { catchError, finalize, of, Subscription } from 'rxjs';
import { ExpensesService } from '@core/services/api/expenses';
import type { Expense } from '@shared/models/logistics.models';
import { fleetInsuranceExpensesListParams } from '@features/fleet/utils/fleet-coverage-expenses.util';
import { createRequestGeneration } from '@shared/utils/request-generation';

/**
 * Ledger de seguro para iconos de póliza en tablas Unidades/Equipo.
 * No se pide al entrar a Flota (overview); el drawer de cobertura carga por activo.
 */
@Injectable()
export class FleetCoverageExpensesFeatureService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly expensesApi = inject(ExpensesService);
  private readonly requestGen = createRequestGeneration();

  private readonly _expenses = signal<readonly Expense[]>([]);
  private readonly _loading = signal(false);
  private readonly _hydrated = signal(false);

  private initialLoadStarted = false;
  private disposed = false;
  private fetchSub: Subscription | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.dispose());
  }

  readonly expenses = this._expenses.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly hydrated = this._hydrated.asReadonly();

  hasLoadedOnce(): boolean {
    return this.initialLoadStarted;
  }

  loadExpenses(): void {
    if (this.disposed || this.initialLoadStarted) {
      return;
    }
    this.initialLoadStarted = true;
    this.runFetch();
  }

  refreshExpenses(): void {
    if (this.disposed) {
      return;
    }
    this.initialLoadStarted = true;
    this.runFetch();
  }

  dispose(): void {
    this.disposed = true;
    this.initialLoadStarted = false;
    this.fetchSub?.unsubscribe();
    this.fetchSub = null;
    this._expenses.set([]);
    this._loading.set(false);
    this._hydrated.set(false);
    this.requestGen.invalidate();
  }

  private runFetch(): void {
    if (this.disposed) {
      return;
    }
    const requestId = this.requestGen.next();
    this.fetchSub?.unsubscribe();
    this._loading.set(true);
    this.fetchSub = this.expensesApi
      .getAllExpenses(fleetInsuranceExpensesListParams())
      .pipe(
        catchError(() => of([] as Expense[])),
        finalize(() => {
          if (this.requestGen.isCurrent(requestId)) {
            this._loading.set(false);
            this._hydrated.set(true);
          }
        }),
      )
      .subscribe((rows) => {
        if (!this.disposed && this.requestGen.isCurrent(requestId)) {
          this._expenses.set(rows);
        }
      });
  }
}
