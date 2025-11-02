// 라우트 통합
import { Router } from 'express';
import authRoutes from './authRoutes';
import quizRoutes from './quizRoutes';
import gameRoutes from './gameRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

// 라우트 등록
router.use('/auth', authRoutes);
router.use('/quizzes', quizRoutes);
router.use('/sessions', gameRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'ICT Quiz API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
