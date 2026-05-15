import { type Board, type User, type BoardMember, type BoardActivityLog, PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

jest.mock('config/db', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('utils/activityHandler', () => ({
  __esModule: true,
  activityLogger: { logUser: jest.fn(), logCombined: jest.fn() },
}));

// Redis'i asılı bırakmamak için mockluyoruz
jest.mock('utils/redisUtils', () => ({
  __esModule: true,
  default: { get: jest.fn(), set: jest.fn(), del: jest.fn(), ttl: jest.fn(), quit: jest.fn() },
}));

import boardServices from 'services/board/board.service';
import APIError from 'utils/apiErrors';
import { activityLogger } from 'utils/activityHandler';
import redisClient from 'utils/redisUtils';
import { prisma } from 'config/db';

import fixtures from '../helpers/fixtures';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// ─────────────────────────────────────────────────────────────────────────────

describe('BoardService', () => {
  const setupData = () => {
    const user = fixtures.user.build();
    const board = {
      id: 'board-123',
      title: 'Test Board',
      ownerId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Board;

    prismaMock.board.findFirstOrThrow.mockResolvedValue(board);
    prismaMock.board.findFirst.mockResolvedValue(board);
    prismaMock.board.create.mockResolvedValue(board);
    prismaMock.user.findFirstOrThrow.mockResolvedValue(user as User);

    (activityLogger.logCombined as jest.Mock).mockResolvedValue(undefined);

    return { user, board };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  // createBoard

  describe('createBoard', () => {
    let user: User;
    let board: Board;

    beforeEach(() => {
      ({ user, board } = setupData());
    });

    it('sunnyDay: should create a new board, add default columns and log activity', async () => {
      const result = await boardServices.createBoard({ title: 'My Kanban', userId: user.id });

      expect(result.id).toBe(board.id);
      expect(prismaMock.board.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            title: 'My Kanban',
            ownerId: user.id,
            columns: {
              create: [
                { title: 'To Do', order: 0 },
                { title: 'In Progress', order: 1 },
                { title: 'Done', order: 2 },
              ],
            },
          },
        })
      );
      expect(activityLogger.logCombined).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BOARD_CREATED', boardId: board.id, userId: user.id })
      );
    });
  });

  // getUserBoards

  describe('getUserBoards', () => {
    let user: User;

    beforeEach(() => {
      ({ user } = setupData());
      prismaMock.board.findMany.mockResolvedValue([
        { id: 'b1', title: 'Board 1', ownerId: user.id, createdAt: new Date() },
        { id: 'b2', title: 'Board 2', ownerId: 'other-user', createdAt: new Date() },
      ] as Board[]);
    });

    it('sunnyDay: should fetch boards where user is either an owner or a member', async () => {
      const result = await boardServices.getUserBoards(user.id);

      expect(result).toHaveLength(2);
      expect(prismaMock.board.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  // deleteBoard

  describe('deleteBoard', () => {
    let user: User;
    let board: Board;

    beforeEach(() => {
      ({ user, board } = setupData());
    });

    describe('sunnyDay', () => {
      it('should delete the board and log activity if the requester is the owner', async () => {
        const result = await boardServices.deleteBoard({ boardId: board.id, userId: user.id });

        expect(result.message).toBe('Board deleted successfully');
        expect(prismaMock.board.findFirstOrThrow).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: board.id, ownerId: user.id } })
        );
        expect(prismaMock.board.delete).toHaveBeenCalledWith({ where: { id: board.id } });
        expect(activityLogger.logCombined).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'BOARD_DELETED', boardId: board.id })
        );
      });
    });

    describe('rainyDay', () => {
      it('should throw error and not perform DB operation if board is not found or user lacks permission', async () => {
        prismaMock.board.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(4);

        try {
          await boardServices.deleteBoard({ boardId: board.id, userId: 'hacker-user' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.board.delete).not.toHaveBeenCalled();
          expect(activityLogger.logCombined).not.toHaveBeenCalled();
        }
      });
    });
  });

  // getBoardById

  describe('getBoardById', () => {
    let user: User;
    let board: Board;

    beforeEach(() => {
      ({ user, board } = setupData());
    });

    describe('sunnyDay', () => {
      it('should fetch board details with relations if user has access permission', async () => {
        const result = await boardServices.getBoardById({ boardId: board.id, userId: user.id });

        expect(result.id).toBe(board.id);
        expect(prismaMock.board.findFirstOrThrow).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: board.id, OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
            include: expect.objectContaining({
              owner: expect.any(Object),
              members: expect.any(Object),
              columns: expect.any(Object),
            }),
          })
        );
      });
    });

    describe('rainyDay', () => {
      it('should throw error if user does not have access permission', async () => {
        prismaMock.board.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(2);

        try {
          await boardServices.getBoardById({ boardId: board.id, userId: 'unauthorized-user' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        }
      });
    });
  });

  // addMember

  describe('addMember', () => {
    let user: User;
    let board: Board;

    beforeEach(() => {
      ({ user, board } = setupData());

      const mockNewMember = {
        boardId: board.id,
        userId: 'invited-user-id',
        role: 'MEMBER',
        user: { id: 'invited-user-id', fullName: 'Invited User', email: 'test@mail.com' },
      } as unknown as BoardMember & { user: Pick<User, 'id' | 'fullName' | 'email'> };

      prismaMock.boardMember.create.mockResolvedValue(mockNewMember);
    });

    describe('sunnyDay', () => {
      it('should create a member and log activity when owner adds a valid email', async () => {
        const result = await boardServices.addMember({ boardId: board.id, inviterId: user.id, email: 'test@mail.com' });

        expect(result.boardId).toBe(board.id);
        expect(prismaMock.boardMember.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: { boardId: board.id, userId: user.id } })
        );
        expect(activityLogger.logCombined).toHaveBeenCalledWith(expect.objectContaining({ action: 'ADDED_MEMBER' }));
      });
    });

    describe('rainyDay', () => {
      it('should throw error and not add member if inviter is not the board owner', async () => {
        prismaMock.board.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(4);

        try {
          await boardServices.addMember({ boardId: board.id, inviterId: 'yetkisiz-kisi', email: 'test@mail.com' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.boardMember.create).not.toHaveBeenCalled();
          expect(activityLogger.logCombined).not.toHaveBeenCalled();
        }
      });

      it('should throw error and not add member if the email to be added does not exist', async () => {
        prismaMock.user.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(4);

        try {
          await boardServices.addMember({ boardId: board.id, inviterId: user.id, email: 'yok@mail.com' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.boardMember.create).not.toHaveBeenCalled();
          expect(activityLogger.logCombined).not.toHaveBeenCalled();
        }
      });
    });
  });

  // removeMember

  describe('removeMember', () => {
    let user: User;
    let board: Board;

    beforeEach(() => {
      ({ user, board } = setupData());
    });

    describe('sunnyDay', () => {
      it('should remove member from DB and log activity when owner removes a member', async () => {
        const result = await boardServices.removeMember({
          boardId: board.id,
          requesterId: user.id,
          memberIdToRemove: 'other-user',
        });

        expect(result.message).toBe('Member removed successfully');
        expect(prismaMock.boardMember.delete).toHaveBeenCalledWith({
          where: { userId_boardId: { userId: 'other-user', boardId: board.id } },
        });
        expect(activityLogger.logCombined).toHaveBeenCalledWith(expect.objectContaining({ action: 'REMOVE_MEMBER' }));
      });
    });

    describe('rainyDay', () => {
      it('should throw APIError and not perform operation if a user tries to remove themselves', async () => {
        expect.assertions(5);

        try {
          await boardServices.removeMember({ boardId: board.id, requesterId: user.id, memberIdToRemove: user.id });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(APIError);
          if (error instanceof APIError) {
            expect(error.statusCode).toBe(400);
            expect(error.message).toContain('cannot remove yourself');
          }
        } finally {
          expect(prismaMock.boardMember.delete).not.toHaveBeenCalled();
          expect(activityLogger.logCombined).not.toHaveBeenCalled();
        }
      });

      it('should throw error if the requester is not the board owner', async () => {
        prismaMock.board.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(4);

        try {
          await boardServices.removeMember({ boardId: board.id, requesterId: 'yetkisiz', memberIdToRemove: 'user-2' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.boardMember.delete).not.toHaveBeenCalled();
          expect(activityLogger.logCombined).not.toHaveBeenCalled();
        }
      });
    });
  });

  // checkUserAccess

  describe('checkUserAccess', () => {
    let user: User;
    let board: Board;

    beforeEach(() => {
      ({ user, board } = setupData());
    });

    it('sunnyDay: should return TRUE if user has access permission', async () => {
      prismaMock.board.findFirst.mockResolvedValue({ id: board.id } as Board);

      const result = await boardServices.checkUserAccess({ boardId: board.id, userId: user.id });

      expect(result).toBe(true);
      expect(prismaMock.board.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: board.id, OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
        })
      );
    });

    it('sunnyDay: should return FALSE if user does not have access permission', async () => {
      prismaMock.board.findFirst.mockResolvedValue(null);

      const result = await boardServices.checkUserAccess({ boardId: board.id, userId: 'random-user' });

      expect(result).toBe(false);
    });
  });

  // getBoardActivityLog

  describe('getBoardActivityLog', () => {
    let user: User;
    let board: Board;

    beforeEach(() => {
      ({ user, board } = setupData());
      prismaMock.boardActivityLog.findMany.mockResolvedValue([{ id: 'log1', boardId: board.id } as BoardActivityLog]);
    });

    describe('sunnyDay', () => {
      it('should allow authorized user to fetch board logs', async () => {
        const result = await boardServices.getBoardActivityLog({ boardId: board.id, userId: user.id });

        expect(result).toHaveLength(1);
        expect(prismaMock.boardActivityLog.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { boardId: board.id }, take: 50, orderBy: { createdAt: 'desc' } })
        );
      });
    });

    describe('rainyDay', () => {
      it('should throw error and not exhaust DB if user does not have board access', async () => {
        prismaMock.board.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(3);

        try {
          await boardServices.getBoardActivityLog({ boardId: board.id, userId: 'unauthorized-user' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.boardActivityLog.findMany).not.toHaveBeenCalled();
        }
      });
    });
  });
});
