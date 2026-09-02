import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, expand, map, Observable, reduce } from 'rxjs';
import type {
  Expense,
  ExpenseAttachedDocument,
  ExpenseDocumentSlot,
} from '@shared/models/logistics.models';
import { SessionService } from '../state/session';
import { companyResourceUrl, requireCompanyId, resourceByIdUrl } from './api-url';

/**
 * Campos que el API deriva o denormaliza en lecturas.
 * Enviarlos en POST/PATCH dispara 400 (`property X should not exist`).
 */
type ExpenseReadOnlyField =
  | 'id'
  | 'documents'
  | 'maintenanceTarget'
  | 'insuranceTarget'
  | 'fleetRelationLabel'
  | 'relatedUnitLabel'
  | 'relatedEquipmentLabel'
  | 'relatedOperatorLabel'
  | 'tripManeuverCode'
  | 'incurredDate'
  | 'isOperationalProvision';

const EXPENSE_READ_ONLY_FIELDS: readonly ExpenseReadOnlyField[] = [
  'id',
  'documents',
  'maintenanceTarget',
  'insuranceTarget',
  'fleetRelationLabel',
  'relatedUnitLabel',
  'relatedEquipmentLabel',
  'relatedOperatorLabel',
  'tripManeuverCode',
  'incurredDate',
  'isOperationalProvision',
];

/** Payload de alta/edición: binarios van por POST …/documents, no en este JSON. */
export type ExpenseWritePayload = Omit<Expense, ExpenseReadOnlyField>;

function omitExpenseReadOnlyFields<T extends object>(payload: T): T {
  const next = { ...payload } as T & Record<string, unknown>;
  for (const key of EXPENSE_READ_ONLY_FIELDS) {
    delete next[key];
  }
  return next;
}

export interface ExpensesListParams {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  q?: string;
  kind?: string;
  relatedUnitId?: string;
  relatedEquipmentId?: string;
  tripId?: string;
  tripIds?: string;
}

export interface ExpensesListResponse {
  items: Expense[];
  total: number;
  page: number;
  limit: number;
  totalAmount: string | number;
}

export interface ExpensesCalendarParams {
  from: string;
  to: string;
  page?: number;
  limit?: number;
  /** Una sola ventana de calendario; no paginar. */
  all?: boolean;
}

export type ExpenseCalendarEntryType = 'actual';

export interface ExpenseCalendarItem {
  entryType: ExpenseCalendarEntryType;
  sortDate: string;
  id: string;
  rubroLabel: string;
  conceptLabel: string;
  amount: string | number;
  currency: string;
  dateYmd: string;
  statusLabel: string;
  expenseId?: number;
  expense?: Expense;
}

export interface ExpenseCalendarMarker {
  label: string;
  amount: string | number;
  pct: number;
  tone: 'primary' | 'muted' | 'accent';
}

export interface ExpensesCalendarSummary {
  actualCount: number;
  actualTotalAmount: string | number;
  grandCount: number;
  grandTotalAmount: string | number;
}

export interface ExpensesCalendarResponse {
  from: string;
  to: string;
  items: ExpenseCalendarItem[];
  total: number;
  page: number;
  limit: number;
  markers: ExpenseCalendarMarker[];
  summary: ExpensesCalendarSummary;
}

function normalizeExpensePublicId(value: unknown): string {
  if (value == null || value === '') {
    return '';
  }
  return String(value).trim();
}

function mapApiExpenseDocuments(
  docs: Expense['documents'] | undefined,
): ExpenseAttachedDocument[] | undefined {
  if (!Array.isArray(docs)) {
    return undefined;
  }
  return docs.map((doc) => {
    const raw = doc as ExpenseAttachedDocument & { hasStoredFile?: boolean };
    return {
      id: normalizeExpensePublicId(raw.id),
      fileName: String(raw.fileName ?? '').trim(),
      slot: 'receipt' as ExpenseDocumentSlot,
      ...(raw.addedAt?.trim() ? { addedAt: raw.addedAt.trim() } : {}),
      hasStoredFile: raw.hasStoredFile === true,
    };
  });
}

function mapExpenseStoredDocument(
  raw: Record<string, unknown>,
  fallback: { fileName: string; slot: ExpenseDocumentSlot },
): ExpenseAttachedDocument {
  return {
    id: String(raw['id'] ?? ''),
    fileName: String(raw['fileName'] ?? fallback.fileName),
    slot: (String(raw['slot'] ?? fallback.slot) as ExpenseDocumentSlot),
    addedAt: String(raw['addedAt'] ?? new Date().toISOString().slice(0, 10)),
    hasStoredFile: raw['hasStoredFile'] !== false,
  };
}

