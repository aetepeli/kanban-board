import { type Column, PrismaClient } from '@prisma/client';
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

jest.mock('utils/tfaUtils', () => ({
  tfaUtils: {
    verify: jest.fn(),
    generateSecret: jest.fn(),
  },
}));

import { prisma } from 'config/db';
import { createTestApp } from '../../test/helpers/testApp';
import { createTestUser } from '../../test/helpers/testAuth';
import fixtures from '../helpers/fixtures';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const app = createTestApp();

// ─────────────────────────────────────────────────────────────────────────────

describe('Column Routes — Mock DB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // POST /boards/:boardId/columns

  describe('POST /api/v1/boards/:boardId/columns', () => {
    describe('sunnyDay', () => {
      it('board sahibi column oluşturur — 201, column dönmeli', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const column = fixtures.column.build({ boardId: board.id, order: 0 });

        prismaMock.user.findUnique.mockResolvedValue(user);

        prismaMock.board.findFirstOrThrow.mockResolvedValue(board);

        prismaMock.column.findFirst.mockResolvedValue(null);

        prismaMock.column.create.mockResolvedValue(column);

        const res = await request(app)
          .post(`/api/v1/boards/${board.id}/columns`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: column.title });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({ title: column.title, boardId: board.id });
      });

      it('mevcut column varsa order otomatik artar — 201', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const lastColumn = fixtures.column.build({ boardId: board.id, order: 2 });

        const newColumn = fixtures.column.build({ boardId: board.id, order: 3 });

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.board.findFirstOrThrow.mockResolvedValue(board);

        prismaMock.column.findFirst.mockResolvedValue(lastColumn);
        prismaMock.column.create.mockResolvedValue(newColumn);

        const res = await request(app)
          .post(`/api/v1/boards/${board.id}/columns`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: newColumn.title });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.order).toBe(3);
      });
    });

    describe('rainyDay', () => {
      it('board sahibi değil — 4xx dönmeli', async () => {
        const { user, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(user);

        prismaMock.board.findFirstOrThrow.mockRejectedValue(new Error('Not authorized'));

        const res = await request(app)
          .post('/api/v1/boards/baska-board/columns')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'Yeni Kolon' });

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.body.success).toBe(false);
      });

      it('token olmadan — 401 dönmeli', async () => {
        const res = await request(app).post('/api/v1/boards/board-id/columns').send({ title: 'Test' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });
  });

  // PATCH /boards/:boardId/columns/:columnId

  describe('PATCH /api/v1/boards/:boardId/columns/:columnId', () => {
    describe('sunnyDay', () => {
      it('board sahibi column başlığını günceller — 200, güncel column dönmeli', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const column = fixtures.column.build({ boardId: board.id });

        const updatedColumn: Column = {
          ...column,
          title: 'Güncel Başlık',

          createdAt: column.createdAt || new Date(),
          updatedAt: new Date(),
        };

        prismaMock.user.findUnique.mockResolvedValue(user);

        prismaMock.board.findFirst.mockResolvedValue(board);
        prismaMock.board.findFirstOrThrow.mockResolvedValue(board);

        prismaMock.column.findFirst.mockResolvedValue(column);
        prismaMock.column.findFirstOrThrow.mockResolvedValue(column);

        prismaMock.column.update.mockResolvedValue(updatedColumn);

        const res = await request(app)
          .patch(`/api/v1/boards/${board.id}/columns/${column.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'Güncel Başlık' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('Güncel Başlık');
      });
    });

    describe('rainyDay', () => {
      it('column bulunamadı veya board sahibi değil — 4xx dönmeli', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const column = fixtures.column.build({ boardId: board.id });

        prismaMock.column.findFirst.mockResolvedValue(null);
        prismaMock.column.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

        const res = await request(app)
          .patch(`/api/v1/boards/${board.id}/columns/${column.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'Yeni Başlık' });

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.body.success).toBe(false);
      });

      it('token olmadan — 401 dönmeli', async () => {
        const board = fixtures.board.build();
        const column = fixtures.column.build();

        const res = await request(app).put(`/api/v1/boards/${board.id}/columns/${column.id}`).send({ title: 'Test' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });
  });

  // DELETE /boards/:boardId/columns/:columnId

  describe('DELETE /api/v1/boards/:boardId/columns/:columnId', () => {
    describe('sunnyDay', () => {
      it('board sahibi column siler — 200 dönmeli', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const column = fixtures.column.build({ boardId: board.id });

        prismaMock.user.findUnique.mockResolvedValue(user);

        prismaMock.column.findFirstOrThrow.mockResolvedValueOnce(column).mockResolvedValueOnce(column);

        prismaMock.column.delete.mockResolvedValue(column);

        const res = await request(app)
          .delete(`/api/v1/boards/${board.id}/columns/${column.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('rainyDay', () => {
      it('column bulunamadı — 4xx dönmeli', async () => {
        const { user, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(user);

        prismaMock.column.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

        const res = await request(app)
          .delete('/api/v1/boards/board-id/columns/nonexistent-column')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.body.success).toBe(false);
      });

      it('column var ama board sahibi değil — 4xx dönmeli', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: 'baska-kullanici-id' });
        const column = fixtures.column.build({ boardId: board.id });

        prismaMock.user.findUnique.mockResolvedValue(user);

        prismaMock.column.findFirstOrThrow
          .mockResolvedValueOnce(column)

          .mockRejectedValueOnce(new Error('Not authorized'));

        const res = await request(app)
          .delete(`/api/v1/boards/${board.id}/columns/${column.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.body.success).toBe(false);
      });

      it('token olmadan — 401 dönmeli', async () => {
        const res = await request(app).delete('/api/v1/boards/board-id/columns/column-id');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();

    jest.clearAllTimers();
  });
});
