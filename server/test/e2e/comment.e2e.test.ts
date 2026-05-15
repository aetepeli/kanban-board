import { PrismaClient, Comment } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import request from 'supertest';

// ── MOCKs ─────────────────────────────────

jest.mock('config/db', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('utils/activityHandler', () => ({
  __esModule: true,
  activityLogger: {
    logCombined: jest.fn(),
  },
}));

// ─────────────────────────────────────────

import { prisma } from 'config/db';
import { createTestApp } from '../../test/helpers/testApp';
import { createTestUser } from '../../test/helpers/testAuth';
import fixtures from '../helpers/fixtures';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const app = createTestApp();

// helper
const buildComment = (override: Partial<Comment> = {}): Comment => ({
  id: `comment-${Math.random().toString(36).slice(2)}`,
  content: 'Test comment',
  cardId: 'card-1',
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...override,
});

describe('Comment Routes — Mock DB', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    app.set('io', {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    });
  });

  // POST /cards/:cardId/comments

  describe('POST /api/v1/cards/:cardId/comments', () => {
    describe('sunnyDay', () => {
      it('yorum oluşturur — 201', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const card = fixtures.card.build();
        const comment = buildComment({ cardId: card.id, userId: user.id });

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.card.findFirstOrThrow.mockResolvedValue(card);
        prismaMock.comment.create.mockResolvedValue(comment);

        const res = await request(app)
          .post(`/api/v1/cards/${card.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: comment.content, boardId: board.id });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.content).toBe(comment.content);
      });
    });

    describe('rainyDay', () => {
      it('card yok / erişim yok — hata dönmeli', async () => {
        const { user, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.card.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

        const res = await request(app)
          .post(`/api/v1/cards/card-id/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 'test', boardId: 'board-id' });

        expect(res.status).toBe(404);
      });

      it('token yok — 401', async () => {
        const res = await request(app)
          .post(`/api/v1/cards/card-id/comments`)
          .send({ content: 'test', boardId: 'board-id' });

        expect(res.status).toBe(401);
      });
    });
  });

  // PATCH /comments/:commentId

  describe('PATCH /api/v1/cards/:cardId/comments/:commentId', () => {
    describe('sunnyDay', () => {
      it('yorum güncellenir — 200', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const card = fixtures.card.build();
        const comment = buildComment({ cardId: card.id, userId: user.id });

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.comment.findFirstOrThrow.mockResolvedValue(comment);
        prismaMock.comment.update.mockResolvedValue({
          ...comment,
          content: 'updated',
        });

        const res = await request(app)
          .patch(`/api/v1/cards/${card.id}/comments/${comment.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            content: 'updated',
            cardId: card.id,
            boardId: board.id,
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('rainyDay', () => {
      it('yorum bulunamadı — hata', async () => {
        const { user, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.comment.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

        const res = await request(app)
          .patch(`/api/v1/cards/card-id/comments/comment-id`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            content: 'updated',
            cardId: 'card-id',
            boardId: 'board-id',
          });

        expect(res.status).toBe(404);
      });
    });
  });

  // DELETE /comments/:commentId

  describe('DELETE /api/v1/cards/:cardId/comments/:commentId', () => {
    describe('sunnyDay', () => {
      it('yorum silinir — 200', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const card = fixtures.card.build();
        const comment = buildComment({ cardId: card.id, userId: user.id });

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.comment.findFirstOrThrow.mockResolvedValue(comment);
        prismaMock.comment.delete.mockResolvedValue(comment);

        const res = await request(app)
          .delete(`/api/v1/cards/${card.id}/comments/${comment.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .query({
            cardId: card.id,
            boardId: board.id,
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('rainyDay', () => {
      it('yorum bulunamadı — hata', async () => {
        const { user, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.comment.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

        const res = await request(app)
          .delete(`/api/v1/cards/card-id/comments/comment-id`)
          .set('Authorization', `Bearer ${accessToken}`)
          .query({
            cardId: 'card-id',
            boardId: 'board-id',
          });

        expect(res.status).toBe(404);
      });

      it('token yok — 401', async () => {
        const res = await request(app).delete(`/api/v1/cards/card-id/comments/comment-id`).query({
          cardId: 'card-id',
          boardId: 'board-id',
        });

        expect(res.status).toBe(401);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();

    jest.clearAllTimers();
  });
});
