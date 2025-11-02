// 게임 컨트롤러
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import {
  QuizSession,
  QuestionForUser,
  AnswerSubmission,
  AnswerResult,
  CompleteSessionRequest,
  CompleteSessionResponse,
  SessionStatus,
} from '../types';

/**
 * 새 게임 세션 시작
 * POST /api/sessions
 */
export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    const { quizId } = req.body;
    const userId = req.user.userId;

    // 퀴즈 확인
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new AppError(404, 'Quiz not found');
    }

    // 유효기간 확인
    const now = new Date();
    if (now < quiz.startDate || now > quiz.endDate || !quiz.isActive) {
      throw new AppError(400, 'Quiz is not available');
    }

    // 사용자 진행 상황 조회 또는 생성
    let progress = await prisma.userQuizProgress.findUnique({
      where: {
        userId_quizId: {
          userId,
          quizId,
        },
      },
    });

    if (!progress) {
      progress = await prisma.userQuizProgress.create({
        data: {
          userId,
          quizId,
          currentRound: 0,
          totalQuestionsAnswered: 0,
          luckyDrawBadges: 0,
          firstAttemptDate: now,
          lastAttemptDate: now,
          isCompleted: false,
        },
      });
    }

    // 이미 완료된 퀴즈인지 확인
    if (progress.isCompleted) {
      throw new AppError(400, 'Quiz already completed');
    }

    // 최대 회차 확인
    if (progress.currentRound >= quiz.maxRounds) {
      throw new AppError(400, 'Maximum rounds reached');
    }

    // 새 세션 생성
    const session = await prisma.quizSession.create({
      data: {
        userId,
        quizId,
        roundNumber: progress.currentRound + 1,
        status: SessionStatus.IN_PROGRESS,
        questionsCount: 0,
        correctFirstTry: 0,
        luckyDrawShown: false,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

/**
 * 세션의 문제 가져오기 (랜덤 선택 + LuckyDraw 로직)
 * GET /api/sessions/:sessionId/questions
 */
export const getSessionQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    const { sessionId } = req.params;
    const userId = req.user.userId;

    // 세션 조회
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: true,
      },
    });

    if (!session || session.userId !== userId) {
      throw new AppError(404, 'Session not found');
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new AppError(400, 'Session is not in progress');
    }

    // 이미 풀은 문제 ID 조회
    const answeredQuestions = await prisma.answer.findMany({
      where: {
        userId,
        question: {
          quizId: session.quizId,
        },
      },
      select: {
        questionId: true,
      },
    });

    const answeredQuestionIds = answeredQuestions.map((a) => a.questionId);

    // 안 푼 문제들 조회
    const availableQuestions = await prisma.question.findMany({
      where: {
        quizId: session.quizId,
        id: {
          notIn: answeredQuestionIds,
        },
      },
    });

    // 기본 문제와 LuckyDraw 문제 분리
    const regularQuestions = availableQuestions.filter((q) => !q.isLuckyDraw);
    const luckyDrawQuestions = availableQuestions.filter((q) => q.isLuckyDraw);

    let selectedQuestions: typeof availableQuestions = [];

    // LuckyDraw 출현 조건 확인
    const shouldShowLuckyDraw =
      session.correctFirstTry >= 3 &&
      !session.luckyDrawShown &&
      luckyDrawQuestions.length > 0;

    if (shouldShowLuckyDraw) {
      // LuckyDraw 확률 계산 (회차별 10% 누적)
      const luckyDrawProbability = session.roundNumber * 0.1;
      const randomValue = Math.random();

      if (randomValue < luckyDrawProbability) {
        // LuckyDraw 문제 1개 선택
        const luckyDrawQuestion =
          luckyDrawQuestions[Math.floor(Math.random() * luckyDrawQuestions.length)];
        selectedQuestions.push(luckyDrawQuestion);

        // LuckyDraw 표시 플래그 업데이트
        await prisma.quizSession.update({
          where: { id: sessionId },
          data: { luckyDrawShown: true },
        });
      }
    }

    // 나머지는 일반 문제로 채우기 (최대 5개)
    const questionsNeeded = session.quiz.questionsPerRound - selectedQuestions.length;
    if (regularQuestions.length > 0 && questionsNeeded > 0) {
      const shuffled = regularQuestions.sort(() => Math.random() - 0.5);
      selectedQuestions = [...selectedQuestions, ...shuffled.slice(0, questionsNeeded)];
    }

    // 정답 정보 제외하고 응답
    const questionsForUser: QuestionForUser[] = selectedQuestions.map((q) => ({
      id: q.id,
      type: q.type,
      content: q.content,
      options: q.options as any,
      isLuckyDraw: q.isLuckyDraw,
      metadata: q.metadata as any,
    }));

    res.status(200).json({
      questions: questionsForUser,
      currentQuestionIndex: 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 답변 제출 및 채점
 * POST /api/sessions/:sessionId/answers
 */
export const submitAnswer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    const { sessionId } = req.params;
    const { questionId, userAnswer } = req.body as AnswerSubmission;
    const userId = req.user.userId;

    // 세션 조회
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new AppError(404, 'Session not found');
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new AppError(400, 'Session is not in progress');
    }

    // 문제 조회
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new AppError(404, 'Question not found');
    }

    // 이미 답변한 문제인지 확인
    const existingAnswer = await prisma.answer.findUnique({
      where: {
        sessionId_questionId: {
          sessionId,
          questionId,
        },
      },
    });

    // 정답 확인
    const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);

    let attemptCount = 1;
    let isFirstTryCorrect = isCorrect;

    if (existingAnswer) {
      // 이미 답변한 경우 (재시도)
      attemptCount = existingAnswer.attemptCount + 1;
      isFirstTryCorrect = existingAnswer.isFirstTryCorrect;

      await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: {
          userAnswer: userAnswer as any,
          isCorrect,
          attemptCount,
        },
      });
    } else {
      // 첫 시도
      await prisma.answer.create({
        data: {
          userId,
          sessionId,
          questionId,
          userAnswer: userAnswer as any,
          isCorrect,
          attemptCount,
          isFirstTryCorrect,
        },
      });

      // 세션 문제 수 증가
      await prisma.quizSession.update({
        where: { id: sessionId },
        data: {
          questionsCount: { increment: 1 },
          correctFirstTry: isFirstTryCorrect ? { increment: 1 } : undefined,
        },
      });

      // LuckyDraw를 첫 시도에 맞춘 경우 뱃지 증가
      if (isFirstTryCorrect && question.isLuckyDraw) {
        await prisma.userQuizProgress.update({
          where: {
            userId_quizId: {
              userId,
              quizId: session.quizId,
            },
          },
          data: {
            luckyDrawBadges: { increment: 1 },
          },
        });
      }
    }

    const result: AnswerResult = {
      isCorrect,
      correctAnswer: isCorrect ? undefined : (question.correctAnswer as any),
      explanation: question.explanation,
      attemptCount,
      canProceed: isCorrect,
    };

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * 세션 완료/중단
 * POST /api/sessions/:sessionId/complete
 */
