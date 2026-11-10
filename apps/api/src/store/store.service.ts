import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import { CacheTTL, storePublicKey } from '../cache/cache-keys';

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly cache: RedisCacheService,
  ) {}

  /**
   * Public, non-secret store configuration for storefront claims.
   * Never exposes payment/SMTP secrets.
   */
  async getPublicConfig() {
    return this.cache.getOrSet(
      storePublicKey(),
      CacheTTL.STORE_PUBLIC,
      () => this.loadPublicConfig(),
    );
  }

  private async loadPublicConfig() {
    const settings = await this.prisma.storeSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
    });

    const supportWhatsApp =
      settings.supportWhatsApp?.replace(/[^\d+]/g, '') ||
      this.config.get<string>('NEXT_PUBLIC_WHATSAPP')?.replace(/[^\d+]/g, '') ||
      null;

    const supportEmail = settings.supportEmail?.trim() || null;
    const publicNotice = settings.publicNotice?.trim() || null;

    return {
      storeName: settings.storeName,
      defaultLocale: settings.defaultLocale,
      currencyCode: settings.currencyCode,
      timezone: settings.timezone,
      supportWhatsApp,
      supportEmail,
      publicNotice,
      seoTitleDefault: settings.seoTitleDefault,
      seoDescriptionDefault: settings.seoDescriptionDefault,
      configuration: {
        supportWhatsAppConfigured: Boolean(supportWhatsApp),
        supportEmailConfigured: Boolean(supportEmail),
        publicNoticeConfigured: Boolean(publicNotice),
        paymentProviderConfigured: Boolean(
          this.config.get<string>('PAYMOB_SECRET_KEY') &&
            this.config.get<string>('PAYMOB_PUBLIC_KEY') &&
            this.config.get<string>('PAYMOB_INTEGRATION_ID'),
        ),
        emailDeliveryConfigured: Boolean(
          this.config.get<string>('SMTP_HOST') &&
            this.config.get<string>('SMTP_USER'),
        ),
      },
      missingProductionHints: [
        !supportWhatsApp ? 'supportWhatsApp' : null,
        !supportEmail ? 'supportEmail' : null,
        !publicNotice ? 'publicNotice' : null,
        !(
          this.config.get<string>('PAYMOB_SECRET_KEY') &&
          this.config.get<string>('PAYMOB_PUBLIC_KEY')
        )
          ? 'paymentProvider'
          : null,
        !this.config.get<string>('SMTP_HOST') ? 'emailDelivery' : null,
      ].filter(Boolean),
    };
  }
}
