import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import cardService from "../../services/card.service";
import * as cardTypes from "../../types/card.types";
import * as commentTypes from "../../types/comment.types";
import { isAxiosError } from "axios";
import { commentThunks } from "../comments/commentSlice";

const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.message || "Kart işlemi sırasında hata oluştu."
    );
  }
  return "Bilinmeyen bir hata oluştu.";
};

export const createCard = createAsyncThunk(
  "cards/createCard",
  async (params: cardTypes.CreateCardParams, { rejectWithValue }) => {
    try {
      const newCard = await cardService.createCard(params);
      return { card: newCard, columnId: params.columnId };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateCard = createAsyncThunk(
  "cards/updateCard",
  async (params: cardTypes.UpdateCardParams, { rejectWithValue }) => {
    try {
      const updatedCard = await cardService.updateCard(params);
      return { card: updatedCard, columnId: params.columnId };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deleteCard = createAsyncThunk(
  "cards/deleteCard",
  async (params: cardTypes.DeleteCardParams, { rejectWithValue }) => {
    try {
      await cardService.deleteCard(params);
      return { cardId: params.cardId, columnId: params.columnId };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const moveCard = createAsyncThunk(
  "cards/moveCard",
  async (params: cardTypes.MoveCardParams, { rejectWithValue }) => {
    try {
      const movedCard = await cardService.moveCard(params);
      return {
        card: movedCard,
        fromColumnId: params.fromColumnId,
        toColumnId: params.toColumnId,
        newIndex: params.newOrder,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchCardById = createAsyncThunk(
  "cards/fetchCardById",
  async (cardId: string, { rejectWithValue }) => {
    try {
      return await cardService.getCardById(cardId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

interface SliceExtendedCard extends cardTypes.Card {
  comments?: commentTypes.Comment[];
}

interface CardState {
  isLoading: boolean;
  error: string | null;
  currentCard: SliceExtendedCard | null;
}

const initialState: CardState = {
  isLoading: false,
  error: null,
  currentCard: null,
};

const cardSlice = createSlice({
  name: "cards",
  initialState,
  reducers: {
    clearCardErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCardById.fulfilled, (state, action) => {
        state.currentCard = action.payload;
        state.isLoading = false;
      })

      .addCase(commentThunks.createComment.fulfilled, (state, action) => {
        if (
          state.currentCard &&
          state.currentCard.id === action.payload.cardId
        ) {
          if (!state.currentCard.comments) {
            state.currentCard.comments = [];
          }
          const newComment = action.payload
            .comment as unknown as commentTypes.Comment;
          state.currentCard.comments.unshift(newComment);
        }
      })

      .addMatcher(
        (action) =>
          action.type.startsWith("cards/") && action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("cards/") &&
          action.type.endsWith("/fulfilled"),
        (state) => {
          state.isLoading = false;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("cards/") && action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.error = action.payload;
        },
      );
  },
});

const cardThunks = {
  createCard,
  updateCard,
  deleteCard,
  moveCard,
  fetchCardById,
};

export { cardThunks };
export const { clearCardErrors } = cardSlice.actions;
export default cardSlice.reducer;
