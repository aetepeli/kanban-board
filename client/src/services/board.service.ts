import api from "./api";
import * as boardTypes from "../types/board.types";

const boardService = {
  getBoards: async (): Promise<boardTypes.BoardSummary[]> => {
    const { data } = await api.get("/api/v1/boards");
    return data.data;
  },

  getBoardById: async (boardId: string): Promise<boardTypes.BoardDetail> => {
    const { data } = await api.get(`/api/v1/boards/${boardId}`);
    return data.data;
  },

  createBoard: async (title: string): Promise<boardTypes.BoardDetail> => {
    const { data } = await api.post("/api/v1/boards", { title });
    return data.data;
  },

  deleteBoard: async (boardId: string): Promise<void> => {
    await api.delete(`/api/v1/boards/${boardId}`);
  },

  addMember: async (
    boardId: string,
    email: string,
  ): Promise<boardTypes.AddedMember> => {
    const { data } = await api.post(`/api/v1/boards/${boardId}/members`, {
      email,
    });
    return data.data;
  },

  removeMember: async (boardId: string, memberId: string): Promise<void> => {
    await api.delete(`/api/v1/boards/${boardId}/members/${memberId}`);
  },

  getBoardLogs: async (
    boardId: string,
  ): Promise<boardTypes.BoardActivityLog[]> => {
    const { data } = await api.get(`/api/v1/boards/${boardId}/logs`);
    return data.data;
  },
};

export default boardService;
