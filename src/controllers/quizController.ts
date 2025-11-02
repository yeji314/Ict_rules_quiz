// 퀴즈 컨트롤러
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { QuizWithProgress, ButtonStatus } from '../types';

/**
 * 퀴즈 목록 조회 (사용자 진행 상황 포함)
 * GET /api/quizzes
 */
export const getQuizzes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    const userId = req.user.userId;

    // 모든 퀴즈 조회
    const quizzes = await prisma.quiz.findMany({
      include: {
        questions: {
          select: {
            id: true,
            isLuckyDraw: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 각 퀴즈의 진행 상황 조회
    const quizzesWithProgress: QuizWithProgress[] = await Promise.all(
      quizzes.map(async (quiz) => {
        const progress = await prisma.userQuizProgress.findUnique({
          where: {
            userId_quizId: {
              userId,
              quizId: quiz.id,
            },
          },
        });

        // 버튼 상태 결정
        let buttonStatus: ButtonStatus;
        const now = new Date();
        const isExpired = now > quiz.endDate || !quiz.isActive;

        if (isExpired || (progress && progress.isCompleted)) {
          buttonStatus = ButtonStatus.COMPLETED;
        } else if (!progress || progress.currentRound === 0) {
          buttonStatus = ButtonStatus.START;
        } else {
          buttonStatus = ButtonStatus.CONTINUE;
        }

        const totalQuestions = quiz.questions.filter((q) => !q.isLuckyDraw).length;
        const totalLuckyDrawQuestions = quiz.questions.filter((q) => q.isLuckyDraw).length;

        return {
          ...quiz,
          questions: undefined,
          totalQuestions,
          totalLuckyDrawQuestions,
          progress: progress
            ? {
                ...progress,
                buttonStatus,
              }
            : undefined,
        };
      })
    );

    res.status(200).json({
      quizzes: quizzesWithProgress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 퀴즈 상세 조회
 * GET /api/quizzes/:quizId
 */
export const getQuizById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    const { quizId } = req.params;
    const userId = req.user.userId;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          select: {
            id: true,
            isLuckyDraw: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new AppError(404, 'Quiz not found');
    }

    const progress = await prisma.userQuizProgress.findUnique({
      where: {
        userId_quizId: {
          userId,
          quizId: quiz.id,
        },
      },
    });

    // 버튼 상태 결정
    let buttonStatus: ButtonStatus;
    const now = new Date();
    const isExpired = now > quiz.endDate || !quiz.isActive;

    if (isExpired || (progress && progress.isCompleted)) {
      buttonStatus = ButtonStatus.COMPLETED;
    } else if (!progress || progress.currentRound === 0) {
      buttonStatus = ButtonStatus.START;
    } else {
      buttonStatus = ButtonStatus.CONTINUE;
    }

    const totalQuestions = quiz.questions.filter((q) => !q.isLuckyDraw).length;
    const totalLuckyDrawQuestions = quiz.questions.filter((q) => q.isLuckyDraw).length;

    const response: QuizWithProgress = {
      ...quiz,
      questions: undefined,
      totalQuestions,
      totalLuckyDrawQuestions,
      progress: progress
        ? {
            ...progress,
            buttonStatus,
          }
        : undefined,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * 내 진행 상황 조회
 * GET /api/quizzes/:quizId/progress
 */
export const getQuizProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    const { quizId } = req.params;
    const userId = req.user.userId;

    const progress = await prisma.userQuizProgress.findUnique({
      where: {
        userId_quizId: {
          userId,
          quizId,
        },
      },
    });

    if (!progress) {
      res.status(200).json(null);
      return;
    }

    res.status(200).json(progress);
  } catch (error) {
    next(error);
  }
};
