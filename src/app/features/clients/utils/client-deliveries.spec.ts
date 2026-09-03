import {
  clientDeliveries,
  findClientDeliveryForRoute,
  uniqueClientDeliveryPostalCodes,
  validClientDeliveries,
  withClientDeliveries,
} from './client-deliveries';
import type { Client, ClientDelivery } from '@shared/models/client.models';

function delivery(partial: Partial<ClientDelivery>): ClientDelivery {
  return {
    postalCode: '77560',
    locality: 'Centro',
    ...partial,
  };
}

describe('client-deliveries', () => {
  it('wraps legacy singular delivery', () => {
    const client: Client = {
      id: '1',
      name: 'Acme',
      delivery: delivery({ postalCode: '44100' }),
    };
    expect(clientDeliveries(client).map((row) => row.postalCode)).toEqual(['44100']);
  });

  it('prefers deliveries array over singular', () => {
    const client: Client = {
      id: '1',
      name: 'Acme',
      delivery: delivery({ postalCode: '44100' }),
      deliveries: [
        delivery({ postalCode: '44100' }),
        delivery({ postalCode: '77560' }),
      ],
    };
    expect(validClientDeliveries(client).map((row) => row.postalCode)).toEqual([
      '44100',
      '77560',
    ]);
  });

  it('lists unique postal codes', () => {
    const client: Client = {
      id: '1',
      name: 'Agencia',
      deliveries: [
        delivery({ postalCode: '77560', locality: 'A' }),
        delivery({ postalCode: '44100', locality: 'B' }),
        delivery({ postalCode: '77560', locality: 'C' }),
      ],
    };
    expect(uniqueClientDeliveryPostalCodes(client)).toEqual(['77560', '44100']);
  });

  it('finds delivery by CP and locality', () => {
    const client: Client = {
      id: '1',
      name: 'Agencia',
      deliveries: [
        delivery({ postalCode: '77560', locality: 'Centro' }),
        delivery({ postalCode: '77560', locality: 'Norte' }),
      ],
    };
    expect(findClientDeliveryForRoute(client, '77560', 'Norte')?.locality).toBe('Norte');
    expect(findClientDeliveryForRoute(client, '77560')?.locality).toBe('Centro');
  });

  it('syncs singular delivery as first of the array', () => {
    const next = withClientDeliveries(
      { id: '1', name: 'Acme' } as Client,
      [delivery({ postalCode: '44100' }), delivery({ postalCode: '77560' })],
    );
    expect(next.delivery?.postalCode).toBe('44100');
    expect(next.deliveries?.length).toBe(2);
  });
});
