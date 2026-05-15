import { type User, type UserActivityLog, PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

jest.mock('config/db', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('utils/generateToken', () => ({
  __esModule: true,
  default: {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    generate6digitcodes: jest.fn(),
    generateMagicToken: jest.fn(),
    generate2FATempToken: jest.fn(),
  },
}));

jest.mock('utils/redisUtils', () => ({
  __esModule: true,
  default: { get: jest.fn(), set: jest.fn(), del: jest.fn(), ttl: jest.fn(), quit: jest.fn() },
}));

jest.mock('utils/emailUtils', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
}));

jest.mock('utils/activityHandler', () => ({
  __esModule: true,
  activityLogger: { logUser: jest.fn(), logCombined: jest.fn() },
}));

jest.mock('utils/hashUtils', () => ({
  __esModule: true,
  default: { hashPassword: jest.fn(), verifyPassword: jest.fn() },
}));

jest.mock('otplib', () => {
  const mockVerify = jest.fn();
  return {
    __esModule: true,
    authenticator: { verify: mockVerify, generate: jest.fn() },
    verify: mockVerify,
    generateSecret: jest.fn(),
  };
});

import auths from 'services/auth/auth.service';
import tokenUtils from 'utils/generateToken';
import hashUtils from 'utils/hashUtils';
import emailUtils from 'utils/emailUtils';
import { activityLogger } from 'utils/activityHandler';
import { prisma } from 'config/db';
import redisClient from 'utils/redisUtils';

import fixtures from '../helpers/fixtures';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const redisMock = {
  get: redisClient.get as jest.Mock,
  set: redisClient.set as jest.Mock,
  del: redisClient.del as jest.Mock,
  ttl: redisClient.ttl as jest.Mock,
  quit: redisClient.quit as jest.Mock,
};

const otplibMock = jest.requireMock('otplib') as { authenticator: { verify: jest.Mock } };

