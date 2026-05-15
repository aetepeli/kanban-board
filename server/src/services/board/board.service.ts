import APIError from 'utils/apiErrors';
import { prisma } from '../../config/db';
import { API_CODES } from 'utils/constants';
import * as boardTypes from './board.type';
import { activityLogger } from 'utils/activityHandler';

const createBoard = async (params: boardTypes.createBoardParams) => {
  const { title, userId } = params;

  const newBoard = await prisma.board.create({
    data: {
      title,
      ownerId: userId,
      members: {
        create: {
          userId: userId,
          role: 'OWNER',
        },
      },
      columns: {
        create: [
          { title: 'To Do', order: 0 },
          { title: 'In Progress', order: 1 },
          { title: 'Done', order: 2 },
        ],
      },
    },
    include: {
      columns: true,
    },
  });

  const actualBoard = newBoard.id;

  await activityLogger.logCombined({
    userId,
    boardId: actualBoard,
    action: 'BOARD_CREATED',
    details: `${userId} created board.`,
  });

  return newBoard;
};

const getUserBoards = async (userId: string) => {
  const boards = await prisma.board.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      ownerId: true,
    },
  });

  return boards;
};

const deleteBoard = async (params: boardTypes.deleteBoardParams) => {
  const { boardId, userId } = params;

  await prisma.board.findFirstOrThrow({
    where: { id: boardId, ownerId: userId },
  });

  await prisma.board.delete({
    where: { id: boardId },
  });

  await activityLogger.logUser({
    userId,
    action: 'BOARD_DELETED',
    details: `${userId} deleted board: ${boardId}`,
  });

  return { message: 'Board deleted successfully' };
};

const getBoardById = async (params: boardTypes.getBoardByIdParams) => {
  const { boardId, userId } = params;

  const board = await prisma.board.findFirstOrThrow({
    where: {
      id: boardId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: {
      owner: { select: { id: true, fullName: true, email: true } },
      members: { select: { role: true, user: { select: { id: true, fullName: true, email: true } } } },
      columns: {
        orderBy: { order: 'asc' },
        include: {
          card: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  return board;
};

const addMember = async (params: boardTypes.addMemberParams) => {
  const { boardId, inviterId, email } = params;

  await prisma.board.findFirstOrThrow({
    where: {
      id: boardId,
      ownerId: inviterId,
    },
  });

  const userToInvite = await prisma.user.findFirstOrThrow({
    where: { email },
  });

  if (userToInvite.id === inviterId) {
    throw new APIError(API_CODES.BAD_REQUEST, 'Kendinizi panoya davet edemezsiniz!');
  }

  const existingMember = await prisma.boardMember.findUnique({
    where: {
      userId_boardId: {
        userId: userToInvite.id,
        boardId: boardId,
      },
    },
  });

  if (existingMember) {
    throw new APIError(API_CODES.CONFLICT, 'Bu kullanıcı zaten panoya üye!');
  }

  const newMember = await prisma.boardMember.create({
    data: {
      boardId,
      userId: userToInvite.id,
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  await activityLogger.logCombined({
    userId: inviterId,
    boardId,
    action: 'ADDED_MEMBER',
    details: `${inviterId} added ${newMember.user.id} to ${boardId}.`,
  });

  return newMember;
};

const removeMember = async (params: boardTypes.removeMemberParams) => {
  const { boardId, requesterId, memberIdToRemove } = params;

  if (requesterId === memberIdToRemove) {
    throw new APIError(API_CODES.BAD_REQUEST, 'You cannot remove yourself from the board!');
  }

  await prisma.board.findFirstOrThrow({
    where: {
      id: boardId,
      ownerId: requesterId,
    },
  });

  await prisma.boardMember.delete({
    where: {
      userId_boardId: {
        userId: memberIdToRemove,
        boardId,
      },
    },
  });

  await activityLogger.logCombined({
    userId: requesterId,
    boardId,
    action: 'REMOVE_MEMBER',
    details: `${requesterId} removed ${memberIdToRemove} to ${boardId}.`,
  });

  return { message: 'Member removed successfully' };
};

const checkUserAccess = async (params: boardTypes.checkUserAccessParams): Promise<boolean> => {
  const { boardId, userId } = params;

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    select: {
      id: true,
    },
  });
  return board !== null;
};

const getBoardActivityLog = async (params: boardTypes.getBoardActivityLogParams) => {
  const { boardId, userId } = params;

  await prisma.board.findFirstOrThrow({
    where: {
      id: boardId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
  });

  const logs = await prisma.boardActivityLog.findMany({
    where: { boardId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  return logs;
};

const boardServices = {
  createBoard,
  getUserBoards,
  deleteBoard,
  getBoardById,
  addMember,
  removeMember,
  checkUserAccess,
  getBoardActivityLog,
};

export default boardServices;
