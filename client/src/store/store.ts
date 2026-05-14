import { configureStore } from "@reduxjs/toolkit";
import authReducer, { setTokens, clearAuth } from "../features/auth/authSlice";
import { initApiAuth } from "../services/api";
import boardReducer from "../features/boards/boardSlice";
import cardReducer from "../features/cards/cardSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    boards: boardReducer,
    cards: cardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

initApiAuth({
  getAccessToken: () => store.getState().auth.accessToken,
  getRefreshToken: () => store.getState().auth.refreshToken,
  setTokens: (accessToken, refreshToken) => {
    store.dispatch(setTokens({ accessToken, refreshToken }));
  },
  clearAuth: () => {
    store.dispatch(clearAuth());
  },
});
