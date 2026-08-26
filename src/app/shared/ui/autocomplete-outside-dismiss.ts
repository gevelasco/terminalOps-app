import type { DestroyRef, ElementRef } from '@angular/core';

/** Cierra el panel al hacer clic fuera del host (combobox / autocomplete). */
export function installAutocompleteOutsideDismiss(
  hostRef: ElementRef<HTMLElement>,
  isOpen: () => boolean,
  close: () => void,
  destroyRef: DestroyRef,
  extraRoot?: () => Node | null | undefined,
): void {
  const onDocumentPointerDown = (ev: PointerEvent): void => {
    if (!isOpen()) {
      return;
    }
    const target = ev.target;
    if (!(target instanceof Node)) {
      close();
      return;
    }
    if (hostRef.nativeElement.contains(target)) {
      return;
    }
    const extra = extraRoot?.();
    if (extra && extra.contains(target)) {
      return;
    }
    close();
  };
  document.addEventListener('pointerdown', onDocumentPointerDown);
  destroyRef.onDestroy(() => {
    document.removeEventListener('pointerdown', onDocumentPointerDown);
  });
}
