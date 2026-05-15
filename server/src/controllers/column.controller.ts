import { Request, Response } from 'express';
import columnServices from 'services/column/column.service';
import resLogger from 'utils/errorHandler';

const createColumn = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const boardId = req.params.boardId as string;
    const { title } = req.body;

    const newColumn = await columnServices.createColumn({
      title,
      boardId,
      userId,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(boardId).emit('column_created', { boardId, column: newColumn });
    }

    return resLogger.reply(
      res,
      {
        code: 201,
        success: true,
        message: 'Column created successfully',
      },
      newColumn
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const updateColumn = async (req: Request, res: Response) => {
  try {
    const boardId = req.params.boardId as string;
    const columnId = req.params.columnId as string;
    const userId = req.user?.id as string;
    const { title } = req.body;

    const result = await columnServices.updateColumn({
      boardId,
      columnId,
      userId,
      title,
    });

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Column updated successfully',
      },
      result
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const deleteColumn = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const columnId = req.params.columnId as string;
    const boardId = req.params.boardId as string;

    await columnServices.deleteColumn({
      columnId,
      userId,
    });

    const io = req.app.get('io');
    if (io && boardId) {
      io.to(boardId).emit('column_deleted', { boardId, columnId });
    }

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Column deleted successfully',
      },
      null
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const columnCont = {
  createColumn,
  updateColumn,
  deleteColumn,
};

export default columnCont;
