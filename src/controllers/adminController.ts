// 관리자 컨트롤러
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import {
  AdminStats,
  QuestionInput,
  QuestionBulkCreate,
} from '../types';

/**
 * 대시보드 통계
 * GET /api/admin/stats
 */
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 부서별 참여율
    const departments = await prisma.department.findMany({
      include: {
        users: {
          include: {
            quizProgress: true,
          },
        },
      },
    });

    const departmentParticipation = departments.map((dept) => {
      const totalUsers = dept.users.length;
      const participatedUsers = new Set(
        dept.users.filter((u) => u.quizProgress.length > 0).map((u) => u.id)
      ).size;

      return {
        departmentName: dept.name,
        totalUsers,
        participatedUsers,
        participationRate:
          totalUsers > 0 ? (participatedUsers / totalUsers) * 100 : 0,
      };
    });

    // LuckyDraw 현황
    const luckyDrawAnswers = await prisma.answer.findMany({
      where: {
        question: {
          isLuckyDraw: true,
        },
        isFirstTryCorrect: true,
      },
      include: {
        user: {
          include: {
            department: true,
          },
        },
      },
    });

    const luckyDrawByUser = new Map<string, { name: string; dept: string; count: number }>();

    luckyDrawAnswers.forEach((answer) => {
      const userId = answer.userId;
      if (!luckyDrawByUser.has(userId)) {
        luckyDrawByUser.set(userId, {
          name: answer.user.name,
          dept: answer.user.department.name,
          count: 0,
        });
      }
      const userData = luckyDrawByUser.get(userId)!;
      userData.count += 1;
    });

    const luckyDrawStats = Array.from(luckyDrawByUser.values()).map((data) => ({
      userName: data.name,
      departmentName: data.dept,
      luckyDrawCount: data.count,
    }));

    const stats: AdminStats = {
      departmentParticipation,
      luckyDrawStats,
    };

    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * 전체 퀴즈 관리 목록
 * GET /api/admin/quizzes
 */
export const getQuizzes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({ quizzes });
  } catch (error) {
    next(error);
  }
};

/**
 * 새 퀴즈 생성
 * POST /api/admin/quizzes
 */
export const createQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, startDate, endDate } = req.body;

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
      },
    });

    res.status(201).json(quiz);
  } catch (error) {
    next(error);
  }
};

/**
 * 퀴즈 수정
 * PUT /api/admin/quizzes/:quizId
 */
export const updateQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { quizId } = req.params;
    const { title, description, startDate, endDate, isActive } = req.body;

    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
      },
    });

    res.status(200).json(quiz);
  } catch (error) {
    next(error);
  }
};

/**
 * 퀴즈 삭제
 * DELETE /api/admin/quizzes/:quizId
 */
export const deleteQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { quizId } = req.params;

    await prisma.quiz.delete({
      where: { id: quizId },
    });

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 퀴즈의 전체 문제 조회
 * GET /api/admin/quizzes/:quizId/questions
 */
export const getQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { quizId } = req.params;

    const questions = await prisma.question.findMany({
      where: { quizId },
      orderBy: [{ isLuckyDraw: 'asc' }, { order: 'asc' }],
    });

    res.status(200).json({ questions });
  } catch (error) {
    next(error);
  }
};

/**
 * 문제 추가
 * POST /api/admin/quizzes/:quizId/questions
 */
export const createQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { quizId } = req.params;
    const questionData: QuestionInput = req.body;

    const question = await prisma.question.create({
      data: {
        quizId,
        type: questionData.type,
        content: questionData.content,
        options: questionData.options as any,
        correctAnswer: questionData.correctAnswer as any,
        explanation: questionData.explanation,
        isLuckyDraw: questionData.isLuckyDraw || false,
        metadata: questionData.metadata as any,
      },
    });

    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
};

/**
 * 문제 수정
 * PUT /api/admin/questions/:questionId
 */
export const updateQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { questionId } = req.params;
    const questionData: QuestionInput = req.body;

    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        type: questionData.type,
        content: questionData.content,
        options: questionData.options as any,
        correctAnswer: questionData.correctAnswer as any,
        explanation: questionData.explanation,
        isLuckyDraw: questionData.isLuckyDraw,
        metadata: questionData.metadata as any,
      },
    });

    res.status(200).json(question);
  } catch (error) {
    next(error);
  }
};

/**
 * 문제 삭제
 * DELETE /api/admin/questions/:questionId
 */
export const deleteQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { questionId } = req.params;

    await prisma.question.delete({
      where: { id: questionId },
    });

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 퀴즈의 전체 문제 삭제
 * DELETE /api/admin/quizzes/:quizId/questions
 */
export const deleteAllQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { quizId } = req.params;

    const result = await prisma.question.deleteMany({
      where: { quizId },
    });

    res.status(200).json({
      success: true,
      message: `${result.count} questions deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 문제 대량 등록
 * POST /api/admin/questions/bulk
 */
export const bulkCreateQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { quizId } = req.query;
    const { questions }: QuestionBulkCreate = req.body;

    if (!quizId || typeof quizId !== 'string') {
      throw new AppError(400, 'Quiz ID is required');
    }

    // 퀴즈 존재 확인
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new AppError(404, 'Quiz not found');
    }

    // 대량 생성
    const createdQuestions = await prisma.question.createMany({
      data: questions.map((q) => ({
        quizId,
        type: q.type,
        content: q.content,
        options: q.options as any,
        correctAnswer: q.correctAnswer as any,
        explanation: q.explanation,
        isLuckyDraw: q.isLuckyDraw || false,
        metadata: q.metadata as any,
      })),
    });

    res.status(201).json({
      success: true,
      count: createdQuestions.count,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 부서 목록 조회
 * GET /api/admin/departments
 */
export const getDepartments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        order: 'asc',
      },
    });

    res.status(200).json({ departments });
  } catch (error) {
    next(error);
  }
};
