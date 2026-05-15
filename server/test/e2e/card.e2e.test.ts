import { PrismaClient, Card } from '@prisma/client';
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

const buildCard = (override: Partial<Card> = {}): Card => ({
  id: `card-${Math.random().toString(36).slice(2)}`,
  title: 'Test Card',
  content: 'Test Content', // Joi için zorunlu alan
  columnId: 'col-1',
  order: 0,
  priority: 'MEDIUM',
  deadline: null,
  assigneeId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...override,
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Card Routes — Mock DB', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    app.set('io', {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    });
  });

  // POST /api/v1/columns/:columnId/cards

  describe('POST /api/v1/columns/:columnId/cards', () => {
    describe('sunnyDay', () => {
      it('erişim yetkisi olan kullanıcı card oluşturur — 201, card dönmeli', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const column = fixtures.column.build({ boardId: board.id });
        const card: Card = buildCard({ columnId: column.id, order: 0 });

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.column.findFirstOrThrow.mockResolvedValue(column);
        prismaMock.card.findFirst.mockResolvedValue(null);
        prismaMock.card.create.mockResolvedValue(card);

        const res = await request(app)
          .post(`/api/v1/columns/${column.id}/cards`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: card.title, content: card.content, boardId: board.id });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({ title: card.title, columnId: column.id });
      });

      it('mevcut card varsa order otomatik artar — 201', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const column = fixtures.column.build({ boardId: board.id });
        const lastCard: Card = buildCard({ columnId: column.id, order: 2 });
        const newCard: Card = buildCard({ columnId: column.id, order: 3 });

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.column.findFirstOrThrow.mockResolvedValue(column);
        prismaMock.card.findFirst.mockResolvedValue(lastCard);
        prismaMock.card.create.mockResolvedValue(newCard);

        const res = await request(app)
          .post(`/api/v1/columns/${column.id}/cards`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: newCard.title, content: newCard.content, boardId: board.id });

        expect(res.status).toBe(201);
        expect(res.body.data.order).toBe(3);
      });
    });

    describe('rainyDay', () => {
      it('board üyesi değil — 4xx veya 500 dönmeli', async () => {
        const { user, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.column.findFirstOrThrow.mockRejectedValue(new Error('Not authorized'));

        const res = await request(app)
          .post('/api/v1/columns/col-id/cards')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'Test Card', content: 'Test Content', boardId: 'baska-board' });

        expect(res.status).toBe(403);
      });

      it('token olmadan — 401 dönmeli', async () => {
        const res = await request(app)
          .post('/api/v1/columns/col-id/cards')
          .send({ title: 'Test', content: 'Test Content', boardId: 'board-id' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });
  });

  // PATCH /api/v1/columns/:columnId/cards/:cardId

  describe('PATCH /api/v1/columns/:columnId/cards/:cardId', () => {
    describe('sunnyDay', () => {
      it('erişim yetkisi olan kullanıcı card günceller — 200, güncel card dönmeli', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const column = fixtures.column.build({ boardId: board.id });
        const card: Card = buildCard({ columnId: column.id });
        const updatedCard: Card = { ...card, title: 'Güncel Başlık' };

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.card.findFirstOrThrow.mockResolvedValue(card);
        prismaMock.card.update.mockResolvedValue(updatedCard);

        const res = await request(app)
          .patch(`/api/v1/columns/${column.id}/cards/${card.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'Güncel Başlık', content: 'Güncel Content', boardId: board.id });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({ title: 'Güncel Başlık' });
      });
    });

    describe('rainyDay', () => {
      it('card bulunamadı veya erişim yok — 404 dönmeli', async () => {
        const { user, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.card.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

        const res = await request(app)
          .patch('/api/v1/columns/col-id/cards/nonexistent-card-id')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'Yeni Başlık', content: 'Test Content', boardId: 'board-id' });

        expect(res.status).toBe(404);
      });

      it('token olmadan — 401 dönmeli', async () => {
        const res = await request(app)
          .patch('/api/v1/columns/col-id/cards/card-id')
          .send({ title: 'Test', content: 'Test Content', boardId: 'board-id' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });
  });

  // DELETE /api/v1/columns/:columnId/cards/:cardId

  describe('DELETE /api/v1/columns/:columnId/cards/:cardId', () => {
    describe('sunnyDay', () => {
      it('erişim yetkisi olan kullanıcı card siler — 200 dönmeli', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const column = fixtures.column.build({ boardId: board.id });
        const card: Card = buildCard({ columnId: column.id });

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.card.findFirstOrThrow.mockResolvedValue(card);
        prismaMock.card.delete.mockResolvedValue(card);

        const res = await request(app)
          .delete(`/api/v1/columns/${column.id}/cards/${card.id}?boardId=${board.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('rainyDay', () => {
      it('card bulunamadı veya erişim yok — 4xx veya 500 dönmeli', async () => {
        const { user, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.card.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

        const res = await request(app)
          .delete('/api/v1/columns/col-id/cards/nonexistent-card?boardId=board-id')
          .set('Authorization', `Bearer ${accessToken}`);

        expect([403, 404, 500]).toContain(res.status);
      });

      it('token olmadan — 401 dönmeli', async () => {
        const res = await request(app).delete('/api/v1/columns/col-id/cards/card-id?boardId=board-id');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });
  });

  // PATCH /api/v1/columns/:columnId/cards/:cardId/move

  describe('PATCH /api/v1/columns/:fromColumnId/cards/:cardId/move', () => {
    describe('sunnyDay', () => {
      it('aynı column içinde card taşınır — 200 dönmeli', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const column = fixtures.column.build({ boardId: board.id });
        const card: Card = buildCard({ columnId: column.id, order: 0 });
        const movedCard: Card = { ...card, order: 2 };

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.card.findFirstOrThrow.mockResolvedValue(card);
        prismaMock.$transaction.mockResolvedValue(movedCard as never);

        const url = `/api/v1/columns/${column.id}/cards/${card.id}/move`;

        const res = await request(app)
          .patch(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ newOrder: 2, toColumnId: column.id, boardId: board.id });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it("farklı column'a card taşınır — 200 dönmeli", async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const fromColumn = fixtures.column.build({ boardId: board.id, order: 0 });
        const toColumn = fixtures.column.build({ boardId: board.id, order: 1 });
        const card: Card = buildCard({ columnId: fromColumn.id, order: 1 });
        const movedCard: Card = { ...card, columnId: toColumn.id, order: 0 };

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.card.findFirstOrThrow.mockResolvedValue(card);
        prismaMock.column.findFirstOrThrow.mockResolvedValue(toColumn);
        prismaMock.$transaction.mockResolvedValue(movedCard as never);

        const url = `/api/v1/columns/${fromColumn.id}/cards/${card.id}/move`;

        const res = await request(app)
          .patch(url)
          .set('Authorization', `Bearer ${accessToken}`)

          .send({ newOrder: 0, toColumnId: toColumn.id, boardId: board.id });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('aynı pozisyona taşınırsa erken dönülür — 200 dönmeli', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const column = fixtures.column.build({ boardId: board.id });
        const card: Card = buildCard({ columnId: column.id, order: 1 });

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.card.findFirstOrThrow.mockResolvedValue(card);

        const url = `/api/v1/columns/${column.id}/cards/${card.id}/move`;

        const res = await request(app)
          .patch(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ newOrder: 1, toColumnId: column.id, boardId: board.id });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
      });
    });

    describe('rainyDay', () => {
      it('card bulunamadı veya erişim yok — 4xx veya 500 dönmeli', async () => {
        const { user, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.card.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

        const res = await request(app)
          .patch('/api/v1/columns/col-id/cards/nonexistent/move')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ newOrder: 0, toColumnId: 'dest-col', boardId: 'board-id' });

        expect([400, 401, 403, 404, 500]).toContain(res.status);
      });

      it('hedef column boardda yok — 4xx veya 500 dönmeli', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const fromColumn = fixtures.column.build({ boardId: board.id });
        const card: Card = buildCard({ columnId: fromColumn.id, order: 0 });

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.card.findFirstOrThrow.mockResolvedValue(card);
        prismaMock.column.findFirstOrThrow.mockRejectedValue(new Error('Column not found'));

        const res = await request(app)
          .patch(`/api/v1/columns/${fromColumn.id}/cards/${card.id}/move`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ newOrder: 0, toColumnId: 'gecersiz-col-id', boardId: board.id });

        expect([400, 401, 403, 404, 500]).toContain(res.status);
      });

      it('token olmadan — 401 dönmeli', async () => {
        const res = await request(app)
          .patch('/api/v1/columns/col-id/cards/card-id/move')
          .send({ newOrder: 0, toColumnId: 'dest-col-id', boardId: 'board-id' });

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
