// 인증 라우트
import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validation';

const router = Router();

// POST /api/auth/login
router.post(
  '/login',
  validate([
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  authController.login
);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

export default router;
