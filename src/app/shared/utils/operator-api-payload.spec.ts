import type { Operator } from '@shared/models/logistics.models';
import {
  buildOperatorCreatePayload,
  buildOperatorPatchPayload,
} from './operator-api-payload';

function baseOperator(overrides: Partial<Operator> = {}): Operator {
  return {
    id: '3',
    name: 'Juan Pérez',
    status: 'in_use',
    isActive: true,
    birthDate: '1990-01-15',
    curp: 'PERJ900115HDFRRN01',
    rfc: 'PERJ900115ABC',
    licenseNumber: 'LIC-1',
    licenseExpiresOn: '2027-01-01',
    licenseType: 'federal',
    licenseEndorsements: '',
    phone: '555',
    phoneSecondary: '',
    address: 'Calle 1',
    companyHireDate: '2020-01-01',
    employmentContractType: 'indefinite',
    paymentSchedule: 'maneuver',
    insuranceKind: 'none',
    emergencyContact: {
      name: 'Ana',
      relationship: 'spouse',
      phone: '556',
      email: '',
      authorizedMedicalInfo: false,
    },
    publicInsurance: {
      nss: '',
      imssAltaDate: '',
      infonavit: false,
      infonavitCreditNumber: '',
      fonacot: false,
      fonacotCreditNumber: '',
      notes: '',
    },
    privateInsurance: {
      carrier: '',
      policyNumber: '',
      validFrom: '',
      validTo: '',
      premiumAmount: '',
      premiumPeriod: '',
      deductibleNotes: '',
      planSummary: '',
    },
    documents: [],
    ...overrides,
  } as Operator;
}

describe('operator-api-payload (A6)', () => {
  it('never sends operational status in patch payload', () => {
    const payload = buildOperatorPatchPayload(baseOperator());
    expect('status' in payload).toBe(false);
  });

  it('includes isActive for user-controlled visibility', () => {
    const payload = buildOperatorPatchPayload(baseOperator({ isActive: false }));
    expect(payload['isActive']).toBe(false);
  });

  it('omits documents from create/patch (binary via dedicated endpoints)', () => {
    const docs = [
      {
        id: 'doc-local-1',
        fileName: 'contrato.pdf',
        slot: 'operation' as const,
        addedAt: '2026-07-25',
      },
      {
        id: '12',
        fileName: 'imss.pdf',
        slot: 'insurance' as const,
        addedAt: '2026-07-25',
      },
    ];
    const createPayload = buildOperatorCreatePayload(
      baseOperator({ documents: docs }),
    );
    const patchPayload = buildOperatorPatchPayload(
      baseOperator({ documents: docs }),
    );
    expect('documents' in createPayload).toBe(false);
    expect('documents' in patchPayload).toBe(false);
  });

  it('omits list/computed fields from create and patch', () => {
    const operator = baseOperator({
      hasPhoto: true,
      maneuverCount: 12,
      owedAmount: 3500,
      nextPayDueOn: '2026-08-20',
      nextPayDueVariant: 'warning',
      lastManeuver: {
        maneuverCode: 'M-1',
        origin: 'A',
        destination: 'B',
      },
    });
    const createPayload = buildOperatorCreatePayload(operator);
    const patchPayload = buildOperatorPatchPayload(operator);
    for (const payload of [createPayload, patchPayload]) {
      expect('id' in payload).toBe(false);
      expect('hasPhoto' in payload).toBe(false);
      expect('maneuverCount' in payload).toBe(false);
      expect('owedAmount' in payload).toBe(false);
      expect('nextPayDueOn' in payload).toBe(false);
      expect('nextPayDueVariant' in payload).toBe(false);
      expect('lastManeuver' in payload).toBe(false);
    }
    expect(createPayload['name']).toBe('Juan Pérez');
    expect(patchPayload['licenseNumber']).toBe('LIC-1');
  });
});
