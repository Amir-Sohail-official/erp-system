import { errorResponse } from '../utils/apiResponse.js';

export class AppError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const notFoundHandler = (req, res, next) => {
  const message = `Route not found: ${req.method} ${req.originalUrl}`;
  next(new AppError(404, message));
};

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode ?? 500;
  const message = statusCode >= 500 ? 'Internal server error' : error.message;
  const errors = Array.isArray(error.errors) && error.errors.length > 0 ? error.errors : [message];

  console.error('Unhandled API error:', {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message,
  });

  res.status(statusCode).json(errorResponse(message, errors));
  next();
};
