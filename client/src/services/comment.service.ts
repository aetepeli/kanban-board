import api from "./api";
import * as commentTypes from "../types/comment.types";

export const commentService = {
  createComment: async (
    params: commentTypes.CreateCommentParams,
  ): Promise<commentTypes.Comment> => {
    const { data } = await api.post(
      `/api/v1/cards/${params.cardId}/comments?boardId=${params.boardId}`,
      {
        content: params.content,
      },
    );
    return data.data;
  },

  updateComment: async (
    params: commentTypes.UpdateCommentParams,
  ): Promise<commentTypes.Comment> => {
    const { data } = await api.put(
      `/api/v1/cards/${params.cardId}/comments/${params.commentId}`,
      params,
    );
    return data.data;
  },

  deleteComment: async (
    params: commentTypes.DeleteCommentParams,
  ): Promise<{ message: string }> => {
    const { data } = await api.delete(
      `/api/v1/cards/${params.cardId}/comments/${params.commentId}`,
    );
    return data.data;
  },
};