// ─────────────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  const setupUser = () => {
    const user = fixtures.user.build() as User;
    const token = fixtures.token.accessToken;

    prismaMock.user.findFirst.mockResolvedValue(user);
    prismaMock.user.findFirstOrThrow.mockResolvedValue(user);

    (tokenUtils.generateAccessToken as jest.Mock).mockReturnValue(token);
    (activityLogger.logUser as jest.Mock).mockResolvedValue(undefined);
    (hashUtils.verifyPassword as jest.Mock).mockResolvedValue(true);

    return { user, token };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisMock.quit();
  });

  // forgotPassword

  describe('forgotPassword', () => {
    let user: ReturnType<typeof fixtures.user.build>;

    beforeEach(() => {
      ({ user } = setupUser());
      redisMock.get.mockResolvedValue(null);
      redisMock.set.mockResolvedValue('OK');
      (emailUtils.sendEmail as jest.Mock).mockResolvedValue(true);
    });

    describe('sunnyDay', () => {
      it('should send reset email and set redis', async () => {
        const result = await auths.forgotPassword({ email: user.email });

        expect(result.message).toContain('reset link has been sent');
        expect(emailUtils.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({ to: user.email, subject: 'Password Reset' })
        );
        expect(emailUtils.sendEmail).toHaveBeenCalledTimes(1);
        expect(redisMock.set).toHaveBeenCalledWith(
          `reset_password:${user.email}`,
          expect.any(String),
          'EX',
          expect.any(Number)
        );
      });
    });

    describe('rainyDay', () => {
      it('should return the same message but not send email for non-existent email (email leak protection)', async () => {
        prismaMock.user.findFirst.mockResolvedValue(null);

        const result = await auths.forgotPassword({ email: 'yok@example.com' });

        expect(result.message).toContain('reset link has been sent');
        expect(emailUtils.sendEmail).not.toHaveBeenCalled();
        expect(redisMock.set).not.toHaveBeenCalled();
      });

      it('should throw error and not send email if cooldown has not expired', async () => {
        redisMock.get.mockResolvedValue('{}');
        redisMock.ttl.mockResolvedValue(490);
        expect.assertions(3);
        try {
          await auths.forgotPassword({ email: user.email });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Please wait');
        } finally {
          expect(emailUtils.sendEmail).not.toHaveBeenCalled();
        }
      });
    });
  });

  // resetPassword

  describe('resetPassword', () => {
    let user: ReturnType<typeof fixtures.user.build>;

    beforeEach(() => {
      ({ user } = setupUser());
      redisMock.get.mockResolvedValue(fixtures.redis.passwordReset.fresh);
      redisMock.del.mockResolvedValue(1);
      redisMock.set.mockResolvedValue('OK');
      prismaMock.user.update.mockResolvedValue(user as User);
    });

    describe('sunnyDay', () => {
      it('should successfully reset password, log activity and delete redis', async () => {
        const result = await auths.resetPassword({
          email: user.email,
          code: '555444',
          newPassword: 'newSecurePass123',
        });

        expect(result.message).toBe('Your password has been successfully reset.');
        expect(activityLogger.logUser).toHaveBeenCalledWith(expect.objectContaining({ action: 'PASSWORD_RESET' }));
        expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
        expect(redisMock.del).toHaveBeenCalledWith(`reset_password:${user.email}`);
      });
    });

    describe('rainyDay', () => {
      it('should throw error with expired code and not update DB', async () => {
        redisMock.get.mockResolvedValue(null);
        expect.assertions(3);
        try {
          await auths.resetPassword({ email: user.email, code: '555444', newPassword: 'x' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('expired or not found');
        } finally {
          expect(prismaMock.user.update).not.toHaveBeenCalled();
        }
      });

      it('should throw error with incorrect code and increase attempts', async () => {
        redisMock.ttl.mockResolvedValue(500);
        expect.assertions(4);
        try {
          await auths.resetPassword({ email: user.email, code: 'INCORRECT', newPassword: 'x' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Incorrect code');
        } finally {
          expect(redisMock.set).toHaveBeenCalledWith(
            `reset_password:${user.email}`,
            expect.stringContaining('"attempts":1'),
            'EX',
            expect.any(Number)
          );
          expect(prismaMock.user.update).not.toHaveBeenCalled();
        }
      });

      it('should delete from redis and not update DB after 3 failed attempts', async () => {
        redisMock.get.mockResolvedValue(fixtures.redis.passwordReset.exhausted);
        expect.assertions(4);
        try {
          await auths.resetPassword({ email: user.email, code: 'INCORRECT', newPassword: 'x' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBeDefined();
        } finally {
          expect(redisMock.del).toHaveBeenCalledWith(`reset_password:${user.email}`);
          expect(prismaMock.user.update).not.toHaveBeenCalled();
        }
      });
    });
  });

  // verify2FA

  describe('verify2FA', () => {
    let user: ReturnType<typeof fixtures.user.build>;

    beforeEach(() => {
      ({ user } = setupUser());
      const userWith2FASecret = { ...user, tfaSecret: 'SECRET123', isTfaEnabled: false };
      prismaMock.user.findUnique.mockResolvedValue(userWith2FASecret as User);
      prismaMock.user.update.mockResolvedValue(userWith2FASecret as User);
    });

    describe('sunnyDay', () => {
      it('should enable 2FA with correct TOTP code and log activity', async () => {
        otplibMock.authenticator.verify.mockReturnValue({ valid: true, delta: 0 });
        const result = await auths.verify2FA({ userId: user.id, token: '123456' });

        expect(result).toBe(true);
        expect(activityLogger.logUser).toHaveBeenCalledWith(expect.objectContaining({ action: '2FA_ENABLED' }));
        expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isTfaEnabled: true } }));
        expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
      });
    });

    describe('rainyDay', () => {
      it('should throw error if token is missing and not update DB', async () => {
        expect.assertions(3);
        try {
          await auths.verify2FA({ userId: user.id, token: '' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('6-digit code');
        } finally {
          expect(prismaMock.user.update).not.toHaveBeenCalled();
        }
      });

      it('should throw ALREADY_ACTIVE error if 2FA is already enabled and not update DB', async () => {
        prismaMock.user.findUnique.mockResolvedValue({ ...user, tfaSecret: 'SECRET123', isTfaEnabled: true } as User);
        expect.assertions(3);
        try {
          await auths.verify2FA({ userId: user.id, token: '123456' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('ALREADY_ACTIVE');
        } finally {
          expect(prismaMock.user.update).not.toHaveBeenCalled();
        }
      });

      it('should throw error with incorrect TOTP code and not update DB', async () => {
        otplibMock.authenticator.verify.mockReturnValue(false);
        expect.assertions(3);
        try {
          await auths.verify2FA({ userId: user.id, token: '000000' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Invalid code');
        } finally {
          expect(prismaMock.user.update).not.toHaveBeenCalled();
        }
      });
    });
  });

  // disable2FA

  describe('disable2FA', () => {
    let user: ReturnType<typeof fixtures.user.build>;

    beforeEach(() => {
      ({ user } = setupUser());
      const userWith2FA = fixtures.user.with2FA();
      prismaMock.user.findFirstOrThrow.mockResolvedValue(userWith2FA as User);
      prismaMock.user.update.mockResolvedValue(userWith2FA as User);
    });

    describe('sunnyDay', () => {
      it('should disable 2FA with correct code, delete secret and log activity', async () => {
        otplibMock.authenticator.verify.mockReturnValue({ valid: true, delta: 0 });
        const result = await auths.disable2FA({ userId: user.id, code: '123456' });

        expect(result).toBe(true);
        expect(activityLogger.logUser).toHaveBeenCalledWith(expect.objectContaining({ action: '2FA_DISABLED' }));
        expect(prismaMock.user.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { isTfaEnabled: false, tfaSecret: null } })
        );
        expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
      });
    });

    describe('rainyDay', () => {
      it('should throw error if 2FA is already disabled and not update DB', async () => {
        prismaMock.user.findFirstOrThrow.mockResolvedValue(user as User);
        expect.assertions(3);
        try {
          await auths.disable2FA({ userId: user.id, code: '123456' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('already disabled');
        } finally {
          expect(prismaMock.user.update).not.toHaveBeenCalled();
        }
      });

      it('should throw error with incorrect code and not update DB', async () => {
        otplibMock.authenticator.verify.mockReturnValue(false);
        expect.assertions(3);
        try {
          await auths.disable2FA({ userId: user.id, code: '000000' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Invalid code');
        } finally {
          expect(prismaMock.user.update).not.toHaveBeenCalled();
        }
      });
    });
  });

  // getUserActivityLogs

  describe('getUserActivityLogs', () => {
    let user: ReturnType<typeof fixtures.user.build>;

    beforeEach(() => {
      ({ user } = setupUser());
    });

    it('should fetch logs with correct where clause and return ordered result', async () => {
      const logs = fixtures.activityLog.buildMany(3, { userId: user.id });

      prismaMock.userActivityLog.findMany.mockResolvedValue(logs as UserActivityLog[]);

      const result = await auths.getUserActivityLogs(user.id);

      expect(result).toHaveLength(3);
      expect(result[0].userId).toBe(user.id);
      expect(prismaMock.userActivityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      );
      expect(prismaMock.userActivityLog.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
