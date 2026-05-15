import { Request, Response } from 'express';
import cardServices from 'services/card/card.service';
import resLogger from 'utils/errorHandler';

const createCard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const columnId = req.params.columnId as string;
    const { title, content, deadline, priority, assigneeId, boardId } = req.body;

    const newCard = await cardServices.createCard({
      title,
      content,
      deadline,
      priority,
      boardId,
      columnId,
      userId,
      assigneeId,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(boardId).emit('card_created', { boardId, columnId, card: newCard });
    }

    return resLogger.reply(res, { code: 201, success: true, message: 'Card created successfully' }, newCard);
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const updateCard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const cardId = req.params.cardId as string;
    const columnId = req.params.columnId as string;

    const { title, content, deadline, priority, assigneeId, boardId } = req.body;

    const updatedCard = await cardServices.updateCard({
      userId,
      cardId,
      columnId,
      boardId,
      title,
      content,
      deadline,
      priority,
      assigneeId,
    });

    return resLogger.reply(res, { code: 200, success: true, message: 'Card updated successfully' }, updatedCard);
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const deleteCard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const columnId = req.params.columnId as string;
    const cardId = req.params.cardId as string;

    const boardId = req.query.boardId as string;

    const result = await cardServices.deleteCard({
      userId,
      boardId,
      columnId,
      cardId,
    });

    const io = req.app.get('io');
    if (io && boardId) {
      io.to(boardId).emit('card_deleted', { boardId, columnId, cardId });
    }

    return resLogger.reply(res, { code: 200, success: true, message: 'Card deleted successfully' }, result);
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const moveCard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const cardId = req.params.cardId as string;
    const fromColumnId = req.params.columnId as string;
    const { newOrder, toColumnId, boardId } = req.body;

    const result = await cardServices.moveCard({
      userId,
      boardId,
      fromColumnId,
      toColumnId,
      cardId,
      newOrder,
    });

    const io = req.app.get('io');

    if (io) {
      io.to(boardId).emit('card_moved', {
        cardId,
        fromColumnId,
        toColumnId,
        newOrder,
        senderId: userId,
        updatedAt: result.updatedAt,
      });
    }

    return resLogger.reply(res, { code: 200, success: true, message: 'Card moved successfully' }, result);
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const getCardById = async (req: Request, res: Response) => {
  try {
    const cardId = req.params.cardId as string;
    const userId = req.user?.id as string;

    // Pass parameters as an object
    const card = await cardServices.getCardById({ cardId, userId });

    return resLogger.reply(res, { code: 200, success: true, message: 'Card retrieved successfully' }, card);
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const cardCont = {
  createCard,
  updateCard,
  deleteCard,
  moveCard,
  getCardById,
};

export default cardCont;
