import { prisma } from '../../config/db';
import { activityLogger } from 'utils/activityHandler';
import * as cardTypes from './card.type';

const createCard = async (params: cardTypes.cardCreateParams) => {
  const { title, content, deadline, priority, boardId, columnId, userId, assigneeId } = params;

  await prisma.column.findFirstOrThrow({
    where: {
      id: columnId,
      boardId,
      board: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    },
    select: {
      boardId: true,
    },
  });

  const lastCard = await prisma.card.findFirst({
    where: { columnId },
    orderBy: { order: 'desc' },
  });

  const newOrder = lastCard ? lastCard.order + 1 : 0;

  const newCard = await prisma.card.create({
    data: {
      title,
      content,
      order: newOrder,
      deadline: deadline ? new Date(deadline) : undefined,
      columnId,
      ...(priority && { priority }),
      ...(assigneeId && { assigneeId }),
    },
  });

  await activityLogger.logCombined({
    userId,
    boardId,
    action: 'CARD_CREATED',
    details: `Card created in column ${columnId} with title "${title}".`,
    ipAddress: '127.168.1.1',
  });

  return newCard;
};

const updateCard = async (params: cardTypes.cardUpdateParams) => {
  const { cardId, columnId, boardId, userId, title, content, deadline, priority, assigneeId } = params;

  await prisma.card.findFirstOrThrow({
    where: {
      id: cardId,
      columnId,
      column: {
        boardId,
        board: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      },
    },
  });

  const updatedCard = await prisma.card.update({
    where: { id: cardId },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(deadline !== undefined && { deadline: new Date(deadline) }),
      ...(priority !== undefined && { priority }),
      ...(assigneeId !== undefined && { assigneeId }),
    },
  });

  await activityLogger.logCombined({
    userId,
    boardId,
    action: 'CARD_UPDATED',
    details: `Card updated in column ${columnId} with title "${title}".`,
  });

  return updatedCard;
};

const deleteCard = async (params: cardTypes.cardDeleteParams) => {
  const { cardId, columnId, boardId, userId } = params;

  await prisma.card.findFirstOrThrow({
    where: {
      id: cardId,
      columnId,
      column: {
        boardId,
        board: {
          OR: [{ ownerId: userId }, { members: { some: { userId: userId } } }],
        },
      },
    },
  });

  await prisma.card.delete({
    where: { id: cardId },
  });

  await activityLogger.logCombined({
    userId,
    boardId,
    action: 'CARD_DELETED',
    details: `Card deleted from column ${columnId}.`,
  });

  return { message: 'card deleted successfully' };
};

const moveCard = async (params: cardTypes.cardMoveParams) => {
  const { cardId, boardId, fromColumnId, toColumnId, newOrder, userId } = params;

  const card = await prisma.card.findFirstOrThrow({
    where: {
      id: cardId,
      columnId: fromColumnId,
      column: {
        boardId,
        board: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      },
    },
  });

  const oldOrder = card.order;

  if (fromColumnId === toColumnId && newOrder === oldOrder) {
    return card;
  }

  if (fromColumnId !== toColumnId) {
    await prisma.column.findFirstOrThrow({
      where: {
        id: toColumnId,
        boardId,
      },
    });
  }

  const updatedCard = await prisma.$transaction(async (tx) => {
    if (fromColumnId === toColumnId) {
      if (newOrder < oldOrder) {
        await tx.card.updateMany({
          where: {
            columnId: fromColumnId,
            order: { gte: newOrder, lt: oldOrder },
          },
          data: { order: { increment: 1 } },
        });
      } else {
        await tx.card.updateMany({
          where: {
            columnId: toColumnId,
            order: { gt: oldOrder, lte: newOrder },
          },
          data: { order: { decrement: 1 } },
        });
      }
    } else {
      await tx.card.updateMany({
        where: { columnId: fromColumnId, order: { gt: oldOrder } },
        data: { order: { decrement: 1 } },
      });

      await tx.card.updateMany({
        where: { columnId: toColumnId, order: { gte: newOrder } },
        data: { order: { increment: 1 } },
      });
    }

    const finalCard = await tx.card.update({
      where: { id: cardId },
      data: {
        columnId: toColumnId,
        order: newOrder,
      },
    });

    await activityLogger.logCombined({
      userId,
      boardId,
      action: 'CARD_MOVED',
      details: `Card moved ${fromColumnId === toColumnId ? 'within the same column' : 'to a different column'}. (Position: ${oldOrder} -> ${newOrder})`,
    });

    return finalCard;
  });

  return updatedCard;
};

const getCardById = async (params: { cardId: string; userId: string }) => {
  const { cardId, userId } = params;

  return await prisma.card.findFirstOrThrow({
    where: {
      id: cardId,
      column: {
        board: {
          OR: [{ ownerId: userId }, { members: { some: { userId: userId } } }], // BURAYI DA userId: userId YAPMIŞTIK, UNUTMA :)
        },
      },
    },
    include: {
      column: {
        select: {
          boardId: true,
          title: true,
          board: { select: { ownerId: true } }, // YENİ EKLENEN KISIM 👇: Panonun sahibini de çekiyoruz
        },
      },
      assignee: {
        select: { id: true, fullName: true, email: true },
      },
      comments: {
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
};

const cardServices = {
  createCard,
  updateCard,
  deleteCard,
  getCardById,
  moveCard,
};

export default cardServices;
