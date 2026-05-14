import api from "./api";
import * as columnTypes from "../types/column.types";

const columnService = {
  createColumn: async (
    params: columnTypes.CreateColumnParams,
  ): Promise<columnTypes.Column> => {
    const { data } = await api.post(
      `/api/v1/boards/${params.boardId}/columns`,
      {
        title: params.title,
      },
    );
    return data.data;
  },

  updateColumn: async (
    params: columnTypes.UpdateColumnParams,
  ): Promise<columnTypes.Column> => {
    const { data } = await api.patch(
      `/api/v1/boards/${params.boardId}/columns/${params.columnId}`,
      { title: params.title },
    );
    return data.data;
  },

  deleteColumn: async (
    params: columnTypes.DeleteColumnParams,
  ): Promise<void> => {
    await api.delete(
      `/api/v1/boards/${params.boardId}/columns/${params.columnId}`,
    );
  },
};

export default columnService;
