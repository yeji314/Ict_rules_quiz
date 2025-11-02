// 에러 핸들링 미들웨어
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * 커스텀 에러 클래스
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 에러 핸들러 미들웨어
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 에러 로깅
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // AppError인 경우
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.name,
      message: error.message,
    });
    return;
  }

  // Prisma 에러 처리
  if (error.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      error: 'Database Error',
      message: 'Invalid request to database',
    });
    return;
  }

  // 기타 에러
  res.status(500).json({
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'Something went wrong',
  });
};

/**
 * 404 Not Found 핸들러
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.path} not found`,
  });
};
