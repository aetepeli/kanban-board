import { Priority } from '@prisma/client';
import Joi from 'joi';

export const cardSchema = Joi.object({
  title: Joi.string().required().min(1).max(100).messages({
    'string.base': 'Title must be a string',
    'string.empty': 'Title cannot be empty',
    'any.required': 'Title is required',
  }),
  // DÜZELTME: Content (Açıklama) artık boş bırakılabilir veya hiç gönderilmeyebilir
  content: Joi.string().allow('', null).max(500).optional().messages({
    'string.max': 'Content cannot be longer than 500 characters',
  }),
  boardId: Joi.string().required().messages({
    'any.required': 'Board ID is required',
  }),
  priority: Joi.string()
    .valid(...Object.values(Priority))
    .optional()
    .messages({
      'any.only': `Priority must be of: ${Object.values(Priority).join(', ')}`,
    }),
  deadline: Joi.date().iso().optional().messages({
    'date.format': 'Deadline must be a valid ISO date string',
  }),
  assigneeId: Joi.string().allow(null).optional(),
}).unknown(true); // DÜZELTME: Tanımlı olmayan alanlar (columnId vb.) gelirse hata verme, görmezden gel!
