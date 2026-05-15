import { prisma } from '../config/db';
import { Request, Response, NextFunction } from 'express';
import tokenUtils from 'utils/generateToken';
import errorLogger from 'utils/errorHandler';
import { User } from '@prisma/client';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return errorLogger.reply(res, {
      code: 401,
      message: 'Not authorized, no token provided!',
      success: false,
    });
  }

  try {
    const decoded = tokenUtils.verifyToken(token);

    if (!decoded) {
      return errorLogger.reply(res, {
        code: 401,
        message: 'Invalid or expired token',
        success: false,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return errorLogger.reply(res, {
        code: 401,
        message: 'User no longer exists',
        success: false,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return errorLogger.reply(
      res,
      {
        code: 401,
        message: 'Not authorized, token failed',
        success: false,
      },
      error
    );
  }
};
