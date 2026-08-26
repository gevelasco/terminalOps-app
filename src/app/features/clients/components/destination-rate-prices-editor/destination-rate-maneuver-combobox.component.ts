import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { installAutocompleteOutsideDismiss } from '@shared/ui/autocomplete-outside-dismiss';
import type { ToSelectOption } from '@shared/ui/to-select/to-select.component';

export interface DestinationRateManeuverValue {
  operationConfigurationId: string;
  operationConfigurationName: string;
}

let seq = 0;

@Component({
  selector: 'app-destination-rate-maneuver-combobox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="dr-maneuver-combobox"
      [class.dr-maneuver-combobox--open]="open()"
      [class.dr-maneuver-combobox--disabled]="disabled()"
    >
      <input
        #fieldInput
        [id]="inputId"
        class="dr-maneuver-combobox__control"
        type="text"
        [placeholder]="placeholder()"
        [value]="inputText()"
        [disabled]="disabled()"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
        aria-autocomplete="list"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="open() ? listId : null"
      />
      @if (open() && !disabled()) {
        <ul
          #list
          [id]="listId"
          class="dr-maneuver-combobox__list dr-maneuver-combobox__list--floating"
          role="listbox"
          [style.top.px]="listBox().top"
          [style.left.px]="listBox().left"
          [style.width.px]="listBox().width"
          [style.maxHeight.px]="listBox().maxHeight"
        >
          @if (suggestions().length > 0) {
            @for (opt of suggestions(); track opt.value) {
              <li
                class="dr-maneuver-combobox__item"
                role="option"
                tabindex="-1"
                (pointerdown)="onPickPointerDown(opt, $event)"
              >
                {{ opt.label }}
              </li>
            }
          } @else if (inputText().trim()) {
            <li class="dr-maneuver-combobox__hint" role="presentation">
              Se usará «{{ inputText().trim() }}» como tipo nuevo
            </li>
          } @else {
            <li class="dr-maneuver-combobox__hint" role="presentation">
              Escribe o elige un tipo de maniobra
            </li>
          }
        </ul>
      }
    </div>
  `,
  styleUrl: './destination-rate-maneuver-combobox.component.scss',
})
export class DestinationRateManeuverComboboxComponent {
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly fieldInput = viewChild<ElementRef<HTMLInputElement>>('fieldInput');
  private readonly listEl = viewChild<ElementRef<HTMLUListElement>>('list');

  readonly operationConfigurationId = input('');
  readonly operationConfigurationName = input('');
  readonly options = input<readonly ToSelectOption[]>([]);
  /** Catálogo completo para resolver coincidencia exacta por nombre. */
  readonly allConfigurationNames = input<readonly { id: string; name: string }[]>([]);
  readonly disabled = input(false);
  readonly placeholder = input('Tipo de maniobra');

  readonly valueChange = output<DestinationRateManeuverValue>();

  readonly inputId = `dr-maneuver-combobox-${++seq}`;
  readonly listId = `${this.inputId}-list`;

  readonly open = signal(false);
  readonly inputText = signal('');
  readonly listBox = signal({ top: 0, left: 0, width: 0, maxHeight: 160 });

  readonly suggestions = computed(() => {
    const q = this.inputText().trim().toLowerCase();
    const opts = this.options();
    if (!q) {
      return opts;
    }
    return opts.filter((o) => String(o.label).trim().toLowerCase().includes(q));
  });

  private repositionListening = false;

  constructor() {
    installAutocompleteOutsideDismiss(
      this.hostEl,
      () => this.open(),
      () => this.closeList(),
      this.destroyRef,
      () => this.listEl()?.nativeElement,
    );

    effect(() => {
      const id = this.operationConfigurationId().trim();
      const name = this.operationConfigurationName().trim();
      const label = id
        ? (this.allConfigurationNames().find((c) => c.id === id)?.name ?? name)
        : name;
      if (this.inputText() !== label) {
        this.inputText.set(label);
      }
    });

    this.destroyRef.onDestroy(() => this.unbindReposition());
  }

  onFocus(): void {
    if (this.disabled()) {
      return;
    }
    this.openList();
  }

  onInput(ev: Event): void {
    const text = (ev.target as HTMLInputElement).value;
    this.inputText.set(text);
    this.openList();
    this.emitResolved(text);
  }

  onBlur(): void {
    queueMicrotask(() => {
      if (this.open()) {
        this.closeList();
      }
    });
  }

  onPickPointerDown(opt: ToSelectOption, ev: PointerEvent): void {
    ev.preventDefault();
    const id = String(opt.value);
    const name = String(opt.label);
    this.inputText.set(name);
    this.closeList(false);
    this.valueChange.emit({
      operationConfigurationId: id,
      operationConfigurationName: name,
    });
  }

  private openList(): void {
    this.open.set(true);
    this.syncListPosition();
    afterNextRender(() => this.attachFloatingList(), { injector: this.injector });
  }

  private closeList(emit = true): void {
    this.open.set(false);
    this.unbindReposition();
    if (emit) {
      this.emitResolved(this.inputText());
    }
  }

  private attachFloatingList(): void {
    const ul = this.listEl()?.nativeElement;
    if (!ul || !this.open()) {
      return;
    }
    if (ul.parentElement !== document.body) {
      document.body.appendChild(ul);
    }
    this.syncListPosition();
    this.bindReposition();
  }

  private readonly syncListPosition = (): void => {
    const input = this.fieldInput()?.nativeElement;
    if (!input) {
      return;
    }
    const rect = input.getBoundingClientRect();
    const gap = 2;
    const preferred = 160;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < 96 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(72, Math.min(preferred, openUp ? spaceAbove : spaceBelow));
    const top = openUp ? Math.max(gap, rect.top - maxHeight) : rect.bottom + gap;
    const next = { top, left: rect.left, width: rect.width, maxHeight };
    const prev = this.listBox();
    if (
      prev.top === next.top &&
      prev.left === next.left &&
      prev.width === next.width &&
      prev.maxHeight === next.maxHeight
    ) {
      return;
    }
    this.listBox.set(next);
  };

  private bindReposition(): void {
    if (this.repositionListening) {
      return;
    }
    this.repositionListening = true;
    window.addEventListener('scroll', this.syncListPosition, true);
    window.addEventListener('resize', this.syncListPosition);
  }

  private unbindReposition(): void {
    if (!this.repositionListening) {
      return;
    }
    this.repositionListening = false;
    window.removeEventListener('scroll', this.syncListPosition, true);
    window.removeEventListener('resize', this.syncListPosition);
  }

  private emitResolved(raw: string): void {
    const text = raw.trim();
    const match = this.resolveByExactName(text);
    if (match) {
      this.valueChange.emit({
        operationConfigurationId: match.id,
        operationConfigurationName: match.name,
      });
      return;
    }
    this.valueChange.emit({
      operationConfigurationId: '',
      operationConfigurationName: text,
    });
  }

  private resolveByExactName(text: string): { id: string; name: string } | null {
    const q = text.trim().toLowerCase();
    if (!q) {
      return null;
    }
    return (
      this.allConfigurationNames().find((c) => c.name.trim().toLowerCase() === q) ?? null
    );
  }
}
