import { EMPTY, expand, map, type Observable, reduce } from 'rxjs';

export type ResourceListPage<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

/** Acepta respuesta paginada nueva o array legacy. */
export function normalizeResourceListResponse<T>(
  res: unknown,
  mapItem: (row: Record<string, unknown>) => T,
): ResourceListPage<T> {
  if (Array.isArray(res)) {
    const items = res.map((row) => mapItem(row as Record<string, unknown>));
    return {
      items,
      total: items.length,
      page: 1,
      limit: items.length,
    };
  }

  const raw = (res ?? {}) as {
    items?: unknown[];
    total?: number;
    page?: number;
    limit?: number;
  };
  const items = Array.isArray(raw.items)
    ? raw.items.map((row) => mapItem(row as Record<string, unknown>))
    : [];
  return {
    items,
    total: typeof raw.total === 'number' ? raw.total : items.length,
    page: typeof raw.page === 'number' ? raw.page : 1,
    limit: typeof raw.limit === 'number' ? raw.limit : items.length,
  };
}

/** Recorre páginas de 100 (mismo patrón que trips). */
export function fetchAllResourcePages<T>(
  loadPage: (page: number) => Observable<ResourceListPage<T>>,
): Observable<T[]> {
  return loadPage(1).pipe(
    expand((response) =>
      response.page * response.limit < response.total
        ? loadPage(response.page + 1)
        : EMPTY,
    ),
    reduce(
      (items, response) => [...items, ...response.items],
      [] as T[],
    ),
  );
}

export function mapResourceListPage<T>(
  source: Observable<unknown>,
  mapItem: (row: Record<string, unknown>) => T,
): Observable<ResourceListPage<T>> {
  return source.pipe(map((res) => normalizeResourceListResponse(res, mapItem)));
}
