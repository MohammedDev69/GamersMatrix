import { createHmac, timingSafeEqual } from 'crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type {
  CreatePaymentCheckoutInput,
  PaymentCheckoutResult,
  PaymentProvider,
} from './payment-provider';

export type PaymobBillingData = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  apartment?: string;
  floor?: string;
  street?: string;
  building?: string;
  city?: string;
  country?: string;
  state?: string;
  postal_code?: string;
};

export type PaymobIntentionItem = {
  name: string;
  amount: number;
  description?: string;
  quantity: number;
};

export type CreateIntentionInput = {
  amountInCents: number;
  orderId: string;
  items: PaymobIntentionItem[];
  billingData: PaymobBillingData;
  notificationUrl: string;
  redirectionUrl: string;
};

export type IntentionResult = {
  clientSecret: string;
  intentionId?: string;
  checkoutUrl: string;
  publicKey: string;
  mock: boolean;
};

@Injectable()
export class PaymobService implements PaymentProvider {
  readonly name = 'paymob';
  private readonly logger = new Logger(PaymobService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    const secretKey = this.config.get<string>('PAYMOB_SECRET_KEY');
    const publicKey = this.config.get<string>('PAYMOB_PUBLIC_KEY');
    const integrationId = this.config.get<string>('PAYMOB_INTEGRATION_ID');
    return Boolean(secretKey && publicKey && integrationId);
  }

  buildMockCheckoutUrl(orderId: string): string {
    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    return `${frontendUrl}/ar/checkout/success?orderId=${orderId}&mock=1`;
  }

  async createCheckout(
    input: CreatePaymentCheckoutInput,
  ): Promise<PaymentCheckoutResult> {
    const nameParts = input.user.name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'User';
    const amountInCents = Math.round(input.amountEGP * 100);

    return this.createIntention({
      amountInCents,
      orderId: input.orderId,
      items: input.items.map((item) => ({
        name: item.title,
        amount: Math.round(item.unitPriceEGP * 100),
        quantity: item.quantity,
        description: item.title,
      })),
      billingData: {
        first_name: firstName,
        last_name: lastName,
        email: input.user.email,
        phone_number: '01000000000',
      },
      notificationUrl: input.notificationUrl,
      redirectionUrl: input.redirectionUrl,
    });
  }

  verifyWebhookSignature(
    payload: Record<string, unknown>,
    receivedHmac?: string | null,
  ): boolean {
    return this.verifyHmac(payload, receivedHmac);
  }

  async createIntention(input: CreateIntentionInput): Promise<IntentionResult> {
    const publicKey = this.config.get<string>('PAYMOB_PUBLIC_KEY', '');
    const secretKey = this.config.get<string>('PAYMOB_SECRET_KEY', '');
    const integrationIdRaw = this.config.get<string>(
      'PAYMOB_INTEGRATION_ID',
      '',
    );
    const baseUrl = this.config.get<string>(
      'PAYMOB_BASE_URL',
      'https://accept.paymob.com/v1',
    );

    if (!this.isConfigured()) {
      return {
        clientSecret: `mock_secret_${input.orderId}`,
        checkoutUrl: this.buildMockCheckoutUrl(input.orderId),
        publicKey: publicKey || 'mock_public_key',
        mock: true,
      };
    }

    const integrationId = Number(integrationIdRaw);
    if (Number.isNaN(integrationId)) {
      throw new BadRequestException('Invalid PAYMOB_INTEGRATION_ID');
    }

    try {
      const response = await axios.post(
        `${baseUrl.replace(/\/$/, '')}/intention/`,
        {
          amount: input.amountInCents,
          currency: 'EGP',
          payment_methods: [integrationId],
          items: input.items,
          billing_data: {
            apartment: 'NA',
            floor: 'NA',
            street: 'NA',
            building: 'NA',
            city: 'Cairo',
            country: 'EG',
            state: 'Cairo',
            postal_code: '00000',
            ...input.billingData,
          },
          special_reference: input.orderId,
          notification_url: input.notificationUrl,
          redirection_url: input.redirectionUrl,
        },
        {
          headers: {
            Authorization: `Token ${secretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const clientSecret =
        response.data?.client_secret ??
        response.data?.clientSecret ??
        response.data?.intention?.client_secret;

      if (!clientSecret || typeof clientSecret !== 'string') {
        this.logger.error(
          `Paymob intention missing client_secret: ${JSON.stringify(response.data)}`,
        );
        throw new BadRequestException('Paymob intention failed');
      }

      const intentionId =
        response.data?.id?.toString?.() ??
        response.data?.intention_id?.toString?.();

      const checkoutUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(clientSecret)}`;

      return {
        clientSecret,
        intentionId,
        checkoutUrl,
        publicKey,
        mock: false,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Paymob intention error: ${JSON.stringify(error.response?.data ?? error.message)}`,
        );
      } else {
        this.logger.error(`Paymob intention error: ${String(error)}`);
      }
      throw new BadRequestException('Failed to create Paymob intention');
    }
  }

  verifyHmac(
    payload: Record<string, unknown>,
    receivedHmac?: string | null,
  ): boolean {
    const secret = this.config.get<string>('PAYMOB_HMAC_SECRET');
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    // Fail closed when live Paymob is configured or in production.
    // Unsigned acceptance is only for local mock (no Paymob credentials).
    if (!secret) {
      if (nodeEnv === 'production' || this.isConfigured()) {
        this.logger.error(
          'PAYMOB_HMAC_SECRET missing — rejecting webhook (fail-closed)',
        );
        return false;
      }
      this.logger.warn(
        'PAYMOB_HMAC_SECRET empty — accepting webhook in development mock only',
      );
      return true;
    }

    if (!receivedHmac) {
      return false;
    }

    const data =
      payload.obj && typeof payload.obj === 'object'
        ? (payload.obj as Record<string, unknown>)
        : payload;

    const sortedKeys = Object.keys(data).sort();
    const concatenated = sortedKeys
      .map((key) => {
        const value = data[key];
        if (value === null || value === undefined) {
          return '';
        }
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value);
      })
      .join('');

    const computed = createHmac('sha512', secret)
      .update(concatenated)
      .digest('hex');

    try {
      const a = Buffer.from(computed, 'utf8');
      const b = Buffer.from(receivedHmac, 'utf8');
      if (a.length !== b.length) {
        return false;
      }
      return timingSafeEqual(a, b);
    } catch {
      return computed === receivedHmac;
    }
  }
}
