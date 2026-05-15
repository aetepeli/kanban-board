import { type Column, type Board, type User, PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

jest.mock('config/db', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('utils/activityHandler', () => ({
  __esModule: true,
  activityLogger: { logUser: jest.fn(), logCombined: jest.fn() },
}));

jest.mock('utils/redisUtils', () => ({
  __esModule: true,
  default: { quit: jest.fn() },
}));

import columnServices from 'services/column/column.service';
import { activityLogger } from 'utils/activityHandler';
import { prisma } from 'config/db';
import redisClient from 'utils/redisUtils';
import fixtures from '../helpers/fixtures';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// ─────────────────────────────────────────────────────────────────────────────

describe('ColumnService', () => {
  const setupData = () => {
    const user = fixtures.user.build() as User;
    const board = { id: 'board-123', title: 'Test Board', ownerId: user.id } as Board;
    const column = { id: 'col-1', title: 'To Do', boardId: board.id, order: 0 } as Column;

    prismaMock.board.findFirstOrThrow.mockResolvedValue(board);
    prismaMock.column.findFirstOrThrow.mockResolvedValue(column);
    prismaMock.column.findFirst.mockResolvedValue(column);
    prismaMock.column.create.mockResolvedValue(column);
    prismaMock.column.update.mockResolvedValue(column);
    prismaMock.column.delete.mockResolvedValue(column);

    (activityLogger.logCombined as jest.Mock).mockResolvedValue(undefined);

    return { user, board, column };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  // createColumn

  describe('createColumn', () => {
    let user: User;
    let board: Board;
    let column: Column;

    beforeEach(() => {
      ({ user, board, column } = setupData());
    });

    it('sunnyDay: should find the last column and create a new one by incrementing the order by 1', async () => {
      prismaMock.column.findFirst.mockResolvedValue({ ...column, order: 2 } as Column);

      const result = await columnServices.createColumn({ title: 'New Column', boardId: board.id, userId: user.id });

      expect(result.id).toBe(column.id);
      expect(prismaMock.board.findFirstOrThrow).toHaveBeenCalledWith({ where: { id: board.id, ownerId: user.id } });
      expect(prismaMock.column.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { title: 'New Column', boardId: board.id, order: 3 } })
      );
    });

    it('sunnyDay: should set order to 0 if it is the first column being created', async () => {
      prismaMock.column.findFirst.mockResolvedValue(null);

      await columnServices.createColumn({ title: 'First Column', boardId: board.id, userId: user.id });

      expect(prismaMock.column.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ order: 0 }) })
      );
    });

    describe('rainyDay', () => {
      it('should throw error and not perform operation if board is not found or user lacks permission', async () => {
        prismaMock.board.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(3);

        try {
          await columnServices.createColumn({ title: 'New Column', boardId: board.id, userId: 'hacker-user' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.column.create).not.toHaveBeenCalled();
        }
      });
    });
  });

  // updateColumn

  describe('updateColumn', () => {
    let user: User;
    let board: Board;
    let column: Column;

    beforeEach(() => {
      ({ user, board, column } = setupData());
    });

    it('sunnyDay: should successfully update the column title', async () => {
      const result = await columnServices.updateColumn({
        columnId: column.id,
        boardId: board.id,
        userId: user.id,
        title: 'Updated Title',
      });

      expect(result.id).toBe(column.id);
      expect(prismaMock.column.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: column.id }, data: { title: 'Updated Title' } })
      );
    });

    describe('rainyDay', () => {
      it('should throw error and not update if column is not found or access is denied', async () => {
        prismaMock.column.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(3);

        try {
          await columnServices.updateColumn({
            columnId: column.id,
            boardId: board.id,
            userId: 'hacker',
            title: 'Hacked',
          });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.column.update).not.toHaveBeenCalled();
        }
      });
    });
  });

  // deleteColumn

  describe('deleteColumn', () => {
    let user: User;
    let column: Column;

    beforeEach(() => {
      ({ user, column } = setupData());
    });

    describe('sunnyDay', () => {
      it('should delete column from DB when authorized user performs the action', async () => {
        const result = await columnServices.deleteColumn({ columnId: column.id, userId: user.id });

        expect(result.message).toBe('Column deleted successfully');
        expect(prismaMock.column.delete).toHaveBeenCalledWith({ where: { id: column.id } });
      });
    });

    describe('rainyDay', () => {
      it('should throw error during second permission check if user is not the board owner', async () => {
        prismaMock.column.findFirstOrThrow
          .mockResolvedValueOnce(column as never)
          .mockRejectedValueOnce(new Error('Unauthorized'));

        expect.assertions(3);

        try {
          await columnServices.deleteColumn({ columnId: column.id, userId: 'hacker-user' });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Unauthorized');
        } finally {
          expect(prismaMock.column.delete).not.toHaveBeenCalled();
        }
      });
    });
  });
});
