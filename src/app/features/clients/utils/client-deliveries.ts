import { normalizeMxPostalCodeDigits } from '@features/trips/utils/mx-postal-settlement';
import type { Client, ClientDelivery } from '@shared/models/client.models';

export function clientDeliveries(
  client: Pick<Client, 'delivery' | 'deliveries'> | null | undefined,
): ClientDelivery[] {
  if (!client) {
    return [];
  }
  if (client.deliveries && client.deliveries.length > 0) {
    return client.deliveries;
  }
  if (client.delivery) {
    return [client.delivery];
  }
  return [];
}

export function validClientDeliveries(
  client: Pick<Client, 'delivery' | 'deliveries'> | null | undefined,
): ClientDelivery[] {
  return clientDeliveries(client).filter(
    (row) => normalizeMxPostalCodeDigits(row.postalCode ?? '').length === 5,
  );
}

export function uniqueClientDeliveryPostalCodes(
  client: Pick<Client, 'delivery' | 'deliveries'> | null | undefined,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of validClientDeliveries(client)) {
    const cp = normalizeMxPostalCodeDigits(row.postalCode ?? '');
    if (seen.has(cp)) {
      continue;
    }
    seen.add(cp);
    out.push(cp);
  }
  return out;
}

export function findClientDeliveryForRoute(
  client: Pick<Client, 'delivery' | 'deliveries'> | null | undefined,
  postalCode: string,
  locality?: string,
): ClientDelivery | undefined {
  const cp = normalizeMxPostalCodeDigits(postalCode);
  if (cp.length !== 5) {
    return undefined;
  }
  const matches = validClientDeliveries(client).filter(
    (row) => normalizeMxPostalCodeDigits(row.postalCode ?? '') === cp,
  );
  if (matches.length === 0) {
    return undefined;
  }
  const wantLocality = locality?.trim().toLowerCase();
  if (wantLocality) {
    const byLocality = matches.find(
      (row) => (row.locality ?? '').trim().toLowerCase() === wantLocality,
    );
    if (byLocality) {
      return byLocality;
    }
  }
  return matches[0];
}

export function deliveryLocationKey(row: ClientDelivery): string {
  const cp = normalizeMxPostalCodeDigits(row.postalCode ?? '');
  const locality = (row.locality ?? '').trim().toLowerCase();
  const consId = (row.settlementConsId ?? '').trim();
  return `${cp}|${consId}|${locality}`;
}

export function isSameClientDeliveryLocation(
  a: ClientDelivery,
  b: ClientDelivery,
): boolean {
  return deliveryLocationKey(a) === deliveryLocationKey(b);
}

export function deliveryPlaceLabel(row: ClientDelivery): string {
  const locality = row.locality?.trim();
  const cp = row.postalCode?.trim();
  if (locality && cp) {
    return `${locality} (${cp})`;
  }
  return locality || cp || 'entrega';
}

export function withClientDeliveries<T extends Pick<Client, 'delivery' | 'deliveries'>>(
  client: T,
  deliveries: ClientDelivery[],
): T {
  const list = deliveries;
  return {
    ...client,
    deliveries: list,
    delivery: list[0],
  };
}
