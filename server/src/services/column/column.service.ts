import { activityLogger } from 'utils/activityHandler';
import { prisma } from '../../config/db';
import * as columnTypes from './column.type';

const createColumn = async (params: columnTypes.createColumnParams) => {
  const { title, boardId, userId } = params;

  await prisma.board.findFirstOrThrow({
    where: {
      id: boardId,
      ownerId: userId,
    },
  });

  const lastColumn = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { order: 'desc' },
  });

  const newOrder = lastColumn ? lastColumn.order + 1 : 0;

  const newColumn = await prisma.column.create({
    data: {
      title,
      boardId,
      order: newOrder,
    },
  });

  await activityLogger.logCombined({
    userId,
    boardId,
    action: 'COLUMN_CREATED',
    details: `Column created with title "${title}".`,
  });

  return newColumn;
};

const updateColumn = async (params: columnTypes.updateColumnParams) => {
  const { columnId, boardId, userId, title } = params;

  await prisma.column.findFirstOrThrow({
    where: {
      id: columnId,
      boardId,
      board: {
        ownerId: userId,
      },
    },
  });

  const updatedColumn = await prisma.column.update({
    where: { id: columnId },
    data: {
      ...(title !== undefined && { title }),
    },
  });

  await activityLogger.logCombined({
    userId,
    boardId,
    action: 'COLUMN_UPDATED',
    details: `Column name updated: ${updatedColumn.title}`,
  });

  return updatedColumn;
};

const deleteColumn = async (params: columnTypes.deleteColumnParams) => {
  const { columnId, userId } = params;

  const columnToDelete = await prisma.column.findFirstOrThrow({
    where: {
      id: columnId,
    },
  });

  await prisma.column.findFirstOrThrow({
    where: {
      id: columnId,
      board: {
        ownerId: userId,
      },
    },
  });

  await prisma.column.delete({
    where: { id: columnId },
  });

  await activityLogger.logCombined({
    userId,
    boardId: columnToDelete.boardId,
    action: 'COLUMN_DELETED',
    details: `Column deleted with id "${columnId}".`,
  });

  return { message: 'Column deleted successfully' };
};

const columnServices = {
  createColumn,
  updateColumn,
  deleteColumn,
};

export default columnServices;