function mapApiExpenseRow(row: Expense): Expense {
  const amountRaw = row.amount as unknown;
  const amount =
    typeof amountRaw === 'number'
      ? amountRaw
      : Number(String(amountRaw ?? '').replace(/,/g, '')) || 0;
  const documents = mapApiExpenseDocuments(row.documents);

  return {
    ...row,
    id: normalizeExpensePublicId(row.id),
    tripId: normalizeExpensePublicId(row.tripId),
    tripManeuverCode:
      typeof row.tripManeuverCode === 'string' && row.tripManeuverCode.trim()
        ? row.tripManeuverCode.trim()
        : undefined,
    fleetRelationLabel:
      typeof row.fleetRelationLabel === 'string' && row.fleetRelationLabel.trim()
        ? row.fleetRelationLabel.trim()
        : undefined,
    relatedUnitLabel:
      typeof row.relatedUnitLabel === 'string' && row.relatedUnitLabel.trim()
        ? row.relatedUnitLabel.trim()
        : undefined,
    relatedEquipmentLabel:
      typeof row.relatedEquipmentLabel === 'string' &&
      row.relatedEquipmentLabel.trim()
        ? row.relatedEquipmentLabel.trim()
        : undefined,
    relatedOperatorLabel:
      typeof row.relatedOperatorLabel === 'string' &&
      row.relatedOperatorLabel.trim()
        ? row.relatedOperatorLabel.trim()
        : undefined,
    amount,
    ...(documents ? { documents } : {}),
    ...(row.relatedUnitId != null && row.relatedUnitId !== ''
      ? { relatedUnitId: normalizeExpensePublicId(row.relatedUnitId) }
      : {}),
    ...(row.relatedEquipmentId != null && row.relatedEquipmentId !== ''
      ? { relatedEquipmentId: normalizeExpensePublicId(row.relatedEquipmentId) }
      : {}),
    ...(row.relatedOperatorId != null && row.relatedOperatorId !== ''
      ? { relatedOperatorId: normalizeExpensePublicId(row.relatedOperatorId) }
      : {}),
  };
}

function parseMoneyAmount(raw: string | number | undefined): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : 0;
  }
  return Number(String(raw ?? '').replace(/,/g, '')) || 0;
}

function mapExpensesCalendarResponse(res: ExpensesCalendarResponse): ExpensesCalendarResponse {
  return {
    ...res,
    items: res.items.map((item) => ({
      ...item,
      amount: parseMoneyAmount(item.amount),
      expense: item.expense ? mapApiExpenseRow(item.expense) : undefined,
    })),
    markers: res.markers.map((marker) => ({
      ...marker,
      amount: parseMoneyAmount(marker.amount),
    })),
    summary: {
      ...res.summary,
      actualTotalAmount: parseMoneyAmount(res.summary.actualTotalAmount),
      grandTotalAmount: parseMoneyAmount(res.summary.grandTotalAmount),
    },
  };
}

function mapExpensesListResponse(res: ExpensesListResponse): ExpensesListResponse {
  const totalAmountRaw = res.totalAmount as unknown;
  const totalAmount =
    typeof totalAmountRaw === 'number'
      ? totalAmountRaw
      : Number(String(totalAmountRaw ?? '').replace(/,/g, '')) || 0;

  return {
    ...res,
    totalAmount,
    items: res.items.map((e) => mapApiExpenseRow(e)),
  };
}

