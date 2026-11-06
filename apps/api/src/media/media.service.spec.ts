jest.mock('@nestjs/config', () => ({
  ConfigService: class {
    get(_key: string, fallback?: string) {
      return fallback ?? '';
    }
  },
}));

import { BadRequestException } from '@nestjs/common';
import { tmpdir } from 'os';
import { MediaService } from './media.service';

describe('MediaService destructive protection', () => {
  const prisma = {
    mediaAsset: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    product: { count: jest.fn() },
    contentPage: { count: jest.fn() },
  };
  const audit = { log: jest.fn() };
  const config = {
    get: jest.fn((key: string, fallback?: string) => {
      if (key === 'MEDIA_STORAGE_PATH') return tmpdir();
      return fallback ?? '';
    }),
  };

  const service = new MediaService(
    prisma as never,
    audit as never,
    config as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('blocks delete when media is linked to products', async () => {
    prisma.mediaAsset.findUnique.mockResolvedValue({
      id: 'm1',
      url: 'http://localhost/media/files/x.png',
      _count: { products: 2 },
      products: [],
    });

    await expect(service.remove('m1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.mediaAsset.delete).not.toHaveBeenCalled();
  });

  it('blocks delete when URL referenced by product image', async () => {
    prisma.mediaAsset.findUnique.mockResolvedValue({
      id: 'm1',
      url: 'http://localhost/media/files/x.png',
      _count: { products: 0 },
      products: [],
    });
    prisma.product.count.mockResolvedValue(1);
    prisma.contentPage.count.mockResolvedValue(0);

    await expect(service.remove('m1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
