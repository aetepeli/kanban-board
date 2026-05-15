import Joi from 'joi';

export const boardSchema = Joi.object({
  title: Joi.string().required().min(3).max(50).messages({
    'string.base': 'Title must be a string',
    'string.empty': 'Title cannot be empty',
    'string.min': 'Title must be at least 3 characters long',
    'string.max': 'Title cannot be longer than 50 characters',
    'string.unique': 'A board with this title already exists',
    'any.required': 'Title is required',
  }),
});
export const boardMemberSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be a string',
    'string.empty': 'Email cannot be empty',
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required',
  }),
});
