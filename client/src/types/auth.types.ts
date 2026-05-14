export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  isEmailVerified: boolean;
  isTfaEnabled: boolean;
};

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
};

export type LoginParams = {
  email: string;
  password: string;
};

export type RegisterParams = {
  fullName: string;
  email: string;
  password: string;
};

export type UserActivityLog = {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: AuthUser;
};

export type LoginResponse =
  | {
      require2FA: false;
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
    }
  | {
      require2FA: true;
      tempToken: string;
    };

export type RegisterResponse = {
  user: AuthUser;
  token: string;
};