function buildExpensesListParams(params?: ExpensesListParams): HttpParams {
  let httpParams = new HttpParams();
  if (!params) {
    return httpParams;
  }
  if (params.from) {
    httpParams = httpParams.set('from', params.from);
  }
  if (params.to) {
    httpParams = httpParams.set('to', params.to);
  }
  if (params.page != null) {
    httpParams = httpParams.set('page', String(params.page));
  }
  if (params.limit != null) {
    httpParams = httpParams.set('limit', String(params.limit));
  }
  if (params.q?.trim()) {
    httpParams = httpParams.set('q', params.q.trim());
  }
  if (params.kind?.trim()) {
    httpParams = httpParams.set('kind', params.kind.trim());
  }
  if (params.relatedUnitId?.trim()) {
    httpParams = httpParams.set('relatedUnitId', params.relatedUnitId.trim());
  }
  if (params.relatedEquipmentId?.trim()) {
    httpParams = httpParams.set('relatedEquipmentId', params.relatedEquipmentId.trim());
  }
  if (params.tripId?.trim()) {
    httpParams = httpParams.set('tripId', params.tripId.trim());
  }
  if (params.tripIds?.trim()) {
    httpParams = httpParams.set('tripIds', params.tripIds.trim());
  }
  return httpParams;
}

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  /** Exportación/detalle explícito: recorre páginas de 100. */
  getAllExpenses(
    params: Omit<ExpensesListParams, 'page' | 'limit'> = {},
  ): Observable<Expense[]> {
    const loadPage = (page: number) =>
      this.getExpensesPage({ ...params, page, limit: 100 });

    return loadPage(1).pipe(
      expand((response) =>
        response.page * response.limit < response.total
          ? loadPage(response.page + 1)
          : EMPTY,
      ),
      reduce((items, response) => [...items, ...response.items], [] as Expense[]),
    );
  }

  getExpensesPage(params: ExpensesListParams): Observable<ExpensesListResponse> {
    const companyId = requireCompanyId(this.session.companyId());
    return this.http
      .get<ExpensesListResponse>(companyResourceUrl(companyId, 'expenses'), {
        params: buildExpensesListParams(params),
      })
      .pipe(map((res) => mapExpensesListResponse(res)));
  }

  getExpenseById(id: string): Observable<Expense> {
    const expenseId = id.trim();
    return this.http
      .get<Expense>(resourceByIdUrl('expenses', expenseId))
      .pipe(map((e) => mapApiExpenseRow(e)));
  }

  getExpensesCalendar(params: ExpensesCalendarParams): Observable<ExpensesCalendarResponse> {
    const companyId = requireCompanyId(this.session.companyId());
    let httpParams = new HttpParams()
      .set('from', params.from)
      .set('to', params.to);
    if (params.all === true) {
      httpParams = httpParams.set('all', 'true');
    } else {
      if (params.page != null) {
        httpParams = httpParams.set('page', String(params.page));
      }
      if (params.limit != null) {
        httpParams = httpParams.set('limit', String(params.limit));
      }
    }
    return this.http
      .get<ExpensesCalendarResponse>(companyResourceUrl(companyId, 'expenses/calendar'), {
        params: httpParams,
      })
      .pipe(map((res) => mapExpensesCalendarResponse(res)));
  }

  /** Ledger del periodo (dashboard, notificaciones). No pagina en el cliente. */
  getAllExpensesCalendarItems(
    params: Omit<ExpensesCalendarParams, 'page' | 'limit' | 'all'>,
  ): Observable<ExpenseCalendarItem[]> {
    return this.getExpensesCalendar({ ...params, all: true }).pipe(
      map((response) => response.items),
    );
  }

  postExpense(payload: ExpenseWritePayload): Observable<Expense> {
    const companyId = requireCompanyId(this.session.companyId());
    const body = omitExpenseReadOnlyFields(payload);
    return this.http
      .post<Expense>(companyResourceUrl(companyId, 'expenses'), {
        ...body,
        incurredAt: body.incurredAt,
      })
      .pipe(map((e) => mapApiExpenseRow(e)));
  }

  patchExpense(id: string, payload: Partial<ExpenseWritePayload>): Observable<Expense> {
    const expenseId = id.trim();
    const body = omitExpenseReadOnlyFields(payload);
    return this.http
      .patch<Expense>(resourceByIdUrl('expenses', expenseId), {
        ...body,
        ...(body.incurredAt != null ? { incurredAt: body.incurredAt } : {}),
      })
      .pipe(map((e) => mapApiExpenseRow(e)));
  }

  uploadExpenseDocument(
    expenseId: string,
    slot: ExpenseDocumentSlot,
    file: File,
  ): Observable<ExpenseAttachedDocument> {
    const id = expenseId.trim();
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('slot', slot);
    return this.http
      .post<Record<string, unknown>>(
        resourceByIdUrl('expenses', id, 'documents'),
        form,
      )
      .pipe(map((raw) => mapExpenseStoredDocument(raw, { fileName: file.name, slot })));
  }

  downloadExpenseDocument(
    expenseId: string,
    documentId: number,
  ): Observable<{ url: string }> {
    const id = expenseId.trim();
    return this.http.get<{ url: string }>(
      resourceByIdUrl('expenses', id, `documents/${documentId}/download`),
    );
  }

  deleteExpenseDocument(
    expenseId: string,
    documentId: number,
  ): Observable<{ id: number; deleted: boolean }> {
    const id = expenseId.trim();
    return this.http.delete<{ id: number; deleted: boolean }>(
      resourceByIdUrl('expenses', id, `documents/${documentId}`),
    );
  }

  deleteExpense(id: string): Observable<{ id: string; deleted: boolean }> {
    const expenseId = id.trim();
    return this.http.delete<{ id: string | number; deleted: boolean }>(
      resourceByIdUrl('expenses', expenseId),
    ).pipe(
      map((res) => ({
        id: normalizeExpensePublicId(res.id),
        deleted: res.deleted === true,
      })),
    );
  }
}
