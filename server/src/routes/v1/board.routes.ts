import express from 'express';
const router = express.Router({ mergeParams: true });
import boardsCont from 'controllers/board.controller';
import validate from 'middlewares/joi.middleware';
import { boardSchema, boardMemberSchema } from 'validators/board.schema';

router.get('/', boardsCont.getBoards);
router.get('/:boardId', boardsCont.getBoard);
router.post('/', validate({ schema: boardSchema }), boardsCont.createBoard);
router.delete('/:boardId', boardsCont.deleteBoard);

router.post('/:boardId/members', validate({ schema: boardMemberSchema }), boardsCont.addMember);
router.delete('/:boardId/members/:memberId', boardsCont.removeMember);

router.get('/:boardId/logs', boardsCont.getBoardLogs);

export default router;
