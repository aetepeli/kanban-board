import { activityLogger } from 'utils/activityHandler';
import { prisma } from '../../config/db';
import * as commentTypes from './comment.type';

const createComment = async (params: commentTypes.commentCreateparams) => {
  const { content, cardId, userId, boardId } = params;

  await prisma.card.findFirstOrThrow({
    where: {
      id: cardId,
      column: {
        boardId,
        board: {
          OR: [{ ownerId: userId }, { members: { some: { userId: userId } } }],
        },
      },
    },
  });

  const newComment = await prisma.comment.create({
    data: {
      content,
      cardId,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  await activityLogger.logCombined({
    userId,
    boardId,
    action: 'COMMENT_CREATED',
    details: `User: ${userId} created a comment.`,
  });

  return newComment;
};

const updateComment = async (params: commentTypes.commentUpdateParams) => {
  const { content, commentId, cardId, userId, boardId } = params;

  await prisma.comment.findFirstOrThrow({
    where: {
      id: commentId,
      cardId,
      card: {
        column: {
          boardId,
        },
      },
      OR: [{ userId }, { card: { column: { board: { ownerId: userId } } } }],
    },
  });

  const updatedComment = await prisma.comment.update({
    where: {
      id: commentId,
    },
    data: {
      content,
    },
  });

  await activityLogger.logCombined({
    userId,
    boardId,
    action: 'COMMENT_UPDATED',
    details: `User: ${userId} updated a comment.`,
  });

  return updatedComment;
};

const deleteComment = async (params: commentTypes.commentDeleteParams) => {
  const { commentId, cardId, userId, boardId } = params;

  const comment = await prisma.comment.findFirstOrThrow({
    where: {
      id: commentId,
      cardId,
      card: {
        column: {
          boardId,
        },
      },
      OR: [
        { userId },
        {
          card: {
            column: {
              board: {
                ownerId: userId,
              },
            },
          },
        },
      ],
    },
  });

  await prisma.comment.delete({
    where: {
      id: comment.id,
    },
  });

  await activityLogger.logCombined({
    userId,
    boardId,
    action: 'COMMENT_DELETED',
    details: `User: ${userId} deleted a comment.`,
  });

  return { message: 'Comment deleted successfully' };
};

const commentServices = {
  createComment,
  updateComment,
  deleteComment,
};

export default commentServices;
