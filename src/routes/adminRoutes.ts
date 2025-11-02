// 관리자 라우트
import { Router } from 'express';
import { body } from 'express-validator';
import * as adminController from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middlewares/auth';
import { validate } from '../middlewares/validation';

const router = Router();

// 모든 관리자 라우트는 인증 + 관리자 권한 필요
router.use(authenticate, requireAdmin);

// GET /api/admin/stats
router.get('/stats', adminController.getStats);

// GET /api/admin/quizzes
router.get('/quizzes', adminController.getQuizzes);

// POST /api/admin/quizzes
router.post(
  '/quizzes',
  validate([
    body('title').notEmpty().withMessage('Title is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
  ]),
  adminController.createQuiz
);

// PUT /api/admin/quizzes/:quizId
router.put('/quizzes/:quizId', adminController.updateQuiz);

// DELETE /api/admin/quizzes/:quizId
router.delete('/quizzes/:quizId', adminController.deleteQuiz);

// GET /api/admin/quizzes/:quizId/questions
router.get('/quizzes/:quizId/questions', adminController.getQuestions);

// POST /api/admin/quizzes/:quizId/questions
router.post(
  '/quizzes/:quizId/questions',
  validate([
    body('type').notEmpty().withMessage('Question type is required'),
    body('content').notEmpty().withMessage('Question content is required'),
    body('correctAnswer').exists().withMessage('Correct answer is required'),
  ]),
  adminController.createQuestion
);

// DELETE /api/admin/quizzes/:quizId/questions
router.delete('/quizzes/:quizId/questions', adminController.deleteAllQuestions);

// PUT /api/admin/questions/:questionId
router.put('/questions/:questionId', adminController.updateQuestion);

// DELETE /api/admin/questions/:questionId
router.delete('/questions/:questionId', adminController.deleteQuestion);

// POST /api/admin/questions/bulk
router.post(
  '/questions/bulk',
  validate([body('questions').isArray().withMessage('Questions must be an array')]),
  adminController.bulkCreateQuestions
);

// GET /api/admin/departments
router.get('/departments', adminController.getDepartments);

export default router;
