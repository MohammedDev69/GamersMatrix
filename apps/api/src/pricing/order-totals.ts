export type CartLineInput = {
  unitPriceEGP: number;
  quantity: number;
};

export type OrderTotals = {
  subtotalEGP: number;
  discountEGP: number;
  feesEGP: number;
  taxEGP: number;
  totalEGP: number;
  couponCode: string | null;
};

/** Round to 2 decimal places (EGP piastres). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateSubtotal(lines: CartLineInput[]): number {
  const raw = lines.reduce(
    (sum, line) => sum + Number(line.unitPriceEGP) * Number(line.quantity),
    0,
  );
  return roundMoney(raw);
}

/**
 * Build server totals. Discount cannot exceed subtotal or go negative.
 * Fees/tax reserved at 0 until store settings wire them.
 */
export function buildOrderTotals(params: {
  lines: CartLineInput[];
  discountEGP?: number;
  couponCode?: string | null;
  feesEGP?: number;
  taxEGP?: number;
}): OrderTotals {
  const subtotalEGP = calculateSubtotal(params.lines);
  const discountEGP = roundMoney(
    Math.min(Math.max(0, Number(params.discountEGP) || 0), subtotalEGP),
  );
  const feesEGP = roundMoney(Math.max(0, Number(params.feesEGP) || 0));
  const taxEGP = roundMoney(Math.max(0, Number(params.taxEGP) || 0));
  const totalEGP = roundMoney(
    Math.max(0, subtotalEGP - discountEGP + feesEGP + taxEGP),
  );

  return {
    subtotalEGP,
    discountEGP,
    feesEGP,
    taxEGP,
    totalEGP,
    couponCode: params.couponCode?.trim().toUpperCase() || null,
  };
}
