import type { ClientBalanceOverviewItem } from '@core/services/api/clients';
import {
  clientBalanceCollectionStatus,
  clientBalanceHighlightedPayment,
  emptyClientBalanceSummary,
  formatClientBalanceMoney,
  type ClientBalanceSummary,
} from '@features/clients/utils/client-balance-summary';
import { deriveClientCommercialHealthFromSummary } from '@features/clients/utils/client-commercial-status.util';
import { clientCommercialHealthLabel } from '@shared/catalogs/client-form-options';
import { clientCommercialPillClass } from '@shared/utils/client-commercial-pill';
import { maneuverCodePrefixFromClientName } from '@shared/utils/maneuver-code.util';
import type { ToBadgeVariant } from '@shared/ui/to-badge/to-badge.component';
import type { ToIconName } from '@shared/ui/to-icon/to-icon-paths';

export interface ClientBalanceOverviewCardView {
  id: string;
  name: string;
  codePrefix: string;
  maneuverCountLabel: string;
  pendingBalanceLabel: string;
  pendingBalance: number;
  statusLabel: string;
  statusVariant: ToBadgeVariant;
  statusIcon: ToIconName | null;
  commercialStatusLabel: string;
  commercialStatusPillClass: string;
  footerLabel: string;
  footerDateLabel: string;
  footerAmountLabel: string;
}

function summaryFromOverviewItem(
  item: ClientBalanceOverviewItem,
): ClientBalanceSummary {
  return {
    ...emptyClientBalanceSummary(),
    hasTrips: item.summary.hasTrips,
    completedCount: item.summary.completedCount,
    receivable: item.summary.receivable,
    nextDueYmd: item.summary.nextDueYmd,
    upcomingPayments: item.summary.upcomingPayments,
  };
}

/** Proyección visual de un item de `/clients/balance-overview`. */
export function buildClientBalanceOverviewCard(
  item: ClientBalanceOverviewItem,
): ClientBalanceOverviewCardView {
  const balance = summaryFromOverviewItem(item);
  const status = clientBalanceCollectionStatus(balance);
  const payment = clientBalanceHighlightedPayment(balance);
  const commercialHealth = deriveClientCommercialHealthFromSummary(balance);

  return {
    id: item.clientId,
    name: item.name,
    codePrefix: maneuverCodePrefixFromClientName(item.name),
    maneuverCountLabel: balance.completedCount.toLocaleString('es-MX'),
    pendingBalance: balance.receivable,
    pendingBalanceLabel: formatClientBalanceMoney(balance.receivable),
    statusLabel: status.label,
    statusVariant: status.variant,
    statusIcon: status.icon,
    commercialStatusLabel: clientCommercialHealthLabel(commercialHealth),
    commercialStatusPillClass: clientCommercialPillClass(commercialHealth),
    footerLabel: payment.sectionLabel,
    footerDateLabel: payment.dueLabel,
    footerAmountLabel: payment.amountLabel,
  };
}

export function buildClientBalanceOverviewCards(
  items: readonly ClientBalanceOverviewItem[],
): ClientBalanceOverviewCardView[] {
  return items.map((item) => buildClientBalanceOverviewCard(item));
}

export function clientBalanceOverviewMatchesQuery(
  card: ClientBalanceOverviewCardView,
  q: string,
): boolean {
  const haystack = [
    card.id,
    card.name,
    card.codePrefix,
    card.maneuverCountLabel,
    card.pendingBalanceLabel,
    card.statusLabel,
    card.commercialStatusLabel,
    card.footerDateLabel,
    card.footerAmountLabel,
  ]
    .map((v) => String(v ?? '').toLowerCase())
    .join(' ');
  return haystack.includes(q);
}

export function compareClientBalanceOverviewCards(
  a: ClientBalanceOverviewCardView,
  b: ClientBalanceOverviewCardView,
): number {
  if (b.pendingBalance !== a.pendingBalance) {
    return b.pendingBalance - a.pendingBalance;
  }
  return a.name.localeCompare(b.name, 'es');
}
