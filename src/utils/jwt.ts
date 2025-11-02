// JWT 유틸리티 함수
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRole } from '../types';

export interface JwtPayload {
  userId: string;
  employeeId: string;
  role: UserRole;
}

/**
 * JWT 토큰 생성
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * JWT 토큰 검증
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Authorization 헤더에서 토큰 추출
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};
