/**
 * Payment provider abstraction.
 * Paymob is the production adapter; empty credentials → mock/dev only.
 */
export type PaymentCheckoutItem = {
  title: string;
  unitPriceEGP: number;
  quantity: number;
};

export type CreatePaymentCheckoutInput = {
  orderId: string;
  amountEGP: number;
  user: { name: string; email: string };
  items: PaymentCheckoutItem[];
  notificationUrl: string;
  redirectionUrl: string;
};

export type PaymentCheckoutResult = {
  checkoutUrl: string;
  clientSecret: string;
  publicKey: string;
  intentionId?: string;
  /** True only when provider credentials are absent (development). */
  mock: boolean;
};

export interface PaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  createCheckout(
    input: CreatePaymentCheckoutInput,
  ): Promise<PaymentCheckoutResult>;
  verifyWebhookSignature(
    payload: Record<string, unknown>,
    receivedHmac?: string | null,
  ): boolean;
}
