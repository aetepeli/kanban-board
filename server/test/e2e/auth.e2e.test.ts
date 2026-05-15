import { type User, UserActivityLog, PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import request from 'supertest';

jest.mock('config/db', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
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

jest.mock('utils/generateToken', () => ({
  __esModule: true,
  default: {
    generateAccessToken: jest.fn().mockReturnValue('fake-access-token'),
    generateRefreshToken: jest.fn().mockReturnValue('fake-refresh-token'),
    verifyToken: jest.fn().mockReturnValue({ userId: 'fake-user-id' }),
    generate2FATempToken: jest.fn().mockReturnValue('fake-2fa-token'),
    generate6digitcodes: jest.fn().mockReturnValue('123456'),
    generateMagicToken: jest.fn().mockReturnValue('fake-magic-token'),
  },
}));

jest.mock('utils/tfaUtils', () => ({
  tfaUtils: {
    verify: jest.fn(),
    generateSecret: jest.fn(),
  },
}));

jest.mock('otplib', () => ({
  __esModule: true,
  authenticator: { verify: jest.fn(), generate: jest.fn(), generateSecret: jest.fn() },
}));

import { prisma } from 'config/db';
import redisClient from 'utils/redisUtils';
import emailUtils from 'utils/emailUtils';
import hashUtils from 'utils/hashUtils';
import tokenUtils from 'utils/generateToken';

import { createTestApp } from '../../test/helpers/testApp';
import { createTestUser } from '../../test/helpers/testAuth';
import fixtures from '../helpers/fixtures';
import { activityLogger } from '../../src/utils/activityHandler';
import { tfaUtils } from 'utils/tfaUtils';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const app = createTestApp();

const mockUser = fixtures.user.build({
  id: 'fake-user-id',
  email: 'test@example.com',
}) as User;

prismaMock.user.findUnique.mockResolvedValue(mockUser);
prismaMock.user.findFirstOrThrow.mockResolvedValue(mockUser);

const mockLogs: UserActivityLog[] = [
  {
    id: 'log-1',
    userId: mockUser.id,
    action: 'LOGIN',
    details: 'Login Log Details',
    ipAddress: '127.168.1.1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'log-2',
    userId: mockUser.id,
    action: 'UPDATE_COLUMN',
    details: 'Update Column Log Details',
    ipAddress: '127.168.1.1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'log-3',
    userId: mockUser.id,
    action: 'MOVED_CARD',
    details: 'Moved Card Log Details',
    ipAddress: '127.168.1.1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

prismaMock.userActivityLog.findMany.mockResolvedValue(mockLogs);

// ─────────────────────────────────────────────────────────────────────────────

describe('Auth Routes — Mock DB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // POST /register

  describe('POST /api/v1/auth/register', () => {
    const validBody = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
    };

    describe('sunnyDay', () => {
      it("geçerli bilgilerle kayıt — 201, token ve user dönmeli, password response'da olmamalı", async () => {
        const user = fixtures.user.build({ email: validBody.email }) as User;

        const { password: _password, ...safeUser } = user;

        prismaMock.user.findFirst.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue(safeUser as User);
        (hashUtils.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
        (tokenUtils.generateAccessToken as jest.Mock).mockReturnValue(fixtures.token.accessToken);
        (redisClient.set as jest.Mock).mockResolvedValue('OK');
        (emailUtils.sendEmail as jest.Mock).mockResolvedValue(true);

        const res = await request(app).post('/api/v1/auth/register').send(validBody);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('token');
        expect(res.body.data.user.email).toBe(validBody.email);
        expect(res.body.data.user).not.toHaveProperty('password');
        expect(emailUtils.sendEmail).toHaveBeenCalledTimes(1);
        expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      });
    });

    describe('rainyDay', () => {
      it('email zaten kayıtlıysa — 409 Conflict dönmeli ve create çağrılmamalı', async () => {
        prismaMock.user.findFirst.mockResolvedValue(fixtures.user.build() as User);

        const res = await request(app).post('/api/v1/auth/register').send(validBody);

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(prismaMock.user.create).not.toHaveBeenCalled();
      });

      it("email eksikse — 400 dönmeli, DB'ye hiç erişilmemeli", async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({ fullName: 'Test', password: 'Password123!' });

        expect(res.status).toBe(400);
        expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
        expect(prismaMock.user.create).not.toHaveBeenCalled();
      });

      it('geçersiz email formatı — 400 dönmeli', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({ ...validBody, email: 'gecersiz-format' });

        expect(res.status).toBe(400);
        expect(prismaMock.user.create).not.toHaveBeenCalled();
      });

      it('şifre eksikse — 400 dönmeli', async () => {
        const res = await request(app).post('/api/v1/auth/register').send({ fullName: 'Test', email: 'test@test.com' });

        expect(res.status).toBe(400);
        expect(prismaMock.user.create).not.toHaveBeenCalled();
      });
    });
  });

  // POST /login

  describe('POST /api/v1/auth/login', () => {
    const validBody = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    describe('sunnyDay', () => {
      it('doğru bilgilerle giriş — 200, accessToken ve refreshToken dönmeli, password olmamalı', async () => {
        const user = fixtures.user.build({ email: validBody.email }) as User;

        prismaMock.user.findUniqueOrThrow.mockResolvedValue(user);
        (hashUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
        (tokenUtils.generateAccessToken as jest.Mock).mockReturnValue(fixtures.token.accessToken);
        (tokenUtils.generateRefreshToken as jest.Mock).mockReturnValue(fixtures.token.refreshToken);

        const res = await request(app).post('/api/v1/auth/login').send(validBody);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken', fixtures.token.accessToken);
        expect(res.body.data).toHaveProperty('refreshToken');
        expect(res.body.data.user).not.toHaveProperty('password');
      });

      it('2FA aktif kullanıcı — require2FA:true ve tempToken dönmeli, accessToken olmamalı', async () => {
        const userWith2FA = fixtures.user.with2FA() as User;

        prismaMock.user.findUniqueOrThrow.mockResolvedValue(userWith2FA);
        (hashUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
        (tokenUtils.generate2FATempToken as jest.Mock).mockReturnValue(fixtures.token.tempToken);

        const res = await request(app).post('/api/v1/auth/login').send(validBody);

        expect(res.status).toBe(200);
        expect(res.body.data.require2FA).toBe(true);
        expect(res.body.data.tempToken).toBe(fixtures.token.tempToken);
        expect(res.body.data).not.toHaveProperty('accessToken');
      });
    });

    describe('rainyDay', () => {
      it('yanlış şifre — 401 dönmeli', async () => {
        prismaMock.user.findUniqueOrThrow.mockResolvedValue(fixtures.user.build() as User);
        (hashUtils.verifyPassword as jest.Mock).mockResolvedValue(false);

        const res = await request(app).post('/api/v1/auth/login').send(validBody);

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('olmayan email — hata dönmeli', async () => {
        prismaMock.user.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

        const res = await request(app).post('/api/v1/auth/login').send(validBody);

        expect([401, 404, 500]).toContain(res.status);
        expect(res.body.success).toBe(false);
      });

      it("email eksikse — 400 dönmeli, DB'ye erişilmemeli", async () => {
        const res = await request(app).post('/api/v1/auth/login').send({ password: 'Password123!' });

        expect(res.status).toBe(400);
        expect(prismaMock.user.findUniqueOrThrow).not.toHaveBeenCalled();
      });
    });
  });

  // POST /forgot-password

  describe('POST /api/v1/auth/forgot-password', () => {
    describe('sunnyDay', () => {
      it('var olan email — 200 ve güvenli mesaj dönmeli, email gönderilmeli', async () => {
        const user = fixtures.user.build() as User;

        prismaMock.user.findFirst.mockResolvedValue(user);
        (redisClient.get as jest.Mock).mockResolvedValue(null);
        (redisClient.set as jest.Mock).mockResolvedValue('OK');
        (emailUtils.sendEmail as jest.Mock).mockResolvedValue(true);

        const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: user.email });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.message).toContain('reset link has been sent');
        expect(emailUtils.sendEmail).toHaveBeenCalledTimes(1);
      });
    });

    describe('rainyDay', () => {
      it('olmayan email — yine 200 dönmeli (email leak koruması), email atılmamalı', async () => {
        prismaMock.user.findFirst.mockResolvedValue(null);

        const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'yok@example.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(emailUtils.sendEmail).not.toHaveBeenCalled();
      });

      it('cooldown aktifse — 429 dönmeli, email atılmamalı', async () => {
        const user = fixtures.user.build() as User;

        prismaMock.user.findFirst.mockResolvedValue(user);
        (redisClient.get as jest.Mock).mockResolvedValue('{}');
        (redisClient.ttl as jest.Mock).mockResolvedValue(490);

        const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: user.email });

        expect([429, 400]).toContain(res.status);
        expect(emailUtils.sendEmail).not.toHaveBeenCalled();
      });
    });
  });

  // GET /user-logs

  describe('GET /api/v1/auth/user-logs', () => {
    let authCredential = '';
    const testUserId = 'reat-test-id-123';

    beforeAll(async () => {
      const mockUser: User = fixtures.user.build({
        id: testUserId,
        email: 'test@example.com',
        password: 'hashed_password',
      });

      prismaMock.user.findUniqueOrThrow.mockResolvedValue(mockUser);
      (hashUtils.verifyPassword as jest.Mock).mockResolvedValue(true);

      (tokenUtils.generateAccessToken as jest.Mock).mockReturnValue('mocked-access-token');
      (tokenUtils.generateRefreshToken as jest.Mock).mockReturnValue('mocked-refresh-token');

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });

      authCredential = loginRes.body.data.accessToken;
    });

    describe('sunnyDay', () => {
      it('geçerli token ile loglar dönmeli — 200', async () => {
        (tokenUtils.verifyToken as jest.Mock).mockReturnValue({ userId: testUserId });

        const mockUser: User = fixtures.user.build({ id: testUserId });
        prismaMock.user.findUnique.mockResolvedValue(mockUser);

        const mockLogs: UserActivityLog[] = [
          {
            id: 'log-1',
            userId: mockUser.id,
            action: 'LOGIN',
            details: 'Login Log Details',
            ipAddress: '127.168.1.1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'log-2',
            userId: mockUser.id,
            action: 'UPDATE_COLUMN',
            details: 'Update Column Log Details',
            ipAddress: '127.168.1.1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'log-3',
            userId: mockUser.id,
            action: 'MOVED_CARD',
            details: 'Moved Card Log Details',
            ipAddress: '127.168.1.1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        prismaMock.userActivityLog.findMany.mockResolvedValue(mockLogs);

        const res = await request(app).get('/api/v1/auth/user-logs').set('Authorization', `Bearer ${authCredential}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(3);
      });
    });

    describe('rainyDay', () => {
      it('token olmadan — 401 dönmeli', async () => {
        const res = await request(app).get('/api/v1/auth/user-logs');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(prismaMock.userActivityLog.findMany).not.toHaveBeenCalled();
      });

      it('geçersiz token — 401 dönmeli', async () => {
        const res = await request(app).get('/api/v1/auth/user-logs').set('Authorization', 'Bearer gecersiz.token.123');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });
  });

  // POST /2fa/disable

  describe('POST /api/v1/auth/2fa/disable', () => {
    describe('sunnyDay', () => {
      it('geçerli token ve doğru kod ile 2FA devre dışı bırakılmalı — 200', async () => {
        const { user, accessToken } = createTestUser({
          isTfaEnabled: true,
          tfaSecret: 'SECRET123',
        });

        (tokenUtils.verifyToken as jest.Mock).mockReturnValue({ userId: user.id });

        (tfaUtils.verify as jest.Mock).mockResolvedValue({ valid: true });

        prismaMock.user.findUnique.mockResolvedValue(user as User);

        prismaMock.user.findFirstOrThrow.mockResolvedValue(user as User);
        prismaMock.user.update.mockResolvedValue({
          ...user,
          isTfaEnabled: false,
          tfaSecret: null,
        } as User);

        (activityLogger.logUser as jest.Mock).mockResolvedValue(undefined);

        const res = await request(app)
          .post('/api/v1/auth/2fa/disable')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ code: '123456' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(prismaMock.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { isTfaEnabled: false, tfaSecret: null },
          })
        );
      });
    });

    describe('rainyDay', () => {
      it('token olmadan — 401 dönmeli, DB güncellenmemeli', async () => {
        const res = await request(app).post('/api/v1/auth/2fa/disable').send({ code: '123456' });

        expect(res.status).toBe(401);
        expect(prismaMock.user.update).not.toHaveBeenCalled();
      });

      it('yanlış TOTP kodu — hata dönmeli, DB güncellenmemeli', async () => {
        const { user, accessToken } = createTestUser({
          isTfaEnabled: true,
          tfaSecret: 'SECRET123',
        });

        const otplibMock = jest.requireMock('otplib') as {
          authenticator: { verify: jest.Mock };
        };

        prismaMock.user.findFirstOrThrow.mockResolvedValue(user as User);
        otplibMock.authenticator.verify.mockReturnValue(false);

        const res = await request(app)
          .post('/api/v1/auth/2fa/disable')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ code: '000000' });

        expect(res.status).toBe(401);
        expect(prismaMock.user.update).not.toHaveBeenCalled();
      });
    });
  });

  afterAll(async () => {
    if (redisClient && typeof redisClient.quit === 'function') {
      await redisClient.quit();
    }

    jest.restoreAllMocks();

    jest.clearAllTimers();
  });
});
