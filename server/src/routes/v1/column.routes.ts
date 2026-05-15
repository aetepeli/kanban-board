import express from 'express';
const router = express.Router({ mergeParams: true });
import columnCont from 'controllers/column.controller';
import validate from 'middlewares/joi.middleware';
import { columnSchema } from 'validators/column.schema';

router.post('/', validate({ schema: columnSchema }), columnCont.createColumn);
router.patch('/:columnId', validate({ schema: columnSchema }), columnCont.updateColumn);
router.delete('/:columnId', columnCont.deleteColumn);

export default router;
