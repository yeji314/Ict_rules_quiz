// 게임 라우트
import { Router } from 'express';
import { body } from 'express-validator';
import * as gameController from '../controllers/gameController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validation';

const router = Router();

// POST /api/sessions
router.post(
  '/',
  authenticate,
  validate([body('quizId').isUUID().withMessage('Valid quiz ID is required')]),
  gameController.createSession
);

// GET /api/sessions/:sessionId/questions
router.get('/:sessionId/questions', authenticate, gameController.getSessionQuestions);

// POST /api/sessions/:sessionId/answers
router.post(
  '/:sessionId/answers',
  authenticate,
  validate([
    body('questionId').isUUID().withMessage('Valid question ID is required'),
    body('userAnswer').exists().withMessage('User answer is required'),
  ]),
  gameController.submitAnswer
);

// POST /api/sessions/:sessionId/complete
router.post(
  '/:sessionId/complete',
  authenticate,
  validate([
    body('action')
      .isIn(['continue', 'quit'])
      .withMessage('Action must be "continue" or "quit"'),
  ]),
  gameController.completeSession
);

export default router;
