import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { installAutocompleteOutsideDismiss } from '@shared/ui/autocomplete-outside-dismiss';
import { ToIconComponent } from '@shared/ui/to-icon/to-icon.component';
import { normalizeMxPostalCodeDigits } from '@features/trips/utils/mx-postal-settlement';

let seq = 0;

@Component({
  selector: 'app-destination-cp-combobox',
  standalone: true,
  imports: [ToIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="to-field">
      @if (label()) {
        <div class="to-field__label-row">
          <label class="to-field__label" [attr.for]="inputId">{{ label() }}</label>
          @if (labelHint()) {
            <span
              class="destination-cp-combobox__hint"
              tabindex="0"
              [attr.aria-label]="labelHint()"
              [attr.data-tooltip]="labelHint()"
            >
              <to-icon name="info" [size]="16" />
            </span>
          }
        </div>
      }
      <div
        class="dr-maneuver-combobox"
        [class.dr-maneuver-combobox--open]="open()"
        [class.dr-maneuver-combobox--disabled]="disabled()"
      >
        <input
          #fieldInput
          [id]="inputId"
          class="dr-maneuver-combobox__control dr-maneuver-combobox__control--with-chevron"
          type="text"
          inputmode="numeric"
          autocomplete="postal-code"
          [placeholder]="placeholder()"
          [value]="inputText()"
          [disabled]="disabled()"
          maxlength="5"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          aria-autocomplete="list"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="open() ? listId : null"
        />
        <svg
          class="dr-maneuver-combobox__chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
        </svg>
        @if (open() && !disabled()) {
          <ul [id]="listId" class="dr-maneuver-combobox__list" role="listbox">
            @if (filteredSuggestions().length > 0) {
              @for (cp of filteredSuggestions(); track cp) {
                <li
                  class="dr-maneuver-combobox__item"
                  role="option"
                  tabindex="-1"
                  (pointerdown)="onPickPointerDown(cp, $event)"
                >
                  {{ cp }}
                </li>
              }
            } @else {
              <li class="dr-maneuver-combobox__hint" role="presentation">
                Escribe un CP de 5 dígitos o elige una tarifa
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
  styleUrls: [
    '../../../clients/components/destination-rate-prices-editor/destination-rate-maneuver-combobox.component.scss',
    './destination-cp-combobox.component.scss',
  ],
})
export class DestinationCpComboboxComponent {
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly label = input<string>();
  readonly labelHint = input<string>();
  readonly placeholder = input('');
  readonly disabled = input(false);
  readonly suggestions = input<readonly string[]>([]);
  readonly value = model('');
  readonly picked = output<string>();
  readonly blurNotify = output<void>();

  readonly inputId = `destination-cp-combobox-${++seq}`;
  readonly listId = `${this.inputId}-list`;

  readonly open = signal(false);
  readonly inputText = signal('');

  readonly filteredSuggestions = computed(() => {
    const q = this.inputText().trim();
    const rows = this.suggestions();
    if (!q) {
      return rows;
    }
    return rows.filter((cp) => cp.includes(q));
  });

  constructor() {
    installAutocompleteOutsideDismiss(
      this.hostEl,
      () => this.open(),
      () => this.open.set(false),
      this.destroyRef,
    );

    effect(() => {
      const next = this.value();
      if (this.inputText() !== next) {
        this.inputText.set(next);
      }
    });
  }

  onFocus(): void {
    if (!this.disabled()) {
      this.open.set(true);
    }
  }

  onInput(ev: Event): void {
    const digits = normalizeMxPostalCodeDigits((ev.target as HTMLInputElement).value);
    this.inputText.set(digits);
    this.value.set(digits);
    this.open.set(true);
  }

  onBlur(): void {
    const digits = normalizeMxPostalCodeDigits(this.inputText());
    if (digits !== this.inputText()) {
      this.inputText.set(digits);
    }
    if (digits !== this.value()) {
      this.value.set(digits);
    }
    this.open.set(false);
    this.blurNotify.emit();
  }

  onPickPointerDown(cp: string, ev: PointerEvent): void {
    ev.preventDefault();
    this.inputText.set(cp);
    this.value.set(cp);
    this.open.set(false);
    this.picked.emit(cp);
  }
}
