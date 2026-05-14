import api from "./api";
import * as cardTypes from "../types/card.types";

const cardService = {
  createCard: async (
    params: cardTypes.CreateCardParams,
  ): Promise<cardTypes.Card> => {
    const { data } = await api.post(
      `/api/v1/columns/${params.columnId}/cards`,
      params,
    );
    return data.data;
  },

  updateCard: async (
    params: cardTypes.UpdateCardParams,
  ): Promise<cardTypes.Card> => {
    const { data } = await api.patch(
      `/api/v1/columns/${params.columnId}/cards/${params.cardId}`,
    );
    return data.data;
  },

  deleteCard: async (params: cardTypes.DeleteCardParams): Promise<void> => {
    await api.delete(
      `/api/v1/columns/${params.columnId}/cards/${params.cardId}?boardId=${params.boardId}`,
    );
  },

  moveCard: async (
    params: cardTypes.MoveCardParams,
  ): Promise<cardTypes.Card> => {
    const { fromColumnId, toColumnId, cardId, newOrder, boardId } = params;

    const { data } = await api.patch(
      `/api/v1/columns/${fromColumnId}/cards/${cardId}/move`,
      { newOrder, toColumnId, boardId },
    );
    return data.data;
  },

  getCardById: async (cardId: string): Promise<cardTypes.Card> => {
    const { data } = await api.get(`/api/v1/cards/${cardId}`);
    return data.data;
  },
};

export default cardService;
