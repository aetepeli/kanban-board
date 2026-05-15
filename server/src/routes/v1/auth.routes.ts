import express from 'express';
const router = express.Router({ mergeParams: true });
import authsCont from 'controllers/auth.controller';
import validate from 'middlewares/joi.middleware';
import authSchemas from 'validators/auth.schema';
import { authMiddleware } from 'middlewares/auth.middleware';

router.post('/register', validate({ schema: authSchemas.registerSchema }), authsCont.register);
router.post('/login', validate({ schema: authSchemas.loginSchema }), authsCont.login);

router.post('/refresh-token', authsCont.refreshAuthToken);

router.get('/verify-email', authsCont.verifyEmail);
router.post('/verify-email', authsCont.verifyEmail);
router.post('/verify-resend', authsCont.resendVerificationEmail);

router.get('/check-verified', authsCont.checkVerified);

router.post('/forgot-password', authsCont.forgotPassword);
router.post('/reset-password', authsCont.resetPassword);

router.post('/login/verify-2fa', authsCont.verifyLogin2FA);

router.post('/2fa/generate', authsCont.generate2FA);
router.post('/2fa/verify', authsCont.verify2FA);
router.post('/2fa/disable', authMiddleware, authsCont.disable2FA);

router.post('/change-password', authMiddleware, authsCont.changePassword);

router.get('/user-logs', authMiddleware, authsCont.getUserLogs);

export default router;
