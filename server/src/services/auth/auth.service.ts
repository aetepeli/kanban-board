import { prisma } from '../../config/db';
import passwordUtils from 'utils/hashUtils';
import tokenUtils from 'utils/generateToken';
import { API_CODES } from 'utils/constants';
import APIError from 'utils/apiErrors';
import * as authTypes from './auth.type';
import jwt from 'jsonwebtoken';

import QRCode from 'qrcode';
import { activityLogger } from 'utils/activityHandler';
import redisClient from 'utils/redisUtils';
import emailUtils from 'utils/emailUtils';
import { tfaUtils } from 'utils/tfaUtils';

const registerUser = async (params: authTypes.RegisterParams) => {
  const { fullName, email, password } = params;

  // User Exists Checking
  const userExists = await prisma.user.findFirst({
    where: { email },
  });

  if (userExists) {
    throw new APIError(API_CODES.CONFLICT, 'This email already exists');
  }

  // Hash Password
  const hashedPassword = await passwordUtils.hashPassword({ password });

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  });

  const otpCode = tokenUtils.generate6digitcodes();
  const magicToken = tokenUtils.generateMagicToken();

  const redisPayload = {
    otpCode,
    magicToken,
    attempts: 0,
  };

  await redisClient.set(`verify_email:${user.email}`, JSON.stringify(redisPayload), 'EX', 900);

  const verificationLink = `${process.env.API_URL}/api/v1/auth/verify-email?email=${user.email}&token=${magicToken}`;

  await emailUtils.sendEmail({
    to: user.email, // resendVerificationEmail içindeyse sadece `email` olabilir, dikkat et
    subject: 'Email Verification - Architect Kanban',
    html: `
    <div style="background-color: #0c0e11; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #e0e6f1;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #161a1f; padding: 40px; border-radius: 8px; border: 1px solid #2a2d32; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">

        <div style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #c6d4f7; text-transform: uppercase; margin-bottom: 8px;">
          Architect Kanban
        </div>
        <div style="color: #a39ba9; font-size: 13px; margin-bottom: 32px;">
          The Digital Atelier
        </div>

        <h2 style="font-size: 20px; font-weight: bold; color: #e0e6f1; margin-bottom: 16px; margin-top: 0;">
          Verify your email address
        </h2>
        <p style="color: #a5abb6; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
          Thank you for joining the workspace. Please confirm your email address to access your architectural vision.
        </p>

        <a href="${verificationLink}" style="display: inline-block; padding: 16px 36px; background-color: #c6d4f7; color: #0c0e11; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; margin-bottom: 32px;">
          Verify Email
        </a>

        <div style="color: #a5abb6; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 32px; border-top: 1px solid #2a2d32; border-bottom: 1px solid #2a2d32; padding: 12px 0;">
          Or use verification code
        </div>

        <div style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 12px; background-color: #0c0e11; color: #e0e6f1; padding: 16px 16px 16px 28px; border-radius: 4px; border: 1px solid #2a2d32; margin-bottom: 16px;">
          ${otpCode}
        </div>

        <p style="color: #424851; font-size: 12px; margin-top: 32px;">
          If you didn't request this email, there's nothing to worry about — you can safely ignore it.
        </p>
        
      </div>
    </div>
    `,
  });

  const token = tokenUtils.generateAccessToken({ userId: user.id });

  return { user, token };
};

const loginUser = async (params: authTypes.LoginParams) => {
  const { email, password } = params;

  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });

  const isPasswordValid = await passwordUtils.verifyPassword({
    password,
    hash: user.password,
  });

  if (!isPasswordValid) {
    throw new APIError(API_CODES.UNAUTHORIZED, 'Invalid email or password!');
  }

  if (user.isTfaEnabled) {
    const tempToken = tokenUtils.generate2FATempToken({
      isTemp: true,
      userId: user.id,
    });

    return {
      require2FA: true,
      tempToken,
      message: '2FA verification required',
    };
  }

  const accessToken = tokenUtils.generateAccessToken({ userId: user.id });
  const refreshToken = tokenUtils.generateRefreshToken({ userId: user.id });

  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, accessToken, refreshToken };
};

const checkEmailVerified = async (email: string) => {
  const user = await prisma.user.findFirst({ where: { email } });
  return { isEmailVerified: user?.isEmailVerified ?? false };
};

