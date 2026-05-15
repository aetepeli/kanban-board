import express from 'express';
const router = express.Router({ mergeParams: true });
import commentCont from 'controllers/comment.controller';
import validate from 'middlewares/joi.middleware';
import { commentSchema } from 'validators/comment.schema';

router.post('/', validate({ schema: commentSchema }), commentCont.createComment);
router.patch('/:commentId', validate({ schema: commentSchema }), commentCont.updateComment);
router.delete('/:commentId', commentCont.deleteComment);

export default router;
