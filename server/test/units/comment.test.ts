import { type Comment, type Card, type Board, type User, PrismaClient } from '@prisma/client';
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

import commentServices from 'services/comment/comment.service';
import { activityLogger } from 'utils/activityHandler';
import { prisma } from 'config/db';
import redisClient from 'utils/redisUtils';
import fixtures from '../helpers/fixtures';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// ─────────────────────────────────────────────────────────────────────────────

describe('CommentService', () => {
  const setupData = () => {
    const user = fixtures.user.build() as User;
    const board = {
      id: 'board-123',
      title: 'Test Board',
      ownerId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Board;
    const card = {
      id: 'card-1',
      title: 'Test Card',
      columnId: 'col-1',
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Card;
    const comment = {
      id: 'comment-1',
      content: 'Test comment',
      cardId: card.id,
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Comment;

    prismaMock.card.findFirstOrThrow.mockResolvedValue(card);
    prismaMock.comment.findFirstOrThrow.mockResolvedValue(comment);
    prismaMock.comment.create.mockResolvedValue(comment);
    prismaMock.comment.update.mockResolvedValue(comment);
    prismaMock.comment.delete.mockResolvedValue(comment);

    (activityLogger.logCombined as jest.Mock).mockResolvedValue(undefined);

    return { user, board, card, comment };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  // createComment

  describe('createComment', () => {
    let user: User;
    let board: Board;
    let card: Card;
    let comment: Comment;

    beforeEach(() => {
      ({ user, board, card, comment } = setupData());
    });

    describe('sunnyDay', () => {
      it('should create a comment, save it with correct data, and log activity', async () => {
        const result = await commentServices.createComment({
          content: 'Test comment',
          cardId: card.id,
          userId: user.id,
          boardId: board.id,
        });

        expect(result.id).toBe(comment.id);
        expect(prismaMock.comment.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { content: 'Test comment', cardId: card.id, userId: user.id },
          })
        );
        expect(activityLogger.logCombined).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'COMMENT_CREATED', boardId: board.id, userId: user.id })
        );
        expect(prismaMock.comment.create).toHaveBeenCalledTimes(1);
      });
    });

    describe('rainyDay', () => {
      it('should throw an error and not create a comment if the user has no access to the card', async () => {
        prismaMock.card.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(4);

        try {
          await commentServices.createComment({
            content: 'Hack comment',
            cardId: card.id,
            userId: 'yetkisiz',
            boardId: board.id,
          });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.comment.create).not.toHaveBeenCalled();
          expect(activityLogger.logCombined).not.toHaveBeenCalled();
        }
      });
    });
  });

  // updateComment

  describe('updateComment', () => {
    let user: User;
    let board: Board;
    let card: Card;
    let comment: Comment;

    beforeEach(() => {
      ({ user, board, card, comment } = setupData());
    });

    describe('sunnyDay', () => {
      it('should allow the comment owner to update the comment and log activity', async () => {
        const updatedComment = { ...comment, content: 'Updated content' } as Comment;
        prismaMock.comment.update.mockResolvedValue(updatedComment);

        const result = await commentServices.updateComment({
          content: 'Updated content',
          commentId: comment.id,
          cardId: card.id,
          userId: user.id,
          boardId: board.id,
        });

        expect(result.content).toBe('Updated content');
        expect(prismaMock.comment.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: comment.id },
            data: { content: 'Updated content' },
          })
        );
        expect(activityLogger.logCombined).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'COMMENT_UPDATED', userId: user.id, boardId: board.id })
        );
        expect(prismaMock.comment.update).toHaveBeenCalledTimes(1);
      });

      it("should allow the board owner to update someone else's comment", async () => {
        const boardOwnerComment = { ...comment, userId: 'another-user' } as Comment;
        prismaMock.comment.findFirstOrThrow.mockResolvedValue(boardOwnerComment);
        prismaMock.comment.update.mockResolvedValue({ ...boardOwnerComment, content: 'Owner edit' } as Comment);

        const result = await commentServices.updateComment({
          content: 'Owner edit',
          commentId: comment.id,
          cardId: card.id,
          userId: user.id,
          boardId: board.id,
        });

        expect(result.content).toBe('Owner edit');
        expect(prismaMock.comment.update).toHaveBeenCalledTimes(1);
      });
    });

    describe('rainyDay', () => {
      it('should throw an error and not update if the comment is not found or access is denied', async () => {
        prismaMock.comment.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(4);

        try {
          await commentServices.updateComment({
            content: 'Hack edit',
            commentId: comment.id,
            cardId: card.id,
            userId: 'yetkisiz',
            boardId: board.id,
          });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.comment.update).not.toHaveBeenCalled();
          expect(activityLogger.logCombined).not.toHaveBeenCalled();
        }
      });
    });
  });

  // deleteComment

  describe('deleteComment', () => {
    let user: User;
    let board: Board;
    let card: Card;
    let comment: Comment;

    beforeEach(() => {
      ({ user, board, card, comment } = setupData());
    });

    describe('sunnyDay', () => {
      it('should allow the comment owner to delete the comment, return a message, and log activity', async () => {
        const result = await commentServices.deleteComment({
          commentId: comment.id,
          cardId: card.id,
          userId: user.id,
          boardId: board.id,
        });

        expect(result.message).toBe('Comment deleted successfully');
        expect(prismaMock.comment.delete).toHaveBeenCalledWith(expect.objectContaining({ where: { id: comment.id } }));
        expect(activityLogger.logCombined).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'COMMENT_DELETED', userId: user.id, boardId: board.id })
        );
        expect(prismaMock.comment.delete).toHaveBeenCalledTimes(1);
      });

      it("should allow the board owner to delete someone else's comment", async () => {
        const otherUserComment = { ...comment, userId: 'another-user' } as Comment;
        prismaMock.comment.findFirstOrThrow.mockResolvedValue(otherUserComment);

        const result = await commentServices.deleteComment({
          commentId: comment.id,
          cardId: card.id,
          userId: user.id,
          boardId: board.id,
        });

        expect(result.message).toBe('Comment deleted successfully');
        expect(prismaMock.comment.delete).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: otherUserComment.id } })
        );
        expect(activityLogger.logCombined).toHaveBeenCalledTimes(1);
      });
    });

    describe('rainyDay', () => {
      it('should throw an error and not delete if the comment is not found', async () => {
        prismaMock.comment.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(4);

        try {
          await commentServices.deleteComment({
            commentId: 'nonexistent-comment',
            cardId: card.id,
            userId: user.id,
            boardId: board.id,
          });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.comment.delete).not.toHaveBeenCalled();
          expect(activityLogger.logCombined).not.toHaveBeenCalled();
        }
      });

      it('should not allow a user who is neither the comment owner nor the board owner to delete the comment', async () => {
        prismaMock.comment.findFirstOrThrow.mockRejectedValue(new Error('Record not found'));
        expect.assertions(4);

        try {
          await commentServices.deleteComment({
            commentId: comment.id,
            cardId: card.id,
            userId: 'random-user',
            boardId: board.id,
          });
          throw new Error('Should have thrown an error!');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Record not found');
        } finally {
          expect(prismaMock.comment.delete).not.toHaveBeenCalled();
          expect(activityLogger.logCombined).not.toHaveBeenCalled();
        }
      });
    });
  });
});
