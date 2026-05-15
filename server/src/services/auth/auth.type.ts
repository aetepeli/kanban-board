export interface RegisterParams {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface generate2FAParams {
  userId: string;
  email: string;
}

export interface verify2FAParams {
  userId: string;
  token: string;
}

export interface verifyLogin2FAParams {
  tempToken: string;
  code: string;
}

export interface disable2FAParams {
  userId: string;
  code: string;
}

export interface emailVerifyParams {
  email: string;
  code?: string;
  token?: string;
}

export interface resendVerifyEmailParams {
  email: string;
}

export interface forgotPasswordParams {
  email: string;
}

export interface resetPasswordParams {
  email: string;
  code?: string;
  token?: string;
  newPassword: string;
}

export interface changePasswordParams {
  userId: string;
  currentPassword: string;
  newPassword: string;
}
