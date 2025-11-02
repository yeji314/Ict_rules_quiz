// 퀴즈 라우트
import { Router } from 'express';
import * as quizController from '../controllers/quizController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// GET /api/quizzes
router.get('/', authenticate, quizController.getQuizzes);

// GET /api/quizzes/:quizId
router.get('/:quizId', authenticate, quizController.getQuizById);

// GET /api/quizzes/:quizId/progress
router.get('/:quizId/progress', authenticate, quizController.getQuizProgress);

export default router;