export const completeSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    const { sessionId } = req.params;
    const { action } = req.body as CompleteSessionRequest;
    const userId = req.user.userId;

    // 세션 조회
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: true,
      },
    });

    if (!session || session.userId !== userId) {
      throw new AppError(404, 'Session not found');
    }

    const now = new Date();

    // 세션 상태 업데이트
    const newStatus = action === 'quit' ? SessionStatus.ABANDONED : SessionStatus.COMPLETED;

    await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        status: newStatus,
        completedAt: now,
      },
    });

    // 진행 상황 업데이트
    const progress = await prisma.userQuizProgress.findUnique({
      where: {
        userId_quizId: {
          userId,
          quizId: session.quizId,
        },
      },
    });

    if (progress && action === 'continue') {
      const newCurrentRound = progress.currentRound + 1;
      const isCompleted = newCurrentRound >= session.quiz.maxRounds;

      await prisma.userQuizProgress.update({
        where: { id: progress.id },
        data: {
          currentRound: newCurrentRound,
          totalQuestionsAnswered: { increment: session.questionsCount },
          lastAttemptDate: now,
          isCompleted,
        },
      });

      // 계속하기인 경우 새 세션 생성
      if (!isCompleted) {
        const nextSession = await prisma.quizSession.create({
          data: {
            userId,
            quizId: session.quizId,
            roundNumber: newCurrentRound + 1,
            status: SessionStatus.IN_PROGRESS,
            questionsCount: 0,
            correctFirstTry: 0,
            luckyDrawShown: false,
          },
        });

        const response: CompleteSessionResponse = {
          status: SessionStatus.COMPLETED,
          nextSession,
        };

        res.status(200).json(response);
        return;
      }
    }

    const response: CompleteSessionResponse = {
      status: newStatus,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