const refreshAuthToken = async (params: { refreshToken: string }) => {
  const { refreshToken } = params;

  if (!refreshToken) {
    throw new APIError(API_CODES.BAD_REQUEST, 'Refresh token is required');
  }

  const decoded = tokenUtils.verifyToken(refreshToken) as { userId: string };

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: decoded.userId },
  });

  const newAccessToken = tokenUtils.generateAccessToken({ userId: user.id });
  const newRefreshToken = tokenUtils.generateRefreshToken({ userId: user.id });

  await activityLogger.logUser({
    userId: user.id,
    action: 'TOKEN_REFRESHED',
    details: 'User refreshed their authentication tokens.',
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const verifyEmail = async (params: authTypes.emailVerifyParams) => {
  const { email, code, token } = params;
  console.log('verifyEmail called:', { email, code, token }); // ekle

  if (!email) {
    throw new Error('Email is required');
  }

  if (!code && !token) {
    throw new Error('Verification code or token is required');
  }

  const redisData = await redisClient.get(`verify_email:${email}`);
  console.log('redisData:', redisData); // ekle

  if (!redisData) {
    throw new Error('The verification code could not be found or has expired. Please request a new code.');
  }

  const redisPayload = JSON.parse(redisData);

  if (redisPayload.attempts >= 3) {
    await redisClient.del(`verify_email:${email}`);
    throw new Error(
      'You have made too many unsuccessful attempts. For security reasons, please request a new confirmation email.'
    );
  }

  let isValid = false;

  if (code && code === redisPayload.otpCode) {
    isValid = true;
  } else if (token && token === redisPayload.magicToken) {
    isValid = true;
  }

  if (!isValid) {
    redisPayload.attempts += 1;

    const remainingTime = await redisClient.ttl(`verify_email:${email}`);
    if (remainingTime > 0) {
      await redisClient.set(`verify_email:${email}`, JSON.stringify(redisPayload), 'EX', remainingTime);
    }

    throw new Error(`Incorrect code or invalid link. Your remaining attempts: ${3 - redisPayload.attempts}`);
  }

  await prisma.user.update({
    where: { email },
    data: { isEmailVerified: true },
  });

  await redisClient.del(`verify_email:${email}`);

  return { message: 'Your account has been successfully verified!' };
};

const resendVerificationEmail = async (params: authTypes.resendVerifyEmailParams) => {
  const { email } = params;

  const VERIFY_EMAIL_TTL = 900;
  const RESEND_COOLDOWN = 90;

  const user = await prisma.user.findFirstOrThrow({
    where: { email },
  });

  if (user.isEmailVerified) {
    throw new APIError(API_CODES.CONFLICT, 'this email is already verified');
  }

  const existingData = await redisClient.get(`verify_email:${email}`);

  if (existingData) {
    const ttl = await redisClient.ttl(`verify_email:${email}`);

    const sentAgo = VERIFY_EMAIL_TTL - ttl;

    if (sentAgo < RESEND_COOLDOWN) {
      throw new APIError(
        API_CODES.TOO_MANY_REQUEST,
        `Please wait ${RESEND_COOLDOWN - sentAgo} seconds before requeting again.`
      );
    }
  }

  const otpCode = tokenUtils.generate6digitcodes();
  const magictoken = tokenUtils.generateMagicToken();

  const redisPayload = {
    otpCode,
    magictoken,
    attempts: 0,
    sentAt: Date.now(),
  };

  await redisClient.set(`verify_email:${email}`, JSON.stringify(redisPayload), 'EX', VERIFY_EMAIL_TTL);

  const verificationLink = `${process.env.API_URL}/api/v1/auth/verify-email?email=${email}&token=${magictoken}`;

  await emailUtils.sendEmail({
    to: user.email, // resendVerificationEmail içindeyse sadece `email` olabilir, dikkat et
    subject: 'Email Verification - Architect Kanban',
    html: `
    <div style="background-color: #0c0e11; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #e0e6f1;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #161a1f; padding: 40px; border-radius: 8px; border: 1px solid #2a2d32; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">

        <div style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #c6d4f7; text-transform: uppercase; margin-bottom: 8px;">
          Architect Kanban
        </div>
        <div style="color: #a39ba9; font-size: 13px; margin-bottom: 32px;">
          The Digital Atelier
        </div>

        <h2 style="font-size: 20px; font-weight: bold; color: #e0e6f1; margin-bottom: 16px; margin-top: 0;">
          Verify your email address
        </h2>
        <p style="color: #a5abb6; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
          Thank you for joining the workspace. Please confirm your email address to access your architectural vision.
        </p>

        <a href="${verificationLink}" style="display: inline-block; padding: 16px 36px; background-color: #c6d4f7; color: #0c0e11; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; margin-bottom: 32px;">
          Verify Email
        </a>

        <div style="color: #a5abb6; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 32px; border-top: 1px solid #2a2d32; border-bottom: 1px solid #2a2d32; padding: 12px 0;">
          Or use verification code
        </div>

        <div style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 12px; background-color: #0c0e11; color: #e0e6f1; padding: 16px 16px 16px 28px; border-radius: 4px; border: 1px solid #2a2d32; margin-bottom: 16px;">
          ${otpCode}
        </div>

        <p style="color: #424851; font-size: 12px; margin-top: 32px;">
          If you didn't request this email, there's nothing to worry about — you can safely ignore it.
        </p>
        
      </div>
    </div>
    `,
  });

  return { message: 'Verification email has been resent successfully.' };
};

const forgotPassword = async (params: authTypes.forgotPasswordParams) => {
  const { email } = params;

  const RESET_TTL = 600;
  const RESEND_COOLDOWN = 120;

  const user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    return { message: 'If this email exists, a reset link has been sent.' };
  }

  const existingData = await redisClient.get(`reset_password:${email}`);

  if (existingData) {
    const ttl = await redisClient.ttl(`reset_password:${email}`);
    const sentAgo = RESET_TTL - ttl;

    if (sentAgo < RESEND_COOLDOWN) {
      throw new APIError(
        API_CODES.TOO_MANY_REQUEST,
        `Please wait ${RESEND_COOLDOWN - sentAgo} seconds before requesting again.`
      );
    }
  }

  const otpCode = tokenUtils.generate6digitcodes();

  const redisPayload = {
    otpCode,
    attempts: 0,
    sentAt: Date.now(),
  };

  await redisClient.set(`reset_password:${email}`, JSON.stringify(redisPayload), 'EX', RESET_TTL);

  await emailUtils.sendEmail({
    to: email,
    subject: 'Password Reset',
    html: `
      <div style="text-align:center; font-size:32px; font-weight:bold; letter-spacing:8px; background:#f0f0f0; padding:16px; border-radius:8px;">
          ${otpCode}
      </div>`,
  });

  return { message: 'If this email exists, a reset link has been sent.' };
};

const resetPassword = async (params: authTypes.resetPasswordParams) => {
  const { email, code, newPassword } = params;

  if (!email) {
    throw new APIError(API_CODES.BAD_REQUEST, 'Email is required.');
  }

  if (!code) {
    throw new APIError(API_CODES.BAD_REQUEST, 'Reset code or token is required.');
  }

  const redisData = await redisClient.get(`reset_password:${email}`);

  if (!redisData) {
    throw new APIError(API_CODES.BAD_REQUEST, 'Reset code has expired or not found. Please request a new one.');
  }

  const redisPayload = JSON.parse(redisData);

  if (redisPayload.attempts >= 3) {
    await redisClient.del(`reset_password:${email}`);
    throw new APIError(
      API_CODES.TOO_MANY_REQUEST,
      "'Too many unsuccessful attempts. Please request a new password reset.'"
    );
  }

  let isValid = false;

  if (code && code === redisPayload.otpCode) {
    isValid = true;
  }

  if (!isValid) {
    redisPayload.attempts += 1;

    const remainingTime = await redisClient.ttl(`reset_password:${email}`);
    if (remainingTime > 0) {
      await redisClient.set(`reset_password:${email}`, JSON.stringify(redisPayload), 'EX', remainingTime);
    }

    throw new APIError(
      API_CODES.BAD_REQUEST,
      `Incorrect code or invalid link. Your remaining attempts: ${3 - redisPayload.attempts}`
    );
  }

  const hashedPassword = await passwordUtils.hashPassword({ password: newPassword });

  const user = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
    },
  });

  await redisClient.del(`reset_password:${email}`);

  await activityLogger.logUser({
    userId: user.id,
    action: 'PASSWORD_RESET',
    details: 'User has reset their password.',
  });

  return { message: 'Your password has been successfully reset.' };
};

