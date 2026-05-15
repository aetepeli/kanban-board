import { Request, Response } from 'express';
import boardServices from 'services/board/board.service';
import resLogger from 'utils/errorHandler';

const createBoard = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const userId = req.user?.id as string;

    const newBoard = await boardServices.createBoard({
      title,
      userId,
    });

    return resLogger.reply(
      res,
      {
        code: 201,
        success: true,
        message: 'Board created successfully',
      },
      newBoard
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const getBoards = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;

    const boards = await boardServices.getUserBoards(userId);

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Boards retrieved successfully',
      },
      boards
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const deleteBoard = async (req: Request, res: Response) => {
  try {
    const boardId = req.params.boardId as string;

    const userId = req.user?.id as string;

    await boardServices.deleteBoard({
      boardId,
      userId,
    });

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Board deleted successfully',
      },
      null
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const getBoard = async (req: Request, res: Response) => {
  try {
    const boardId = req.params.boardId as string;
    const userId = req.user?.id as string;

    const board = await boardServices.getBoardById({
      boardId,
      userId,
    });

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Board retrieved successfully',
      },
      board
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const addMember = async (req: Request, res: Response) => {
  try {
    const boardId = req.params.boardId as string;
    const inviterId = req.user?.id as string;
    const { email } = req.body;

    const newMember = await boardServices.addMember({
      boardId,
      inviterId,
      email,
    });

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Member added successfully',
      },
      newMember
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const removeMember = async (req: Request, res: Response) => {
  try {
    const boardId = req.params.boardId as string;
    const requesterId = req.user?.id as string;
    const memberIdToRemove = req.params.memberId as string;

    await boardServices.removeMember({
      boardId,
      requesterId,
      memberIdToRemove,
    });

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Member deleted successfully',
      },
      null
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const getBoardLogs = async (req: Request, res: Response) => {
  try {
    const boardId = req.params.boardId as string;
    const userId = req.user?.id as string;

    const result = await boardServices.getBoardActivityLog({
      boardId,
      userId,
    });

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Activity log retrieved successfully',
      },
      result
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const boardsCont = {
  createBoard,
  getBoards,
  deleteBoard,
  getBoard,
  addMember,
  removeMember,
  getBoardLogs,
};

export default boardsCont;
