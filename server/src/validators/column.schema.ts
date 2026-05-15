import Joi from 'joi';

export const columnSchema = Joi.object({
  title: Joi.string().required().min(1).max(50).messages({
    'string.base': 'Title must be a string',
    'string.empty': 'Title cannot be empty',
    'any.required': 'Title is required',
  }),
}).unknown(true);
