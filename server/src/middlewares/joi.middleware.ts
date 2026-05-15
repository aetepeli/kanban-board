import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

interface ValidationSchema {
  schema: Joi.ObjectSchema;
}

const validate = (options: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = options.schema.validate(req.body, {
      abortEarly: false, // ilk hatada durmaz tüm hataları toplar
      stripUnknown: true, // şemada olmayan gereksiz alanları temizler
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message).join(',');
      res.status(400).json({ error: errorMessages });
      return;
    }

    req.body = value;

    next();
  };
};

export default validate;
