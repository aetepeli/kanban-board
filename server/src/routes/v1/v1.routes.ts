import express from 'express';
const router = express.Router();
import authRoutes from './auth.routes';
import boardRoutes from './board.routes';
import { authMiddleware } from 'middlewares/auth.middleware';
import columnRoutes from './column.routes';
import cardRoutes from './card.routes';
import commentRoutes from './comment.routes';

router.use('/auth', authRoutes);

router.use(authMiddleware);

router.use('/boards', boardRoutes);
router.use('/boards/:boardId/columns', columnRoutes);
router.use('/columns/:columnId/cards', cardRoutes);
router.use('/cards', cardRoutes);
router.use('/cards/:cardId/comments', commentRoutes);

export default router;
