// 인증 미들웨어
import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JwtPayload } from '../utils/jwt';
import { UserRole } from '../types';

// Express Request에 user 정보 추가
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT 토큰 검증 미들웨어
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
      return;
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Invalid token',
    });
  }
};

/**
 * 관리자 권한 확인 미들웨어
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
    return;
  }

  next();
};
