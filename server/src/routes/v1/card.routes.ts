import express from 'express';
const router = express.Router({ mergeParams: true });
import cardCont from 'controllers/card.controller';
import validate from 'middlewares/joi.middleware';
import { cardSchema } from 'validators/card.schema';

router.post('/', validate({ schema: cardSchema }), cardCont.createCard);
router.patch('/:cardId', validate({ schema: cardSchema }), cardCont.updateCard);
router.delete('/:cardId', cardCont.deleteCard);
router.patch('/:cardId/move', cardCont.moveCard);
router.get('/:cardId', cardCont.getCardById);

export default router;
