import { type User, type Board, type Column, PrismaClient } from '@prisma/client';
import { Role } from '../helpers/fixtures';
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

type BoardWithColumns = Board & { columns: Column[] };

type UserPublic = Pick<User, 'id' | 'fullName' | 'email'>;

type BoardMemberRecord = {
  id: string;
  userId: string;
  boardId: string;
  role: Role;
  joinedAt: Date;
  user: UserPublic;
};

type BoardMemberWithUser = Pick<BoardMemberRecord, 'role'> & {
  user: UserPublic;
};

type CardInColumn = {
  id: string;
  title: string;
  content: string | null;
  columnId: string;
  boardId: string;
  order: number;
  priority: string;
  deadline: Date | null;
  assigneeId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ColumnWithCards = Column & { card: CardInColumn[] };

type BoardWithDetails = Board & {
  owner: UserPublic;
  members: BoardMemberWithUser[];
  columns: ColumnWithCards[];
};

type BoardActivityLogRecord = {
  id: string;
  boardId: string;
  userId: string;
  action: string;
  details: string;
  createdAt: Date;
  user: UserPublic;
};

// ─────────────────────────────────────────────────────────────────────────────

describe('Board Routes — Mock DB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // POST /boards

  describe('POST /api/v1/boards', () => {
    describe('sunnyDay', () => {
      it('geçerli token ile board oluşturulur — 201, board ve 3 default column dönmeli', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.withColumns({ ownerId: user.id }) as BoardWithColumns;

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.board.create.mockResolvedValue(board);

        const res = await request(app)
          .post('/api/v1/boards')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: board.title });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({ title: board.title });

        expect(res.body.data.columns).toHaveLength(3);
      });
    });

    describe('rainyDay', () => {
      it('token olmadan — 401 dönmeli', async () => {
        const res = await request(app).post('/api/v1/boards').send({ title: 'Test' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });
  });

  // GET /boards

  describe('GET /api/v1/boards', () => {
    describe('sunnyDay', () => {
      it('geçerli token ile kullanıcıya ait board listesi döner — 200', async () => {
        const { user, accessToken } = createTestUser();
        const boardSummaries = fixtures.board.buildMany(3, { ownerId: user.id }).map(fixtures.board.summary);

        prismaMock.user.findUnique.mockResolvedValue(user);

        prismaMock.board.findMany.mockResolvedValue(boardSummaries as Board[]);

        const res = await request(app).get('/api/v1/boards').set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(3);
      });

      it('board yoksa — 200 ve boş dizi dönmeli', async () => {
        const { user, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.board.findMany.mockResolvedValue([]);

        const res = await request(app).get('/api/v1/boards').set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(0);
      });
    });

    describe('rainyDay', () => {
      it('token olmadan — 401 dönmeli', async () => {
        const res = await request(app).get('/api/v1/boards');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });
  });

  // GET /boards/:boardId

  describe('GET /api/v1/boards/:boardId', () => {
    describe('sunnyDay', () => {
      it('geçerli token ile board detayı döner — 200, owner ve columns içermeli', async () => {
        const { user, accessToken } = createTestUser();
        const baseBoard = fixtures.board.build({ ownerId: user.id });
        const columns = fixtures.column.defaultColumns(baseBoard.id);
        const board: BoardWithDetails = {
          ...baseBoard,
          owner: { id: user.id, fullName: user.fullName, email: user.email },
          members: [],
          columns: columns.map((col) => ({ ...col, card: [] })),
        };

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.board.findFirstOrThrow.mockResolvedValue(board as unknown as Board);

        const res = await request(app).get(`/api/v1/boards/${board.id}`).set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({ id: board.id, title: board.title });
        expect(res.body.data).toHaveProperty('owner');
        expect(res.body.data).toHaveProperty('columns');
      });
    });

    describe('rainyDay', () => {
      it('board bulunamadı veya erişim yetkisi yok — 4xx dönmeli', async () => {
        const { user, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.board.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

        const res = await request(app)
          .get('/api/v1/boards/nonexistent-id')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.body.success).toBe(false);
      });

      it('token olmadan — 401 dönmeli', async () => {
        const res = await request(app).get('/api/v1/boards/some-id');

        expect(res.status).toBe(401);
      });
    });
  });

  // DELETE /boards/:boardId

  describe('DELETE /api/v1/boards/:boardId', () => {
    describe('sunnyDay', () => {
      it('board sahibi siler — 200 dönmeli', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });

        prismaMock.user.findUnique.mockResolvedValue(user);

        prismaMock.board.findFirstOrThrow.mockResolvedValue(board);
        prismaMock.board.delete.mockResolvedValue(board);

        const res = await request(app)
          .delete(`/api/v1/boards/${board.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('rainyDay', () => {
      it('board sahibi değil — 4xx dönmeli', async () => {
        const { user, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.board.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

        const res = await request(app)
          .delete('/api/v1/boards/baska-kullanici-board')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.body.success).toBe(false);
      });

      it('token olmadan — 401 dönmeli', async () => {
        const res = await request(app).delete('/api/v1/boards/board-id');

        expect(res.status).toBe(401);
      });
    });
  });

  // POST /boards/:boardId/members

  describe('POST /api/v1/boards/:boardId/members', () => {
    describe('sunnyDay', () => {
      it('board sahibi üye ekler — 200, yeni üye bilgisi dönmeli', async () => {
        const { user: owner, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: owner.id });
        const newMember = fixtures.user.build({ email: 'member@example.com' }) as User;
        const memberRecord: BoardMemberRecord = {
          ...fixtures.boardMember.build({ boardId: board.id, userId: newMember.id }),
          user: { id: newMember.id, fullName: newMember.fullName, email: newMember.email },
        };

        prismaMock.user.findUnique.mockResolvedValue(owner);

        prismaMock.board.findFirstOrThrow.mockResolvedValue(board);
        prismaMock.user.findFirstOrThrow.mockResolvedValue(newMember);
        prismaMock.boardMember.create.mockResolvedValue(
          memberRecord as unknown as Parameters<typeof prismaMock.boardMember.create.mockResolvedValue>[0]
        );

        const res = await request(app)
          .post(`/api/v1/boards/${board.id}/members`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ email: newMember.email });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({
          userId: newMember.id,
          boardId: board.id,
        });
      });
    });

    describe('rainyDay', () => {
      it('board sahibi değil — 4xx dönmeli', async () => {
        const { user, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.board.findFirstOrThrow.mockRejectedValue(new Error('Not authorized'));

        const res = await request(app)
          .post('/api/v1/boards/baska-board/members')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ email: 'birisi@example.com' });

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.body.success).toBe(false);
      });

      it('eklenecek kullanıcı sistemde yok — 4xx dönmeli', async () => {
        const { user: owner, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: owner.id });

        prismaMock.user.findUnique.mockResolvedValue(owner);
        prismaMock.board.findFirstOrThrow.mockResolvedValue(board);
        prismaMock.user.findFirstOrThrow.mockRejectedValue(new Error('User not found'));

        const res = await request(app)
          .post(`/api/v1/boards/${board.id}/members`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ email: 'yok@example.com' });

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.body.success).toBe(false);
      });

      it('token olmadan — 401 dönmeli', async () => {
        const res = await request(app).post('/api/v1/boards/board-id/members').send({ email: 'x@x.com' });

        expect(res.status).toBe(401);
      });
    });
  });

  // DELETE /boards/:boardId/members/:memberId

  describe('DELETE /api/v1/boards/:boardId/members/:memberId', () => {
    describe('sunnyDay', () => {
      it('sahip başka bir üyeyi çıkarır — 200 dönmeli', async () => {
        const { user: owner, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: owner.id });
        const memberToRemove = fixtures.boardMember.build({ boardId: board.id });

        prismaMock.user.findUnique.mockResolvedValue(owner);
        prismaMock.board.findFirstOrThrow.mockResolvedValue(board);
        prismaMock.boardMember.delete.mockResolvedValue(
          memberToRemove as unknown as Parameters<typeof prismaMock.boardMember.delete.mockResolvedValue>[0]
        );

        const res = await request(app)
          .delete(`/api/v1/boards/${board.id}/members/${memberToRemove.userId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('rainyDay', () => {
      it('kullanıcı kendini çıkarmaya çalışır — 400 dönmeli', async () => {
        const { user: owner, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(owner);

        const res = await request(app)
          .delete(`/api/v1/boards/board-id/members/${owner.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('board sahibi değil — 4xx dönmeli', async () => {
        const { user, accessToken } = createTestUser();

        prismaMock.user.findUnique.mockResolvedValue(user);
        prismaMock.board.findFirstOrThrow.mockRejectedValue(new Error('Not authorized'));

        const res = await request(app)
          .delete('/api/v1/boards/baska-board/members/member-id')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.body.success).toBe(false);
      });

      it('token olmadan — 401 dönmeli', async () => {
        const res = await request(app).delete('/api/v1/boards/board-id/members/member-id');

        expect(res.status).toBe(401);
      });
    });
  });

  // GET /boards/:boardId/logs

  describe('GET /api/v1/boards/:boardId/logs', () => {
    describe('sunnyDay', () => {
      it('geçerli token ile board activity logları döner — 200', async () => {
        const { user, accessToken } = createTestUser();
        const board = fixtures.board.build({ ownerId: user.id });
        const logs: BoardActivityLogRecord[] = [
          {
            id: 'log-1',
            boardId: board.id,
            userId: user.id,
            action: 'BOARD_CREATED',
            details: 'Board created.',
            createdAt: new Date(),
            user: { id: user.id, fullName: user.fullName, email: user.email },
          },
          {
            id: 'log-2',
            boardId: board.id,
            userId: user.id,
            action: 'ADDED_MEMBER',
            details: 'Member added.',
            createdAt: new Date(),
            user: { id: user.id, fullName: user.fullName, email: user.email },
          },
        ];

        prismaMock.user.findUnique.mockResolvedValue(user);

        prismaMock.board.findFirstOrThrow.mockResolvedValue(board);
        prismaMock.boardActivityLog.findMany.mockResolvedValue(
          logs as unknown as Parameters<typeof prismaMock.boardActivityLog.findMany.mockResolvedValue>[0]
        );

        const res = await request(app)
          .get(`/api/v1/boards/${board.id}/logs`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(2);
      });
    });

    describe('rainyDay', () => {
      it('token olmadan — 401 dönmeli', async () => {
        const res = await request(app).get('/api/v1/boards/board-id/logs');

        expect(res.status).toBe(401);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();

    jest.clearAllTimers();
  });
});
