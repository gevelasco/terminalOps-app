import { buildClientBalanceOverviewCard } from './client-balance-overview-card.util';

describe('client-balance-overview-card.util', () => {
  it('arma la card con nombre y cartera del overview (sin expediente)', () => {
    const card = buildClientBalanceOverviewCard({
      clientId: '12',
      name: 'Cliente Guadalajara',
      commercialHealth: 'good_standing',
      summary: {
        hasTrips: true,
        completedCount: 4,
        receivable: 18000,
        nextDueYmd: '2026-09-01',
        upcomingPayments: [
          {
            tripId: '9',
            maneuverCode: 'CG-0001',
            dueYmd: '2026-09-01',
            dueLabel: '1 sept 2026',
            amount: 18000,
            badgeVariant: 'warning',
            statusHint: 'Vence pronto',
          },
        ],
      },
    });

    expect(card.id).toBe('12');
    expect(card.name).toBe('Cliente Guadalajara');
    expect(card.pendingBalance).toBe(18000);
    expect(card.maneuverCountLabel).toBe('4');
    expect(card.commercialStatusLabel.length).toBeGreaterThan(0);
  });
});
