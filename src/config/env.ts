// 환경변수 설정 및 검증
import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  adminEmployeeId: string;
  adminPassword: string;
}

const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const config: Config = {
  port: parseInt(getEnvVariable('PORT', '3000'), 10),
  nodeEnv: getEnvVariable('NODE_ENV', 'development'),
  databaseUrl: getEnvVariable('DATABASE_URL'),
  jwtSecret: getEnvVariable('JWT_SECRET'),
  jwtExpiresIn: getEnvVariable('JWT_EXPIRES_IN', '7d'),
  corsOrigin: getEnvVariable('CORS_ORIGIN', 'http://localhost:5173'),
  adminEmployeeId: getEnvVariable('ADMIN_EMPLOYEE_ID', 'admin'),
  adminPassword: getEnvVariable('ADMIN_PASSWORD', 'admin@'),
};
