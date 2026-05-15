import Joi from 'joi';

export const commentSchema = Joi.object({
  content: Joi.string().required().min(3).max(500).messages({
    'string.base': 'Content must be a string',
    'string.empty': 'Content cannot be empty',
    'string.min': 'Content must be at least 3 characters long',
    'string.max': 'Content cannot exceed 500 characters',
    'any.required': 'Content is required',
  }),
});
