jest.mock('@nestjs/config', () => ({
  ConfigService: class {
    get() {
      return '';
    }
  },
}));

import { StoreService } from './store.service';

describe('StoreService public config', () => {
  it('exposes non-secret fields and missing hints', async () => {
    const prisma = {
      storeSettings: {
        upsert: jest.fn().mockResolvedValue({
          storeName: 'Gamers Matrix',
          defaultLocale: 'ar',
          currencyCode: 'EGP',
          timezone: 'Africa/Cairo',
          supportWhatsApp: null,
          supportEmail: null,
          publicNotice: null,
          seoTitleDefault: null,
          seoDescriptionDefault: null,
        }),
      },
    };
    const config = {
      get: jest.fn().mockReturnValue(undefined),
    };
    const service = new StoreService(prisma as never, config as never);
    const pub = await service.getPublicConfig();
    expect(pub.storeName).toBe('Gamers Matrix');
    expect(pub.configuration.supportWhatsAppConfigured).toBe(false);
    expect(pub.missingProductionHints).toContain('supportWhatsApp');
    expect(pub.missingProductionHints).toContain('paymentProvider');
  });
});
