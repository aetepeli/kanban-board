import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { commentService } from "../../services/comment.service";
import * as commentTypes from "../../types/comment.types";
import { isAxiosError } from "axios";

const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.message || "Yorum işlemi sırasında hata oluştu."
    );
  }
  return "Bilinmeyen bir hata oluştu.";
};

export const createComment = createAsyncThunk(
  "comments/createComment",
  async (
    params: commentTypes.CreateCommentParams & { columnId: string },
    { rejectWithValue },
  ) => {
    try {
      const newComment = await commentService.createComment(params);
      return {
        comment: newComment,
        cardId: params.cardId,
        columnId: params.columnId,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateComment = createAsyncThunk(
  "comments/updateComment",
  async (
    params: commentTypes.UpdateCommentParams & { columnId: string },
    { rejectWithValue },
  ) => {
    try {
      const updatedComment = await commentService.updateComment(params);
      return {
        comment: updatedComment,
        cardId: params.cardId,
        columnId: params.columnId,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deleteComment = createAsyncThunk(
  "comments/deleteComment",
  async (
    params: commentTypes.DeleteCommentParams & { columnId: string },
    { rejectWithValue },
  ) => {
    try {
      await commentService.deleteComment(params);
      return {
        commentId: params.commentId,
        cardId: params.cardId,
        columnId: params.columnId,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

interface CommentState {
  isLoading: boolean;
  error: string | null;
}

const initialState: CommentState = {
  isLoading: false,
  error: null,
};

const commentSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    clearCommentErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) =>
          action.type.startsWith("comments/") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("comments/") &&
          action.type.endsWith("/fulfilled"),
        (state) => {
          state.isLoading = false;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("comments/") &&
          action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.error = action.payload;
        },
      );
  },
});

const commentThunks = {
  createComment,
  updateComment,
  deleteComment,
};

export { commentThunks };
export const { clearCommentErrors } = commentSlice.actions;
export default commentSlice.reducer;
