import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
} from '@angular/core';
import { ToastService } from '@core/notifications/toast.service';
import { OperationConfigurationsFeatureService } from '@features/clients/services/operation-configurations.service';
import {
  appendDestinationRatePriceInputRow,
  canAppendDestinationRatePriceRow,
  createEmptyPriceDraft,
  destinationRatePriceManeuverKey,
} from '@features/clients/utils/destination-rate-payload';
import type { DestinationRatePriceDraft } from '@shared/models/destination-rate.models';
import { ToButtonComponent } from '@shared/ui/to-button/to-button.component';
import { ToIconComponent } from '@shared/ui/to-icon/to-icon.component';
import { ToInputComponent } from '@shared/ui/to-input/to-input.component';
import { ToSelectOption } from '@shared/ui/to-select/to-select.component';
import {
  DestinationRateManeuverComboboxComponent,
  type DestinationRateManeuverValue,
} from './destination-rate-maneuver-combobox.component';

@Component({
  selector: 'app-destination-rate-prices-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ToInputComponent,
    ToButtonComponent,
    ToIconComponent,
    DestinationRateManeuverComboboxComponent,
  ],
  templateUrl: './destination-rate-prices-editor.component.html',
  styleUrl: './destination-rate-prices-editor.component.scss',
})
export class DestinationRatePricesEditorComponent {
  private readonly toast = inject(ToastService);
  private readonly operationConfigs = inject(OperationConfigurationsFeatureService);

  constructor() {
    this.operationConfigs.loadOperationConfigurations();
  }

  readonly priceDrafts = model<DestinationRatePriceDraft[]>([createEmptyPriceDraft()]);
  readonly disabled = model(false);

  readonly configurationOptions = computed((): ToSelectOption[] =>
    this.operationConfigs.activeConfigurations().map((c) => ({
      value: c.id,
      label: c.name,
    })),
  );

  readonly allConfigurationNames = computed(() =>
    this.operationConfigs.configurations().map((c) => ({ id: c.id, name: c.name })),
  );

  readonly canAddRow = computed(
    () => !this.disabled() && canAppendDestinationRatePriceRow(this.priceDrafts()),
  );

  readonly rowsScroll = computed(() => this.priceDrafts().length > 3);

  availableOptionsForRow(row: DestinationRatePriceDraft): ToSelectOption[] {
    const used = new Set(
      this.priceDrafts()
        .filter((item) => item.rowKey !== row.rowKey)
        .map((item) => item.operationConfigurationId.trim())
        .filter((id) => id.length > 0),
    );
    return this.configurationOptions().filter(
      (opt) => opt.value === row.operationConfigurationId || !used.has(String(opt.value)),
    );
  }

  addRow(): void {
    if (this.disabled()) {
      return;
    }
    const result = appendDestinationRatePriceInputRow(this.priceDrafts());
    if (!result.ok) {
      this.toast.show(result.message, 'warning');
      return;
    }
    this.priceDrafts.set(result.rows);
  }

  removeRow(rowKey: string): void {
    if (this.disabled()) {
      return;
    }
    this.priceDrafts.update((rows) => {
      const next = rows.filter((r) => r.rowKey !== rowKey);
      return next.length > 0 ? next : [createEmptyPriceDraft()];
    });
  }

  onManeuverChange(rowKey: string, value: DestinationRateManeuverValue): void {
    this.priceDrafts.update((rows) =>
      rows.map((row) =>
        row.rowKey === rowKey
          ? {
              ...row,
              operationConfigurationId: value.operationConfigurationId,
              operationConfigurationName: value.operationConfigurationName,
            }
          : row,
      ),
    );
  }

  updateField(
    rowKey: string,
    field: 'clientCharge' | 'operatorPaymentEstimate' | 'estimatedTollAmount' | 'perDiemAmount',
    value: string,
  ): void {
    this.priceDrafts.update((rows) =>
      rows.map((row) => (row.rowKey === rowKey ? { ...row, [field]: value } : row)),
    );
  }

  canRemoveRow(row: DestinationRatePriceDraft): boolean {
    const rows = this.priceDrafts();
    if (rows.length > 1) {
      return true;
    }
    return destinationRatePriceManeuverKey(row).length > 0;
  }
}
