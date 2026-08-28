import { filterNotificationFeedItems } from './notifications-drawer-search.util';
import type { NotificationFeedItem } from '@core/services/api/notifications';

function item(
  partial: Partial<NotificationFeedItem> & Pick<NotificationFeedItem, 'id'>,
): NotificationFeedItem {
  return {
    kind: 'payment.due_soon',
    origin: 'computed',
    icon: 'document',
    title: 'Pago de seguro próximo',
    subjectLabel: 'Póliza unidad SF-004',
    occurredAt: '2026-08-27T18:00:00.000Z',
    actorLabel: 'Sistema',
    ...partial,
  };
}

describe('filterNotificationFeedItems', () => {
  const rows = [
    item({ id: '1', title: 'Pago de GPS vencido', subjectLabel: 'GPS tractora 12' }),
    item({ id: '2', title: 'Pago a operador hoy', subjectLabel: 'Juan Pérez' }),
    item({ id: '3', actorLabel: 'Ana Ruiz' }),
  ];

  it('returns all rows when the query is blank', () => {
    expect(filterNotificationFeedItems(rows, '  ')).toEqual(rows);
  });

  it('matches title, subject and actor without another request', () => {
    expect(filterNotificationFeedItems(rows, 'gps').map((row) => row.id)).toEqual(['1']);
    expect(filterNotificationFeedItems(rows, 'perez').map((row) => row.id)).toEqual(['2']);
    expect(filterNotificationFeedItems(rows, 'ANA').map((row) => row.id)).toEqual(['3']);
  });
});
