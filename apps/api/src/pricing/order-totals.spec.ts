import {
  buildOrderTotals,
  calculateSubtotal,
  roundMoney,
} from './order-totals';

describe('order-totals', () => {
  it('calculates subtotal from lines', () => {
    expect(
      calculateSubtotal([
        { unitPriceEGP: 100, quantity: 2 },
        { unitPriceEGP: 49.5, quantity: 1 },
      ]),
    ).toBe(249.5);
  });

  it('caps discount at subtotal and never goes negative', () => {
    const totals = buildOrderTotals({
      lines: [{ unitPriceEGP: 50, quantity: 1 }],
      discountEGP: 200,
      couponCode: 'BIG',
    });
    expect(totals.discountEGP).toBe(50);
    expect(totals.totalEGP).toBe(0);
    expect(totals.couponCode).toBe('BIG');
  });

  it('ignores negative discount input', () => {
    const totals = buildOrderTotals({
      lines: [{ unitPriceEGP: 80, quantity: 1 }],
      discountEGP: -10,
    });
    expect(totals.discountEGP).toBe(0);
    expect(totals.totalEGP).toBe(80);
  });

  it('rounds money consistently', () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(10.004)).toBe(10);
  });
});
