// 인증 컨트롤러
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler';
import { LoginRequest, LoginResponse } from '../types';

/**
 * 로그인
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { employeeId, password } = req.body as LoginRequest;

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { employeeId },
      include: {
        department: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid credentials');
    }

    // 비밀번호 검증
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      employeeId: user.employeeId,
      role: user.role,
    });

    // 비밀번호 제외하고 응답
    const { password: _, ...userWithoutPassword } = user;

    const response: LoginResponse = {
      success: true,
      token,
      user: userWithoutPassword,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * 로그아웃
 * POST /api/auth/logout
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // JWT는 stateless이므로 클라이언트에서 토큰을 삭제하면 됨
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 현재 사용자 정보 조회
 * GET /api/auth/me
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        department: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};
