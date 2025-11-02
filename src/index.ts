// 서버 엔트리 포인트
import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import prisma from './config/database';

const startServer = async () => {
  try {
    // 데이터베이스 연결 확인
    await prisma.$connect();
    logger.info('Database connected successfully');

    // 서버 시작
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API docs: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// 서버 시작
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});
