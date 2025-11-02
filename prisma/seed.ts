// 데이터베이스 시드 스크립트
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. 부서 생성
  console.log('Creating departments...');
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: 'IT' },
      update: {},
      create: {
        code: 'IT',
        name: 'IT부',
        order: 1,
      },
    }),
    prisma.department.upsert({
      where: { code: 'HR' },
      update: {},
      create: {
        code: 'HR',
        name: '인사부',
        order: 2,
      },
    }),
    prisma.department.upsert({
      where: { code: 'FINANCE' },
      update: {},
      create: {
        code: 'FINANCE',
        name: '재무부',
        order: 3,
      },
    }),
    prisma.department.upsert({
      where: { code: 'LOAN' },
      update: {},
      create: {
        code: 'LOAN',
        name: '여신부',
        order: 4,
      },
    }),
    prisma.department.upsert({
      where: { code: 'DEPOSIT' },
      update: {},
      create: {
        code: 'DEPOSIT',
        name: '수신부',
        order: 5,
      },
    }),
  ]);
  console.log(`Created ${departments.length} departments`);

  // 2. 관리자 계정 생성
  console.log('Creating admin user...');
  const adminPassword = await bcrypt.hash('admin@', 10);
  const admin = await prisma.user.upsert({
    where: { employeeId: 'admin' },
    update: {},
    create: {
      employeeId: 'admin',
      password: adminPassword,
      name: '관리자',
      departmentId: departments[0].id,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('Admin user created:', admin.employeeId);

  // 3. 테스트 사용자 생성
  console.log('Creating test users...');
  const testPassword = await bcrypt.hash('test123', 10);
  const testUsers = await Promise.all([
    prisma.user.upsert({
      where: { employeeId: '2024001' },
      update: {},
      create: {
        employeeId: '2024001',
        password: testPassword,
        name: '김철수',
        departmentId: departments[0].id,
        role: 'USER',
      },
    }),
    prisma.user.upsert({
      where: { employeeId: '2024002' },
      update: {},
      create: {
        employeeId: '2024002',
        password: testPassword,
        name: '이영희',
        departmentId: departments[1].id,
        role: 'USER',
      },
    }),
    prisma.user.upsert({
      where: { employeeId: '2024003' },
      update: {},
      create: {
        employeeId: '2024003',
        password: testPassword,
        name: '박민수',
        departmentId: departments[2].id,
        role: 'USER',
      },
    }),
  ]);
  console.log(`Created ${testUsers.length} test users`);

  // 4. 샘플 퀴즈 생성
  console.log('Creating sample quiz...');
  const quiz = await prisma.quiz.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: '2025년 11월',
      description: '2025년 11월 내규 퀴즈',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      isActive: true,
      maxRounds: 3,
      questionsPerRound: 5,
    },
  });
  console.log('Sample quiz created:', quiz.title);

  // 5. 샘플 문제 생성
  console.log('Creating sample questions...');

  // 빈칸 맞추기 문제
  await prisma.question.create({
    data: {
      quizId: quiz.id,
      type: 'FILL_BLANK',
      content: '은행원은 고객의 ___을(를) 철저히 보호해야 합니다.',
      options: {
        choices: ['개인정보', '재산', '비밀', '신용'],
      },
      correctAnswer: {
        selectedIndex: 0,
      },
      explanation: '은행원은 고객의 개인정보를 철저히 보호해야 합니다.',
      isLuckyDraw: false,
    },
  });

  // OX 문제
  await prisma.question.create({
    data: {
      quizId: quiz.id,
      type: 'OX_QUIZ',
      content: '업무시간 중 개인적인 용무로 자리를 비워도 된다.',
      correctAnswer: {
        correct: false,
      },
      explanation: '업무시간 중에는 개인적인 용무로 자리를 비우면 안 됩니다.',
      isLuckyDraw: false,
      metadata: {
        characterHint: true,
      },
    },
  });

  // 문장 따라쓰기
  await prisma.question.create({
    data: {
      quizId: quiz.id,
      type: 'TYPE_SENTENCE',
      content: '은행원은 정직과 성실로 고객의 신뢰를 얻어야 한다.',
      correctAnswer: {
        correctText: '은행원은 정직과 성실로 고객의 신뢰를 얻어야 한다.',
      },
      explanation: '정확히 입력하셨습니다.',
      isLuckyDraw: false,
      metadata: {
        maxLength: 100,
        disablePaste: true,
      },
    },
  });

  // LuckyDraw 문제
  await prisma.question.create({
    data: {
      quizId: quiz.id,
      type: 'FILL_BLANK',
      content: '[LuckyDraw] 내부정보는 ___에게만 공유해야 합니다.',
      options: {
        choices: ['관계자', '동료', '가족', '친구'],
      },
      correctAnswer: {
        selectedIndex: 0,
      },
      explanation: '내부정보는 관계자에게만 공유해야 합니다.',
      isLuckyDraw: true,
    },
  });

  console.log('Sample questions created');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
