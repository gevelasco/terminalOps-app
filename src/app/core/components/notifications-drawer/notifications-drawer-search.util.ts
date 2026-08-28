import type { NotificationFeedItem } from '@core/services/api/notifications';

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function haystack(item: NotificationFeedItem): string {
  return [item.title, item.subjectLabel, item.actorLabel]
    .map((part) => normalizeSearchText(part))
    .filter(Boolean)
    .join(' ');
}

/** Filtro local del drawer: no dispara otra consulta. */
export function filterNotificationFeedItems(
  items: readonly NotificationFeedItem[],
  query: string,
): NotificationFeedItem[] {
  const q = normalizeSearchText(query);
  if (!q) {
    return [...items];
  }
  return items.filter((item) => haystack(item).includes(q));
}

