import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import * as authTypes from "../../types/auth.types";
import authService from "../../services/auth.service";

export interface ExtendedAuthState extends authTypes.AuthState {
  isLoading: boolean;
  error: string | null;
  requires2FA: boolean;
  tempToken: string | null;
  userLogs: authTypes.UserActivityLog[];
}

const initialAccessToken = localStorage.getItem("accessToken");
const initialRefreshToken = localStorage.getItem("refreshToken");

const initialUser = localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user") as string)
  : null;

const initialState: ExtendedAuthState = {
  user: initialUser,
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: !!initialAccessToken,
  isLoading: false,
  error: null,
  requires2FA: false,
  tempToken: null,
  userLogs: [],
};

const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || "Bir hata oluştu.";
  }
  return "Bilinmeyen bir hata oluştu.";
};

export const registerUser = createAsyncThunk(
  "auth/register",
  async (params: authTypes.RegisterParams, { rejectWithValue }) => {
    try {
      const response = await authService.register(params);
      return response;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Kayıt işlemi başarısız oldu.",
        );
      }
      return rejectWithValue("Bilinmeyen bir hata oluştu.");
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (params: authTypes.LoginParams, { rejectWithValue }) => {
    try {
      const response = await authService.login(params);
      return response;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Giriş başarısız oldu.",
        );
      }
      return rejectWithValue("Bilinmeyen bir hata oluştu.");
    }
  },
);

export const verifyEmailUser = createAsyncThunk(
  "auth/verifyEmail",
  async (params: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await authService.verifyEmail(params);
      return response;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Doğrulama başarısız oldu.",
        );
      }
      return rejectWithValue("Bilinmeyen bir hata oluştu.");
    }
  },
);

export const resendVerification = createAsyncThunk(
  "auth/resendVerification",
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authService.resendVerificationEmail(email);
      return response;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "E-posta gönderilemedi.",
        );
      }
      return rejectWithValue("Bilinmeyen bir hata oluştu.");
    }
  },
);

export const verify2FAUser = createAsyncThunk(
  "auth/verify2FA",
  async (params: { tempToken: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await authService.verify2FA(params);
      return response;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Doğrulama kodu hatalı.",
        );
      }
      return rejectWithValue("Doğrulama sırasında bir hata oluştu.");
    }
  },
);

export const fetchUserLogs = createAsyncThunk(
  "auth/fetchUserLogs",
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getUserLogs();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const generate2FA = createAsyncThunk(
  "auth/generate2FA",
  async (params: { email: string; userId: string }, { rejectWithValue }) => {
    try {
      return await authService.generate2FA(params);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const enable2FA = createAsyncThunk(
  "auth/enable2FA",
  async (params: { code: string; userId: string }, { rejectWithValue }) => {
    try {
      await authService.enable2FA({
        token: params.code,
        userId: params.userId,
      });
      return true;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const disable2FA = createAsyncThunk(
  "auth/disable2FA",
  async (code: string, { rejectWithValue }) => {
    try {
      await authService.disable2FA(code);
      return false;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const forgotPasswordUser = createAsyncThunk(
  "auth/forgotPassword",
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(email);
      return response;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            "Şifre sıfırlama maili gönderilemedi.",
        );
      }
      return rejectWithValue("Bilinmeyen bir hata oluştu.");
    }
  },
);

export const resetPasswordUser = createAsyncThunk(
  "auth/resetPassword",
  async (
    params: { email: string; code: string; newPassword: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await authService.resetPassword(params);
      return response;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Şifre sıfırlama başarısız oldu.",
        );
      }
      return rejectWithValue("Bilinmeyen bir hata oluştu.");
    }
  },
);

export const changePasswordUser = createAsyncThunk(
  "auth/changePassword",
  async (
    params: { currentPassword: string; newPassword: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await authService.changePassword(params);
      return response;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Şifre değiştirme başarısız oldu.",
        );
      }
      return rejectWithValue("Bilinmeyen bir hata oluştu.");
    }
  },
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{
        user: authTypes.AuthUser;
        accessToken: string;
        refreshToken: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.error = null;
      state.requires2FA = false;
      state.tempToken = null;

      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },

    setTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;

      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
    },

    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.requires2FA = false;
      state.tempToken = null;

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;

        if ("tempToken" in action.payload) {
          state.requires2FA = true;
          state.tempToken = action.payload.tempToken;
          state.isAuthenticated = false;
        } else {
          state.requires2FA = false;
          state.tempToken = null;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;

          if (action.payload.accessToken && action.payload.refreshToken) {
            localStorage.setItem("accessToken", action.payload.accessToken);
            localStorage.setItem("refreshToken", action.payload.refreshToken);
            localStorage.setItem("user", JSON.stringify(action.payload.user));
          }
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })

      .addCase(verify2FAUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verify2FAUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.requires2FA = false;
        state.tempToken = null;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;

        if (action.payload.accessToken && action.payload.refreshToken) {
          localStorage.setItem("accessToken", action.payload.accessToken);
          localStorage.setItem("refreshToken", action.payload.refreshToken);
          localStorage.setItem("user", JSON.stringify(action.payload.user));
        }
      })
      .addCase(verify2FAUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userLogs = action.payload;
      })
      .addCase(fetchUserLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as string) || "Kullanıcı aktiviteleri çekilemedi.";
      })

      .addCase(enable2FA.fulfilled, (state) => {
        if (state.user) {
          state.user.isTfaEnabled = true;
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })

      .addCase(disable2FA.fulfilled, (state) => {
        if (state.user) {
          state.user.isTfaEnabled = false;
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      });
  },
});

export const { setAuth, setTokens, clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
