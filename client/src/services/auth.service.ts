import api from "./api";
import * as authTypes from "../types/auth.types";

const authService = {
  login: async (
    params: authTypes.LoginParams,
  ): Promise<authTypes.LoginResponse> => {
    const { data } = await api.post("/api/v1/auth/login", params);
    return data.data;
  },

  register: async (
    params: authTypes.RegisterParams,
  ): Promise<authTypes.RegisterResponse> => {
    const { data } = await api.post("/api/v1/auth/register", params);
    return data.data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  verifyEmail: async (params: {
    email: string;
    code: string;
  }): Promise<{ message: string }> => {
    const { data } = await api.post("/api/v1/auth/verify-email", params);
    return data.data;
  },

  resendVerificationEmail: async (
    email: string,
  ): Promise<{ message: string }> => {
    const { data } = await api.post("/api/v1/auth/verify-resend", { email });
    return data.data;
  },

  verify2FA: async (params: {
    tempToken: string;
    code: string;
  }): Promise<{
    user: authTypes.AuthUser;
    accessToken: string;
    refreshToken: string;
  }> => {
    const { data } = await api.post("/api/v1/auth/login/verify-2fa", params);
    return data.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post("/api/v1/auth/forgot-password", { email });
    return data.data;
  },

  resetPassword: async (params: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const { data } = await api.post("/api/v1/auth/reset-password", params);
    return data.data;
  },

  changePassword: async (params: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const { data } = await api.post("/api/v1/auth/change-password", params);
    return data;
  },

  getUserLogs: async (): Promise<authTypes.UserActivityLog[]> => {
    const response = await api.get(`api/v1/auth/user-logs`);

    console.log("1. SERVİSE GELEN VERİ:", response);

    return response.data.data;
  },

  generate2FA: async (params: {
    email: string;
    userId: string;
  }): Promise<{ qrCode: string }> => {
    const { data } = await api.post("/api/v1/auth/2fa/generate", params);
    return data.data;
  },

  enable2FA: async (params: {
    token: string;
    userId: string;
  }): Promise<boolean> => {
    const { data } = await api.post("/api/v1/auth/2fa/verify", params);
    return data.success;
  },

  disable2FA: async (code: string): Promise<boolean> => {
    const { data } = await api.post("/api/v1/auth/2fa/disable", { code });
    return data.success;
  },
};

export default authService;
