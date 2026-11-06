jest.mock('@nestjs/config', () => ({
  ConfigService: class {
    get() {
      return '';
    }
  },
}));

jest.mock('@nestjs/jwt', () => ({
  JwtService: class {
    signAsync() {
      return Promise.resolve('new-token');
    }
  },
}));

import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService password change', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const jwt = {
    signAsync: jest.fn().mockResolvedValue('new-token'),
  };
  const audit = { log: jest.fn() };
  const service = new AuthService(
    prisma as never,
    jwt as never,
    audit as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('rejects wrong current password', async () => {
    const hash = await bcrypt.hash('correct-pass', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      role: 'USER',
      passwordHash: hash,
    });

    await expect(
      service.changePassword('u1', {
        currentPassword: 'wrong',
        newPassword: 'newpassword1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects same new password', async () => {
    await expect(
      service.changePassword('u1', {
        currentPassword: 'same',
        newPassword: 'same',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates hash and returns new token on success', async () => {
    const hash = await bcrypt.hash('old-password', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      role: 'USER',
      passwordHash: hash,
    });
    prisma.user.update.mockResolvedValue({});

    const result = await service.changePassword('u1', {
      currentPassword: 'old-password',
      newPassword: 'newpassword1',
    });

    expect(result.ok).toBe(true);
    expect(result.accessToken).toBe('new-token');
    expect(prisma.user.update).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.password.change' }),
    );
  });
});
