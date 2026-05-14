import { store } from "./store";
import { setAuth } from "../features/auth/authSlice";
import type { AuthState } from "../types/auth.types";

const STORAGE_KEY = "auth-storage";

export const loadAuthFromStorage = (): Partial<AuthState> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveAuthToStorage = (state: AuthState): void => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    );
  } catch {
    /* */
  }
};

export const clearAuthFromStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* */
  }
};

const persisted = loadAuthFromStorage();

if (persisted.accessToken && persisted.user) {
  store.dispatch(
    setAuth({
      user: persisted.user,
      accessToken: persisted.accessToken,
      refreshToken: persisted.refreshToken ?? "",
    }),
  );
}

let previousAuth = store.getState().auth;

store.subscribe(() => {
  const currentAuth = store.getState().auth;

  if (currentAuth === previousAuth) return;

  previousAuth = currentAuth;

  if (currentAuth.isAuthenticated) {
    saveAuthToStorage(currentAuth);
  } else {
    clearAuthFromStorage();
  }
});

export { store };
export type { RootState, AppDispatch } from "./store";
export * from "../features/auth/authSlice";
