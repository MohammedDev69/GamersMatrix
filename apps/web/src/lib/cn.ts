type ClassValue = string | false | null | undefined | 0;

/** Lightweight className joiner — no external dependency. */
export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}
