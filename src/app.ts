// Express 앱 설정
import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';

const app: Application = express();

// CORS 설정
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request 로깅
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// API 라우트
app.use('/api', routes);

// 404 핸들러
app.use(notFoundHandler);

// 에러 핸들러
app.use(errorHandler);

export default app;
