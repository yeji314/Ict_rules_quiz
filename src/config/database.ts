// Prisma Client 설정
import { PrismaClient } from '@prisma/client';

// Prisma Client 싱글톤 인스턴스
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 애플리케이션 종료 시 연결 해제
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
