import { Request, Response } from 'express';
import commentServices from 'services/comment/comment.service';
import resLogger from 'utils/errorHandler';

const createComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const cardId = req.params.cardId as string;

    const boardId = req.query.boardId as string;

    const { content } = req.body;

    if (!boardId) {
      throw new Error('boardId query parametresi zorunludur.');
    }

    const newComment = await commentServices.createComment({
      userId,
      cardId,
      boardId,
      content,
    });

    return resLogger.reply(res, { code: 201, success: true, message: 'Yorum oluşturuldu' }, newComment);
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const updateComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const commentId = req.params.commentId as string;
    const cardId = req.params.cardId as string;
    const boardId = req.params.boardId as string;
    const { content } = req.body;

    const updatedComment = await commentServices.updateComment({
      commentId,
      content,
      cardId,
      userId,
      boardId,
    });

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Comment updated successfully',
      },
      updatedComment
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const deleteComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const commentId = req.params.commentId as string;
    const cardId = req.params.cardId as string;
    const boardId = req.params.boardId as string;

    await commentServices.deleteComment({
      commentId,
      cardId,
      userId,
      boardId,
    });

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Comment deleted successfully',
      },
      null
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const commentCont = {
  createComment,
  updateComment,
  deleteComment,
};

export default commentCont;