const generate2FASecret = async (params: authTypes.generate2FAParams) => {
  const { email, userId } = params;

  const secret = tfaUtils.generateSecret();

  const otpAuthUrl = tfaUtils.generateURI({
    secret: secret,
    label: email,
    issuer: 'taskFlow',
  });

  const qrCode = await QRCode.toDataURL(otpAuthUrl);

  await prisma.user.update({
    where: { id: userId },
    data: {
      tfaSecret: secret,
    },
  });

  return { qrCode };
};

const verify2FA = async (params: authTypes.verify2FAParams) => {
  const { userId, token } = params;

  if (!token) {
    throw new Error('Please enter the 6-digit code.');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tfaSecret: true,
      isTfaEnabled: true,
    },
  });

  if (!user || !user.tfaSecret) {
    throw new Error('2FA setup not found. Please generate the QR code first.');
  }

  if (user.isTfaEnabled) {
    throw new Error('ALREADY_ACTIVE');
  }

  const result = await tfaUtils.verify({
    token,
    secret: user.tfaSecret,
    window: 1,
  });

  if (!result.valid) {
    throw new Error('Invalid code');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isTfaEnabled: true,
    },
  });

  await activityLogger.logUser({
    userId,
    action: '2FA_ENABLED',
    details: 'The user has activated 2fa.',
  });

  return true;
};

