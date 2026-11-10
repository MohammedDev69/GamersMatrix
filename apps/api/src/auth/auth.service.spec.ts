jest.mock('@nestjs/config', () => ({
  ConfigService: class {},
}));

import { AuthService } from './auth.service';

describe('AuthService Supabase identity sync', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    cart: { upsert: jest.fn() },
  };
  const audit = { log: jest.fn() };
  const config = {
    get: jest.fn((key: string) =>
      key === 'SUPABASE_ADMIN_EMAILS' ? 'owner@example.com' : undefined,
    ),
  };
  const service = new AuthService(
    prisma as never,
    audit as never,
    config as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('links a legacy commerce user by email', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'legacy-user',
        email: 'customer@example.com',
        name: 'Customer',
        role: 'USER',
        avatarUrl: null,
        authProvider: null,
        createdAt: new Date(),
      });
    prisma.user.update.mockResolvedValue({
      id: 'legacy-user',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'USER',
      avatarUrl: null,
      authProvider: 'google',
      createdAt: new Date(),
    });

    const result = await service.syncSupabaseIdentity({
      subject: '00000000-0000-4000-8000-000000000001',
      email: 'customer@example.com',
      name: 'Customer',
      provider: 'google',
    });

    expect(result.id).toBe('legacy-user');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          supabaseId: '00000000-0000-4000-8000-000000000001',
          passwordHash: null,
        }),
      }),
    );
    expect(prisma.cart.upsert).toHaveBeenCalled();
  });

  it('creates an admin only from the configured email allow-list', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'new-user',
      email: 'owner@example.com',
      name: 'Owner',
      role: 'ADMIN',
      avatarUrl: null,
      authProvider: 'discord',
      createdAt: new Date(),
    });

    await service.syncSupabaseIdentity({
      subject: '00000000-0000-4000-8000-000000000002',
      email: 'owner@example.com',
      name: 'Owner',
      provider: 'discord',
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'ADMIN' }),
      }),
    );
  });
});
