/** Keep Tab focus inside a container while a modal/drawer is open. */
export function trapTabKey(
  e: KeyboardEvent,
  container: HTMLElement | null,
): void {
  if (e.key !== "Tab" || !container) return;
  const focusable = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  const list = Array.from(focusable).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
  );
  if (list.length === 0) {
    e.preventDefault();
    container.focus();
    return;
  }
  const first = list[0];
  const last = list[list.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (e.shiftKey) {
    if (active === first || !container.contains(active)) {
      e.preventDefault();
      last.focus();
    }
  } else if (active === last || !container.contains(active)) {
    e.preventDefault();
    first.focus();
  }
}
