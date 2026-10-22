import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Handle Zod schema validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  }
  // Handle invalid Mongoose ObjectId
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid format for field: ${err.path}`;
    details = { value: err.value };
  }
  // Handle Mongoose Validation Error
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Database validation error';
    details = Object.values(err.errors).map((e) => e.message);
  }
  // Handle JSON parse error (e.g. malformed JSON in request body)
  else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`[Server Error] ${message}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  } else {
    logger.warn(`[Client Error] ${message} - ${req.method} ${req.originalUrl}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(config.nodeEnv === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}
