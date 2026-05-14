import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import columnService from "../../services/column.service";
import * as columnTypes from "../../types/column.types";
import { isAxiosError } from "axios";

const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.message || "Kolon işlemi sırasında hata oluştu."
    );
  }
  return "Bilinmeyen bir hata oluştu.";
};

// column create
export const createColumn = createAsyncThunk(
  "columns/createColumn",
  async (params: columnTypes.CreateColumnParams, { rejectWithValue }) => {
    try {
      return await columnService.createColumn(params);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// column update
export const updateColumn = createAsyncThunk(
  "columns/updateColumn",
  async (params: columnTypes.UpdateColumnParams, { rejectWithValue }) => {
    try {
      return await columnService.updateColumn(params);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// column delete
export const deleteColumn = createAsyncThunk(
  "columns/deleteColumn",
  async (params: columnTypes.DeleteColumnParams, { rejectWithValue }) => {
    try {
      await columnService.deleteColumn(params);
      return params.columnId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

interface ColumnState {
  isLoading: boolean;
  error: string | null;
}

const initialState: ColumnState = {
  isLoading: false,
  error: null,
};

const columnSlice = createSlice({
  name: "columns",
  initialState,
  reducers: {
    clearColumnErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) =>
          action.type.startsWith("columns/") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("columns/") &&
          action.type.endsWith("/fulfilled"),
        (state) => {
          state.isLoading = false;
        },
      )

      .addMatcher(
        (action) =>
          action.type.startsWith("columns/") &&
          action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.error = action.payload;
        },
      );
  },
});

const columnThunks = {
  createColumn,
  updateColumn,
  deleteColumn,
};

export { columnThunks };
export const { clearColumnErrors } = columnSlice.actions;
export default columnSlice.reducer;
