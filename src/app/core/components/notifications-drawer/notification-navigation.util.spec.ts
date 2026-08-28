import type { NotificationFeedItem } from '@core/services/api/notifications';
import { resolveNotificationNavigation } from './notification-navigation.util';

function item(
  partial: Partial<NotificationFeedItem> & Pick<NotificationFeedItem, 'id'>,
): NotificationFeedItem {
  return {
    kind: 'unit.updated',
    origin: 'event',
    icon: 'unit',
    title: 'Unidad modificada',
    subjectLabel: 'KW-01',
    occurredAt: '2026-08-28T18:00:00.000Z',
    actorLabel: 'Ana',
    entityType: 'unit',
    entityId: '12',
    ...partial,
  };
}

describe('resolveNotificationNavigation', () => {
  it('opens the coverage tab for unit coverage updates', () => {
    expect(
      resolveNotificationNavigation(
        item({
          id: '1',
          kind: 'unit.coverage_updated',
          title: 'Cobertura',
          entityTab: 'cob',
        }),
      ),
    ).toEqual({
      commands: ['/fleet'],
      queryParams: { unitId: '12', fleetTab: 'cob' },
    });
  });

  it('opens the ficha tab for equipment identity updates', () => {
    expect(
      resolveNotificationNavigation(
        item({
          id: '2',
          kind: 'equipment.ficha_updated',
          title: 'Ficha técnica',
          entityType: 'equipment',
          entityId: '9',
        }),
      ),
    ).toEqual({
      commands: ['/fleet'],
      queryParams: { equipmentId: '9', fleetTab: 'ficha' },
    });
  });

  it('opens the maintenance tab from the title', () => {
    expect(
      resolveNotificationNavigation(
        item({
          id: '3',
          kind: 'unit.maintenance_updated',
          title: 'Mantenimiento',
        }),
      )?.queryParams,
    ).toEqual({ unitId: '12', fleetTab: 'mant' });
  });

  it('opens the client details tab for client updates', () => {
    expect(
      resolveNotificationNavigation(
        item({
          id: '4',
          kind: 'client.updated',
          title: 'Identificación comercial',
          entityType: 'client',
          entityId: '8',
          entityTab: 'details',
        }),
      ),
    ).toEqual({
      commands: ['/comercial/clients'],
      queryParams: { clientId: '8', clientTab: 'details' },
    });
  });

  it('opens the client details tab from a generic client-updated title', () => {
    expect(
      resolveNotificationNavigation(
        item({
          id: '5',
          kind: 'client.updated',
          title: 'Cliente modificado',
          entityType: 'client',
          entityId: '8',
        }),
      )?.queryParams,
    ).toEqual({ clientId: '8', clientTab: 'details' });
  });
});
