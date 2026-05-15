import { Prisma } from '.prisma/client';
import { prisma } from 'config/db';

interface userLogParams {
  userId: string;
  action: string;
  details?: string;
  ipAddress?: string;
}

interface boardLogParams {
  userId: string;
  boardId: string;
  action: string;
  details?: string;
}

interface combinedLogParams {
  userId: string;
  boardId: string;
  action: string;
  details?: string;
  ipAddress?: string;
}

export const activityLogger = {
  logUser: async ({ userId, action, details, ipAddress }: userLogParams) => {
    try {
      await prisma.userActivityLog.create({
        data: { userId, action, details, ipAddress },
      });
    } catch (error) {
      console.error('User activity Log Error: ', error);
    }
  },

  logBoard: async ({ userId, boardId, action, details }: boardLogParams) => {
    try {
      await prisma.boardActivityLog.create({
        data: { userId, boardId, action, details },
      });
    } catch (error) {
      console.error('Board Activity Log Error: ', error);
    }
  },

  logCombined: async (
    { userId, boardId, action, details, ipAddress }: combinedLogParams,
    tx?: Prisma.TransactionClient
  ) => {
    try {
      const db = tx || prisma;

      await Promise.all([
        db.userActivityLog.create({
          data: { userId, action, details, ipAddress },
        }),
        db.boardActivityLog.create({
          data: { userId, boardId, action, details },
        }),
      ]);
    } catch (error) {
      console.error('Combined activity log error: ', error);
    }
  },
};
