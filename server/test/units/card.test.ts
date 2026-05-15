import { type Card, type Column, type Board, type User, PrismaClient } from '@prisma/client';
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

import cardServices from 'services/card/card.service';
import { activityLogger } from 'utils/activityHandler';
import { prisma } from 'config/db';
import redisClient from 'utils/redisUtils';
import fixtures from '../helpers/fixtures';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// ─────────────────────────────────────────────────────────────────────────────

describe('CardService', () => {
  const setupData = () => {
    const user = fixtures.user.build() as User;
    const board = {
      id: 'board-123',
      title: 'Test Board',
      ownerId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Board;
    const column = {
      id: 'col-1',
      title: 'To Do',
      boardId: board.id,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Column;
    const card = {
      id: 'card-1',
      title: 'Test Card',
      content: 'Content',
      order: 0,
      columnId: column.id,
      priority: 'MEDIUM',
      assigneeId: null,
      deadline: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Card;

    prismaMock.column.findFirstOrThrow.mockResolvedValue(column);
    prismaMock.card.findFirst.mockResolvedValue(null);
    prismaMock.card.findFirstOrThrow.mockResolvedValue(card);
    prismaMock.card.create.mockResolvedValue(card);
    prismaMock.card.update.mockResolvedValue(card);
    prismaMock.card.delete.mockResolvedValue(card);

    (activityLogger.logCombined as jest.Mock).mockResolvedValue(undefined);

    return { user, board, column, card };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  // createCard

  describe('createCard', () => {
    let user: User;
    let board: Board;
    let column: Column;
    let card: Card;
    const testDeadline = new Date('2026-12-31');

    beforeEach(() => {
      ({ user, board, column, card } = setupData());
    });

    describe('sunnyDay', () => {
      it('should create a card with order 0 if the column is empty and log activity', async () => {
        prismaMock.card.findFirst.mockResolvedValue(null);

        const result = await cardServices.createCard({
          title: 'New Card',
          content: 'Desc',
          boardId: board.id,
          columnId: column.id,
          userId: user.id,
          deadline: testDeadline,
        });

        expect(result.id).toBe(card.id);
        expect(prismaMock.card.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ title: 'New Card', order: 0 }) })
        );
        expect(activityLogger.logCombined).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'CARD_CREATED', boardId: board.id, userId: user.id })
        );
        expect(prismaMock.card.create).toHaveBeenCalledTimes(1);
      });

      it('should increment the order by +1 if there are existing cards in the column', async () => {
        prismaMock.card.findFirst.mockResolvedValue({ ...card, order: 4 } as Card);

        await cardServices.createCard({
          title: 'Fifth Card',
          content: '',
          boardId: board.id,
          columnId: column.id,
          userId: user.id,
          deadline: testDeadline,
        });

        expect(prismaMock.card.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ order: 5 }) })
        );
      });

      it('should convert the deadline to a Date object if provided', async () => {
        const deadline = new Date('2025-12-31');

        await cardServices.createCard({
          title: 'Deadline Card',
          content: '',
          boardId: board.id,
          columnId: column.id,
          userId: user.id,
          deadline,
        });

        expect(prismaMock.card.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ deadline }) })
        );
      });
    });

    describe('rainyDay', () => {
      it('should throw an error and not create a card if the user does not have access to the column', async () => {
        prismaMock.column.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(3);

        try {
          await cardServices.createCard({
            title: 'Hack Card',
            content: '',
            boardId: board.id,
            columnId: column.id,
            userId: 'hacker',
            deadline: testDeadline,
          });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.card.create).not.toHaveBeenCalled();
        }
      });
    });
  });

  // updateCard

  describe('updateCard', () => {
    let user: User;
    let board: Board;
    let column: Column;
    let card: Card;

    beforeEach(() => {
      ({ user, board, column, card } = setupData());
    });

    describe('sunnyDay', () => {
      it('should only update the title and log activity when the title is changed', async () => {
        const result = await cardServices.updateCard({
          cardId: card.id,
          columnId: column.id,
          boardId: board.id,
          userId: user.id,
          title: 'Updated Title',
        });

        expect(result.id).toBe(card.id);
        expect(prismaMock.card.update).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: card.id }, data: { title: 'Updated Title' } })
        );
        expect(activityLogger.logCombined).toHaveBeenCalledWith(expect.objectContaining({ action: 'CARD_UPDATED' }));
      });

      it('should convert the deadline to a Date object when updated', async () => {
        const deadline = new Date('2026-06-01');

        await cardServices.updateCard({
          cardId: card.id,
          columnId: column.id,
          boardId: board.id,
          userId: user.id,
          deadline,
        });

        expect(prismaMock.card.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ deadline }) })
        );
      });

      it('should not include undefined fields in the update data', async () => {
        await cardServices.updateCard({
          cardId: card.id,
          columnId: column.id,
          boardId: board.id,
          userId: user.id,
          title: 'Only Title',
        });

        const callData = (prismaMock.card.update as jest.Mock).mock.calls[0][0].data;
        expect(callData).not.toHaveProperty('content');
        expect(callData).not.toHaveProperty('priority');
        expect(callData).not.toHaveProperty('assigneeId');
      });
    });

    describe('rainyDay', () => {
      it('should throw an error and not update if the card is not found or access is denied', async () => {
        prismaMock.card.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(3);

        try {
          await cardServices.updateCard({
            cardId: card.id,
            columnId: column.id,
            boardId: board.id,
            userId: 'yetkisiz',
            title: 'Hack',
          });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.card.update).not.toHaveBeenCalled();
        }
      });
    });
  });

  // deleteCard

  describe('deleteCard', () => {
    let user: User;
    let board: Board;
    let column: Column;
    let card: Card;

    beforeEach(() => {
      ({ user, board, column, card } = setupData());
    });

    describe('sunnyDay', () => {
      it('should delete the card, return a message, and log activity', async () => {
        const result = await cardServices.deleteCard({
          cardId: card.id,
          columnId: column.id,
          boardId: board.id,
          userId: user.id,
        });

        expect(result.message).toBe('card deleted successfully');
        expect(prismaMock.card.delete).toHaveBeenCalledWith({ where: { id: card.id } });
        expect(activityLogger.logCombined).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'CARD_DELETED', boardId: board.id })
        );
        expect(prismaMock.card.delete).toHaveBeenCalledTimes(1);
      });
    });

    describe('rainyDay', () => {
      it('should throw an error and not delete if the card is not found or access is denied', async () => {
        prismaMock.card.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(4);

        try {
          await cardServices.deleteCard({
            cardId: card.id,
            columnId: column.id,
            boardId: board.id,
            userId: 'yetkisiz',
          });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.card.delete).not.toHaveBeenCalled();
          expect(activityLogger.logCombined).not.toHaveBeenCalled();
        }
      });
    });
  });

  // moveCard

  describe('moveCard', () => {
    let user: User;
    let board: Board;
    let column: Column;
    let card: Card;

    beforeEach(() => {
      ({ user, board, column, card } = setupData());

      prismaMock.$transaction.mockImplementation((async (cb: (tx: PrismaClient) => unknown) => {
        return cb(prismaMock as unknown as PrismaClient);
      }) as never);

      prismaMock.card.updateMany.mockResolvedValue({ count: 1 });
    });

    describe('sunnyDay', () => {
      it('moving up within the same column — should increment the order of intermediate cards', async () => {
        const movingCard = { ...card, order: 3 } as Card;
        prismaMock.card.findFirstOrThrow.mockResolvedValue(movingCard);

        await cardServices.moveCard({
          cardId: card.id,
          boardId: board.id,
          fromColumnId: column.id,
          toColumnId: column.id,
          newOrder: 1,
          userId: user.id,
        });

        expect(prismaMock.card.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({ data: { order: { increment: 1 } } })
        );
        expect(prismaMock.card.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ order: 1, columnId: column.id }) })
        );
        expect(activityLogger.logCombined).toHaveBeenCalledWith(expect.objectContaining({ action: 'CARD_MOVED' }));
      });

      it('moving down within the same column — should decrement the order of intermediate cards', async () => {
        const movingCard = { ...card, order: 1 } as Card;
        prismaMock.card.findFirstOrThrow.mockResolvedValue(movingCard);

        await cardServices.moveCard({
          cardId: card.id,
          boardId: board.id,
          fromColumnId: column.id,
          toColumnId: column.id,
          newOrder: 3,
          userId: user.id,
        });

        expect(prismaMock.card.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({ data: { order: { decrement: 1 } } })
        );
      });

      it('moving to a different column — should close the gap in the old column, open space in the new column and log activity', async () => {
        const toColumn = { ...column, id: 'col-2' } as Column;
        prismaMock.column.findFirstOrThrow.mockResolvedValue(toColumn);

        await cardServices.moveCard({
          cardId: card.id,
          boardId: board.id,
          fromColumnId: column.id,
          toColumnId: toColumn.id,
          newOrder: 0,
          userId: user.id,
        });

        expect(prismaMock.card.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ columnId: column.id }),
            data: { order: { decrement: 1 } },
          })
        );
        expect(prismaMock.card.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ columnId: toColumn.id }),
            data: { order: { increment: 1 } },
          })
        );
        expect(prismaMock.card.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ columnId: toColumn.id, order: 0 }) })
        );
        expect(activityLogger.logCombined).toHaveBeenCalledWith(expect.objectContaining({ action: 'CARD_MOVED' }));
      });

      it('same column and same position — should not perform DB operations and return the original card', async () => {
        const stationaryCard = { ...card, order: 2 } as Card;
        prismaMock.card.findFirstOrThrow.mockResolvedValue(stationaryCard);

        const result = await cardServices.moveCard({
          cardId: card.id,
          boardId: board.id,
          fromColumnId: column.id,
          toColumnId: column.id,
          newOrder: 2,
          userId: user.id,
        });

        expect(result.id).toBe(card.id);
        expect(prismaMock.card.updateMany).not.toHaveBeenCalled();
        expect(prismaMock.card.update).not.toHaveBeenCalled();
        expect(activityLogger.logCombined).not.toHaveBeenCalled();
      });
    });

    describe('rainyDay', () => {
      it('should throw an error and not perform operation if card is not found or access is denied', async () => {
        prismaMock.card.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(4);

        try {
          await cardServices.moveCard({
            cardId: card.id,
            boardId: board.id,
            fromColumnId: column.id,
            toColumnId: column.id,
            newOrder: 1,
            userId: 'yetkisiz',
          });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.card.updateMany).not.toHaveBeenCalled();
          expect(prismaMock.card.update).not.toHaveBeenCalled();
        }
      });

      it('should throw an error and not start transaction if target column is not found during cross-column move', async () => {
        prismaMock.column.findFirstOrThrow.mockRejectedValue(new Error('Target column not found'));
        expect.assertions(4);

        try {
          await cardServices.moveCard({
            cardId: card.id,
            boardId: board.id,
            fromColumnId: column.id,
            toColumnId: 'olmayan-kolon',
            newOrder: 0,
            userId: user.id,
          });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Target column not found');
        } finally {
          expect(prismaMock.card.updateMany).not.toHaveBeenCalled();
          expect(prismaMock.card.update).not.toHaveBeenCalled();
        }
      });
    });
  });
});
