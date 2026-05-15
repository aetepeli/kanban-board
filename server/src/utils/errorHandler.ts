import { Response } from 'express';
import { IApiCode } from './constants';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger'; // Yeni logger'ı içeri al

// Sadece izin verdiğimiz ID'lerin loglanmasını sağlıyoruz
interface LogMetadata {
  userId?: string;
  boardId?: string;
  columnId?: string;
  cardId?: string;
  [key: string]: unknown; // Diğer beklenmedik ama güvenli alanlar için
}

class resLogger {
  static reply(res: Response, apiCode: IApiCode, data?: unknown) {
    if (apiCode.success) {
      const logMsg = `SUCCESS: ${apiCode.message}`;

      // data içinden sadece ilgilendiğimiz ID'leri güvenli bir şekilde çekiyoruz
      const meta: LogMetadata = {};

      if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>;

        // İlgilendiğimiz anahtar kelimeleri kontrol edelim
        const keysToLog = ['id', 'userId', 'boardId', 'columnId', 'cardId'];
        keysToLog.forEach((key) => {
          if (d[key]) meta[key] = String(d[key]);
        });
      }

      // Winston'a gönderirken stringleştirme yapıyoruz
      const metaInfo = Object.keys(meta).length ? ` | Details: ${JSON.stringify(meta)}` : '';

      logger.info(logMsg + metaInfo);
    }

    return res.status(apiCode.code).json({
      success: apiCode.success,
      message: apiCode.message,
      ...(apiCode.success ? { data } : { error: data }),
    });
  }

  static catchError(res: Response, error: unknown) {
    let message = 'An unexpected error occurred';
    let statusCode = 500;

    // --- Hata Tiplerini Derle ---
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        statusCode = 404;
        message = 'Resource not found';
      } else if (error.code === 'P2002') {
        statusCode = 409;
        message = 'Unique constraint failed';
      }
    } else if (error instanceof Error) {
      message = error.message;
      if (error.name === 'TokenExpiredError') statusCode = 401;
    }

    logger.error(`${message} ${statusCode !== 500 ? `(${statusCode})` : ''}`);

    // Eğer hata 500 ise (beklenmedikse) detayını küçük bir parça olarak bas
    if (statusCode === 500) {
      console.log('--- Stack Trace ---');
      console.error(error);
    }

    return res.status(statusCode).json({
      success: false,
      message: statusCode === 500 ? 'An unexpected error occurred on the server side.' : message,
    });
  }
}

export default resLogger;
