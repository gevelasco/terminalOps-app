import type {
  Client,
  ClientContactPerson,
  ClientDelivery,
  CreateClientPayload,
} from '@shared/models/client.models';

export function parseOptionalInt(raw: string): number | undefined {
  const t = raw.trim();
  if (t === '') {
    return undefined;
  }
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

export function yesNoToBool(v: string): boolean {
  return v === 'yes' || v === 'true' || v === '1';
}

export function boolToYesNo(v: boolean): string {
  return v ? 'yes' : 'no';
}

export function normalizeContacts(list: ClientContactPerson[]): ClientContactPerson[] {
  return list
    .map((c) => ({
      ...c,
      name: c.name.trim(),
      role: c.role?.trim() || undefined,
      phone: c.phone?.trim() || undefined,
      email: c.email?.trim() || undefined,
    }))
    .filter((c) => c.name.length > 0);
}

export function buildClientDeliveryPayload(params: {
  postalCode: string;
  cityMunicipality: string;
  locality: string;
  settlementConsId: string;
  latitude: number | null;
  longitude: number | null;
}): ClientDelivery | undefined {
  const cp = params.postalCode.trim();
  if (!cp) {
    return undefined;
  }
  return {
    postalCode: cp,
    cityMunicipality: params.cityMunicipality.trim() || undefined,
    locality: params.locality.trim() || undefined,
    settlementConsId: params.settlementConsId.trim() || undefined,
    latitude: params.latitude ?? undefined,
    longitude: params.longitude ?? undefined,
  };
}

export function validateClientDelivery(params: {
  postalCode: string;
  locality: string;
  settlementConsId: string;
  latitude: number | null;
  longitude: number | null;
}): string | null {
  const cp = params.postalCode.trim();
  if (!cp) {
    return null;
  }
  if (cp.length !== 5) {
    return 'El código postal de entrega debe tener 5 dígitos.';
  }
  if (!params.settlementConsId.trim() && !params.locality.trim()) {
    return 'Elige la localidad de entrega.';
  }
  if (params.latitude == null || params.longitude == null) {
    return 'Espera a que se obtengan las coordenadas de entrega o revisa el CP.';
  }
  return null;
}

export function formatClientDeliveryCoord(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) {
    return '—';
  }
  return n.toFixed(6);
}

/** Cuerpo POST/PATCH alineado a CreateClientDto (sin id / agregados / docs). */
export function buildClientApiWriteBody(
  input: Client | CreateClientPayload,
): Record<string, unknown> {
  const client = input as Client;
  const payment = client.payment;
  const delivery = client.delivery;
  const paymentBody = payment
    ? {
        hasCredit: payment.hasCredit,
        ...(payment.creditDays != null ? { creditDays: payment.creditDays } : {}),
        ...(payment.approximateCreditAmount
          ? { approximateCreditAmount: payment.approximateCreditAmount }
          : {}),
        ...(payment.defaultPaymentMethod
          ? { defaultPaymentMethod: payment.defaultPaymentMethod }
          : {}),
      }
    : undefined;
  const deliveryBody = delivery
    ? {
        ...(delivery.postalCode ? { postalCode: delivery.postalCode } : {}),
        ...(delivery.cityMunicipality
          ? { cityMunicipality: delivery.cityMunicipality }
          : {}),
        ...(delivery.locality ? { locality: delivery.locality } : {}),
        ...(delivery.settlementConsId
          ? { settlementConsId: delivery.settlementConsId }
          : {}),
        ...(delivery.latitude != null ? { latitude: delivery.latitude } : {}),
        ...(delivery.longitude != null ? { longitude: delivery.longitude } : {}),
      }
    : undefined;
  const contacts = (client.contacts ?? []).map(({ name, role, phone, email }) => ({
    name,
    ...(role ? { role } : {}),
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
  }));
  const billing = client.billing
    ? {
        ...(client.billing.invoiceLegalName
          ? { invoiceLegalName: client.billing.invoiceLegalName }
          : {}),
        ...(client.billing.taxRegime ? { taxRegime: client.billing.taxRegime } : {}),
        ...(client.billing.fiscalZip ? { fiscalZip: client.billing.fiscalZip } : {}),
        ...(client.billing.cfdiUse ? { cfdiUse: client.billing.cfdiUse } : {}),
        ...(client.billing.billingEmail
          ? { billingEmail: client.billing.billingEmail }
          : {}),
        ...(client.billing.billingPhone
          ? { billingPhone: client.billing.billingPhone }
          : {}),
      }
    : undefined;

  return {
    name: client.name,
    ...(client.rfc ? { rfc: client.rfc } : {}),
    ...(client.relationshipStartedOn
      ? { relationshipStartedOn: client.relationshipStartedOn }
      : {}),
    ...(client.notes ? { notes: client.notes } : {}),
    ...(billing && Object.keys(billing).length > 0 ? { billing } : {}),
    ...(paymentBody ? { payment: paymentBody } : {}),
    ...(contacts.length > 0 ? { contacts } : {}),
    ...(deliveryBody && Object.keys(deliveryBody).length > 0
      ? { delivery: deliveryBody }
      : {}),
  };
}
