import type { BadgeTone } from "@/components/ui/Badge";

/**
 * Arabic-safe label + badge tone for order payment/fulfillment statuses.
 * Values mirror Prisma enums in apps/api/prisma/schema.prisma.
 */
export const orderStatusMeta: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  // OrderStatus (payment)
  PENDING: { label: "معلّق", tone: "warning" },
  PAID: { label: "مدفوع", tone: "success" },
  FAILED: { label: "فشل", tone: "danger" },
  CANCELLED: { label: "ملغى", tone: "neutral" },
  REFUNDED: { label: "مسترجع", tone: "info" },
  // FulfillmentStatus (delivery)
  DELIVERED: { label: "مُسلَّم", tone: "success" },
};

export function orderStatusMetaFor(
  status: string | null | undefined,
): { label: string; tone: BadgeTone } {
  if (!status) return { label: "—", tone: "neutral" };
  return orderStatusMeta[status] ?? { label: status, tone: "neutral" };
}

const REL_UNITS: Array<
  [Intl.RelativeTimeFormatUnit, (ms: number) => number]
> = [
  ["minute", (ms) => ms / 60_000],
  ["hour", (ms) => ms / 3_600_000],
  ["day", (ms) => ms / 86_400_000],
  ["week", (ms) => ms / 604_800_000],
  ["month", (ms) => ms / 2_592_000_000],
];

/** "منذ 5 دقائق"-style relative time in Arabic (falls back to the date). */
export function formatRelativeTime(
  input: string | number | Date | null | undefined,
): string {
  if (!input) return "—";
  const date = new Date(input);
  const time = date.getTime();
  if (Number.isNaN(time)) return "—";

  const diff = Date.now() - time;
  if (Math.abs(diff) < 60_000) return "الآن";

  for (const [unit, div] of REL_UNITS) {
    const value = Math.floor(div(diff));
    if (value < 1) continue;
    const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
    return rtf.format(-value, unit);
  }
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(date);
}
