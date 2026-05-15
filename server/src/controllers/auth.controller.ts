import { NextFunction, Request, Response } from 'express';
import auths from 'services/auth/auth.service';
import resLogger from 'utils/errorHandler';

const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body;

    const { user, token } = await auths.registerUser({
      fullName,
      email,
      password,
    });

    return resLogger.reply(
      res,
      {
        code: 201,
        success: true,
        message: 'User registered successfully.',
      },
      { user, token }
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await auths.loginUser({
      email,
      password,
    });

    if (result.require2FA) {
      return resLogger.reply(
        res,
        {
          code: 200,
          success: true,
          message: result.message,
        },
        {
          require2FA: result.require2FA,
          tempToken: result.tempToken,
        }
      );
    }

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'User logged in successfully.',
      },
      { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const verifyEmail = async (req: Request, res: Response) => {
  try {
    const email = (req.query.email || req.body?.email) as string;
    const code = (req.query.code || req.body?.code) as string;
    const token = (req.query.token || req.body?.token) as string;

    const result = await auths.verifyEmail({
      email,
      code,
      token,
    });
    if (req.method === 'GET') {
      return res.send(`
        <html><body>
          <script>
            window.opener && window.opener.focus();
            window.close();
          </script>
          <p>Doğrulandı!</p>
        </body></html>
      `);
    }

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: result.message,
      },
      result
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const checkVerified = async (req: Request, res: Response) => {
  try {
    const email = (req.query.email || req.body?.email) as string;
    const result = await auths.checkEmailVerified(email);
    return resLogger.reply(res, { code: 200, success: true, message: 'ok' }, result);
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const refreshAuthToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    const tokens = await auths.refreshAuthToken({ refreshToken });

    resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Tokens refreshed successfuly',
      },
      tokens
    );
  } catch (error) {
    next(error);
  }
};

const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await auths.resendVerificationEmail({
      email,
    });

    resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Verification email is resend.',
      },
      result
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await auths.forgotPassword({ email });

    resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Password change successfully',
      },
      result
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const resetPassword = async (req: Request, res: Response) => {
  try {
    const email = (req.query.email || req.body?.email) as string;
    const code = (req.query.code || req.body?.code) as string;
    const token = (req.query.token || req.body?.token) as string;
    const { newPassword } = req.body;

    const result = await auths.resetPassword({ email, code, token, newPassword });

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Password change successfully',
      },
      result
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const generate2FA = async (req: Request, res: Response) => {
  try {
    const { email, userId } = req.body;

    const result = await auths.generate2FASecret({
      email,
      userId,
    });

    resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: '2FA qrCode is creaetd successfully',
      },
      result
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const verify2FA = async (req: Request, res: Response) => {
  try {
    const userPayload = req.user as { id?: string; userId?: string } | undefined;

    const userId = userPayload?.id || userPayload?.userId || req.body.userId;
    const { token } = req.body;

    await auths.verify2FA({ token, userId });

    return resLogger.reply(res, {
      code: 200,
      success: true,
      message: '2FA successfully',
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'ALREADY_ACTIVE') {
        return resLogger.reply(res, {
          code: 409,
          success: false,
          message: '2FA is already active.',
        });
      }

      return resLogger.catchError(res, error);
    }

    return resLogger.catchError(res, new Error('Unknown Error'));
  }
};

const verifyLogin2FA = async (req: Request, res: Response) => {
  try {
    const { tempToken, code } = req.body;

    const data = await auths.verifyLogin2FA({ tempToken, code });

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Login successfully',
      },
      data
    );
  } catch (error) {
    return resLogger.catchError(res, error);
  }
};

const disable2FA = async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    const userId = user?.id;

    const { code } = req.body;

    await auths.disable2FA({ userId: userId!, code });

    return resLogger.reply(res, {
      code: 200,
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error) {
    return resLogger.catchError(res, error);
  }
};

const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { currentPassword, newPassword } = req.body;

    await auths.changePassword({ userId, currentPassword, newPassword });

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'Password changed successfully',
      },
      null
    );
  } catch (error) {
    resLogger.catchError(res, error);
  }
};

const getUserLogs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;

    const logs = await auths.getUserActivityLogs(userId);

    return resLogger.reply(
      res,
      {
        code: 200,
        success: true,
        message: 'User activity logs successfully retrieved.',
      },
      logs
    );
  } catch (error) {
    return resLogger.catchError(res, error);
  }
};

const authsCont = {
  register,
  login,
  checkVerified,
  refreshAuthToken,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  generate2FA,
  verify2FA,
  verifyLogin2FA,
  disable2FA,
  changePassword,
  getUserLogs,
};

export default authsCont;