const verifyLogin2FA = async (params: authTypes.verifyLogin2FAParams) => {
  const { tempToken, code } = params;

  if (!tempToken || !code) {
    throw new APIError(API_CODES.BAD_REQUEST, 'A temporary token and a 6-digit code are required.');
  }

  const decoded = jwt.verify(tempToken, process.env.JWT_2FA_SECRET as string) as { userId: string; isTemp: boolean };

  if (!decoded.isTemp) throw new Error('Invalid token');

  const user = await prisma.user.findUniqueOrThrow({ where: { id: decoded.userId } });
  if (!user.tfaSecret || !user.isTfaEnabled) {
    throw new Error('No user or active 2FA was found');
  }

  const isValid = tfaUtils.verify({ token: code, secret: user.tfaSecret });
  if (!isValid) throw new Error('Invalid 2FA code');

  const accessToken = tokenUtils.generateAccessToken({ userId: user.id });
  const refreshToken = tokenUtils.generateRefreshToken({ userId: user.id });

  const { password: _, ...userWithoutPassword } = user;

  await activityLogger.logUser({
    userId: decoded.userId,
    action: '2FA_VERIFY_LOGIN',
    details: '2FA login has been enabled.',
  });

  return { user: userWithoutPassword, accessToken, refreshToken };
};

const disable2FA = async (params: authTypes.disable2FAParams) => {
  const { userId, code } = params;

  if (!code) {
    throw new APIError(API_CODES.BAD_REQUEST, 'A 6-digit code is required to confirm the transaction.');
  }

  const user = await prisma.user.findFirstOrThrow({ where: { id: userId } });

  if (!user.isTfaEnabled || !user.tfaSecret) {
    throw new APIError(API_CODES.BAD_REQUEST, '2FA is already disabled');
  }

  const isValid = tfaUtils.verify({ token: code, secret: user.tfaSecret });
  if (!(await isValid).valid) {
    throw new APIError(API_CODES.UNAUTHORIZED, 'Invalid code!, 2FA could not be disabled');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isTfaEnabled: false,
      tfaSecret: null,
    },
  });

  await activityLogger.logUser({
    userId,
    action: '2FA_DISABLED',
    details: 'The user has disabled 2fa.',
  });

  return true;
};

const changePassword = async (params: authTypes.changePasswordParams) => {
  const { userId, currentPassword, newPassword } = params;

  if (currentPassword === newPassword) {
    throw new APIError(API_CODES.BAD_REQUEST, 'New password cannot be the same as the current password.');
  }
  // 1. Kullanıcıyı bul
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  // 2. Mevcut şifrenin doğruluğunu kontrol et
  const isMatch = await passwordUtils.verifyPassword({
    password: currentPassword,
    hash: user.password,
  });

  if (!isMatch) {
    throw new APIError(API_CODES.BAD_REQUEST, 'Current password is incorrect.');
  }

  // 3. Yeni şifreyi hashle
  const hashedNewPassword = await passwordUtils.hashPassword({ password: newPassword });

  // 4. Veritabanını güncelle
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  await activityLogger.logUser({
    userId,
    action: 'PASSWORD_CHANGED',
    details: 'User has successfully changed their password.',
  });

  return true;
};

const getUserActivityLogs = async (userId: string) => {
  const logs = await prisma.userActivityLog.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  return logs;
};

const auths = {
  registerUser,
  loginUser,
  checkEmailVerified,
  refreshAuthToken,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  generate2FASecret,
  verify2FA,
  verifyLogin2FA,
  disable2FA,
  changePassword,
  getUserActivityLogs,
};

export default auths;
