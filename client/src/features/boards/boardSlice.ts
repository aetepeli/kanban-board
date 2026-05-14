import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import boardService from "../../services/board.service";
import * as boardTypes from "../../types/board.types";
import { isAxiosError } from "axios";
import { columnThunks } from "../columns/columnSlice";
import { cardThunks } from "../cards/cardSlice";
import { commentThunks } from "../comments/commentSlice";

// Thunks

// Hata mesajını çıkaran yardımcı fonksiyon
const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || "Bir hata oluştu.";
  }
  return "Bilinmeyen bir hata oluştu.";
};

// Tüm boardları listeleme (BoardSummary[])
export const fetchBoards = createAsyncThunk(
  "boards/fetchBoards", // => action type (tarayıcımızda bu isimle gözükecek)
  async (_, { rejectWithValue }) => {
    // 1-bütün boardları çağıracağımız için parametreye ihtiyacımız yok, o yüzden _ kullandık
    // 2- rejectWithValue, hata durumunda payload olarak error mesajını göndermek için kullanılır (şu sebepten dolayı hata aldık der)
    try {
      return await boardService.getBoards();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchBoardById = createAsyncThunk(
  "boards/fetchBoardById",
  async (boardId: string, { rejectWithValue }) => {
    try {
      return await boardService.getBoardById(boardId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createBoard = createAsyncThunk(
  "boards/createBoard",
  async (title: string, { rejectWithValue }) => {
    try {
      return await boardService.createBoard(title);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deleteBoard = createAsyncThunk(
  "boards/deleteBoard",
  async (boardId: string, { rejectWithValue }) => {
    try {
      await boardService.deleteBoard(boardId);
      return boardId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchBoardLogs = createAsyncThunk(
  "boards/fetchBoardLogs",
  async (boardId: string, { rejectWithValue }) => {
    try {
      return await boardService.getBoardLogs(boardId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const addBoardMember = createAsyncThunk(
  "boards/addMember",
  async (params: { boardId: string; email: string }, { rejectWithValue }) => {
    try {
      return await boardService.addMember(params.boardId, params.email);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const removeBoardMember = createAsyncThunk(
  "boards/removeMember",
  async (
    params: { boardId: string; memberId: string },
    { rejectWithValue },
  ) => {
    try {
      await boardService.removeMember(params.boardId, params.memberId);
      return params.memberId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// State

interface BoardState {
  boards: boardTypes.BoardSummary[]; // Anasayfadaki board listesi
  currentBoard: boardTypes.BoardDetail | null; // aktif olarak kullanılan board
  logs: boardTypes.BoardActivityLog[]; // Aktif board logları
  isLoading: boolean;
  error: string | null;
}

const initialState: BoardState = {
  boards: [],
  currentBoard: null,
  logs: [],
  isLoading: false,
  error: null,
};

// Slice ve Reducers

const boardSlice = createSlice({
  name: "boards",
  initialState,
  reducers: {
    // Başka bir sayfaya geçince mevcut boardu temizlemek için
    clearCurrentBoard: (state) => {
      state.currentBoard = null;
      state.logs = [];
    },
    // Hataları ekrandan temizlemek için
    clearBoardErrors: (state) => {
      state.error = null;
    },

    moveCardSocket: (state, action) => {
      if (!state.currentBoard) return;

      const { cardId, fromColumnId, toColumnId, newIndex } = action.payload;

      const sourceCol = state.currentBoard.columns.find(
        (c) => c.id === fromColumnId,
      );
      const destCol = state.currentBoard.columns.find(
        (c) => c.id === toColumnId,
      );

      if (sourceCol && destCol) {
        // Kartı bul
        const cardToMove = sourceCol.card.find((c) => c.id === cardId);
        if (cardToMove) {
          // Eski kolondan sil
          sourceCol.card = sourceCol.card.filter((c) => c.id !== cardId);
          // Yeni kolona anında ekle
          destCol.card.splice(newIndex, 0, cardToMove);
        }
      }
    },

    // boardSlice.ts içindeki reducers kısmına eklenecekler:

    createColumnSocket: (state, action) => {
      if (!state.currentBoard) return;
      const newColumn = action.payload;

      // Çiftlemeyi önle: Kolon zaten varsa ekleme
      const exists = state.currentBoard.columns.find(
        (c) => c.id === newColumn.id,
      );
      if (!exists) {
        state.currentBoard.columns.push({
          ...newColumn,
          card: newColumn.card || [],
        });
      }
    },
    deleteColumnSocket: (state, action) => {
      if (!state.currentBoard) return;
      const { columnId } = action.payload;
      state.currentBoard.columns = state.currentBoard.columns.filter(
        (c) => c.id !== columnId,
      );
    },
    createCardSocket: (state, action) => {
      if (!state.currentBoard) return;
      const { columnId, card } = action.payload;
      const column = state.currentBoard.columns.find((c) => c.id === columnId);

      if (column) {
        const exists = column.card.find((c) => c.id === card.id);
        if (!exists) {
          column.card.push(card);
        }
      }
    },
    deleteCardSocket: (state, action) => {
      if (!state.currentBoard) return;
      const { columnId, cardId } = action.payload;
      const column = state.currentBoard.columns.find((c) => c.id === columnId);

      if (column) {
        column.card = column.card.filter((c) => c.id !== cardId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Boards
      .addCase(fetchBoards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.boards = action.payload;
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      //  Fetch Board By Id
      .addCase(fetchBoardById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBoardById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBoard = action.payload;
      })
      .addCase(fetchBoardById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      //  Create Board
      .addCase(createBoard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.boards.push(action.payload as unknown as boardTypes.BoardSummary);
      })
      .addCase(createBoard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Delete Board
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.boards = state.boards.filter((b) => b.id !== action.payload);
      })

      // column create
      .addCase(columnThunks.createColumn.fulfilled, (state, action) => {
        if (state.currentBoard) {
          // YENİ: Kolon state'de zaten var mı diye kontrol et (Socket daha önce eklemiş olabilir)
          const exists = state.currentBoard.columns.find(
            (c) => c.id === action.payload.id,
          );

          if (!exists) {
            state.currentBoard.columns.push({
              ...action.payload,
              card: [],
            });
          }
        }
      })
      // column update
      .addCase(columnThunks.updateColumn.fulfilled, (state, action) => {
        if (state.currentBoard) {
          const index = state.currentBoard.columns.findIndex(
            (c) => c.id === action.payload.id,
          );
          if (index !== -1) {
            state.currentBoard.columns[index] = {
              ...state.currentBoard.columns[index],
              ...action.payload,
            };
          }
        }
      })

      // column delete
      .addCase(columnThunks.deleteColumn.fulfilled, (state, action) => {
        if (state.currentBoard) {
          state.currentBoard.columns = state.currentBoard.columns.filter(
            (c) => c.id !== action.payload,
          );
        }
      })

      // card create
      .addCase(cardThunks.createCard.fulfilled, (state, action) => {
        if (state.currentBoard) {
          const { card, columnId } = action.payload;
          const column = state.currentBoard.columns.find(
            (c) => c.id === columnId,
          );
          if (column) {
            column.card.push(card);
          }
        }
      })

      // card update
      .addCase(cardThunks.updateCard.fulfilled, (state, action) => {
        if (state.currentBoard) {
          const { card, columnId } = action.payload;
          const column = state.currentBoard.columns.find(
            (c) => c.id === columnId,
          );
          if (column) {
            const cardIndex = column.card.findIndex((c) => c.id === card.id);
            if (cardIndex !== -1) {
              column.card[cardIndex] = { ...column.card[cardIndex], ...card };
            }
          }
        }
      })

      // card delete
      .addCase(cardThunks.deleteCard.fulfilled, (state, action) => {
        if (state.currentBoard) {
          const { cardId, columnId } = action.payload;
          const column = state.currentBoard.columns.find(
            (c) => c.id === columnId,
          );
          if (column) {
            column.card = column.card.filter((c) => c.id !== cardId);
          }
        }
      })

      // card move
      .addCase(cardThunks.moveCard.pending, (state, action) => {
        if (state.currentBoard) {
          const { cardId, fromColumnId, toColumnId, newOrder } = action.meta
            .arg as {
            cardId: string;
            fromColumnId: string;
            toColumnId: string;
            newOrder: number;
          };

          const sourceCol = state.currentBoard.columns.find(
            (c) => c.id === fromColumnId,
          );
          const destCol = state.currentBoard.columns.find(
            (c) => c.id === toColumnId,
          );

          if (sourceCol && destCol) {
            const cardToMove = sourceCol.card.find((c) => c.id === cardId);

            if (cardToMove) {
              sourceCol.card = sourceCol.card.filter((c) => c.id !== cardId);
              destCol.card.splice(newOrder, 0, cardToMove);
            }
          }
        }
      })

      .addCase(cardThunks.moveCard.rejected, (state, action) => {
        console.error("Kart taşıma reddedildi:", action.payload);
        state.error = "sync_error";
      })

      // comment create
      .addCase(commentThunks.createComment.fulfilled, (state, action) => {
        const { comment, cardId, columnId } = action.payload;

        const card = state.currentBoard?.columns
          .find((c) => c.id === columnId)
          ?.card.find((c) => c.id === cardId);

        if (card) {
          card.comments = card.comments || [];
          card.comments.push(comment);
        }
      })

      // comment update
      .addCase(commentThunks.updateComment.fulfilled, (state, action) => {
        const { comment, cardId, columnId } = action.payload;

        const card = state.currentBoard?.columns
          .find((c) => c.id === columnId)
          ?.card.find((c) => c.id === cardId);

        if (card && card.comments) {
          const commentIndex = card.comments.findIndex(
            (c) => c.id === comment.id,
          );

          if (commentIndex !== -1) {
            card.comments[commentIndex] = {
              ...card.comments[commentIndex],
              ...comment,
            };
          }
        }
      })

      // comment delete
      .addCase(commentThunks.deleteComment.fulfilled, (state, action) => {
        const { commentId, cardId, columnId } = action.payload;

        const card = state.currentBoard?.columns
          .find((c) => c.id === columnId)
          ?.card.find((c) => c.id === cardId);

        if (card && card.comments) {
          card.comments = card.comments.filter((c) => c.id !== commentId);
        }
      })

      // fetch Board Logs
      .addCase(fetchBoardLogs.fulfilled, (state, action) => {
        state.logs = action.payload;
      })

      // Add Member
      .addCase(addBoardMember.fulfilled, (state, action) => {
        if (state.currentBoard) {
          // Backend'den dönen yeni üyeyi (role ve user bilgisiyle) listeye ekle
          state.currentBoard.members.push(action.payload);
        }
      })
      // Remove Member
      .addCase(removeBoardMember.fulfilled, (state, action) => {
        if (state.currentBoard) {
          // Gelen memberId'yi kullanarak üyeyi listeden filtrele
          state.currentBoard.members = state.currentBoard.members.filter(
            (m) => m.user.id !== action.payload,
          );
        }
      });
  },
});

export const {
  clearCurrentBoard,
  clearBoardErrors,
  moveCardSocket,
  createColumnSocket,
  deleteColumnSocket,
  createCardSocket,
  deleteCardSocket,
} = boardSlice.actions;
export default boardSlice.reducer;
