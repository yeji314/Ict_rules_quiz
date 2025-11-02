# 백엔드 설정 및 실행 가이드

## 프로젝트 구조

```
src/
├── config/              # 설정 파일
│   ├── database.ts      # Prisma Client 설정
│   └── env.ts           # 환경변수 관리
├── controllers/         # MVC Controllers
│   ├── adminController.ts
│   ├── authController.ts
│   ├── gameController.ts
│   └── quizController.ts
├── middlewares/         # Express 미들웨어
│   ├── auth.ts          # JWT 인증
│   ├── errorHandler.ts  # 에러 핸들링
│   └── validation.ts    # 요청 검증
├── routes/              # API 라우트
│   ├── adminRoutes.ts
│   ├── authRoutes.ts
│   ├── gameRoutes.ts
│   ├── quizRoutes.ts
│   └── index.ts         # 라우트 통합
├── types/               # TypeScript 타입
│   └── index.ts
├── utils/               # 유틸리티
│   ├── jwt.ts
│   ├── logger.ts
│   └── password.ts
├── app.ts               # Express 앱 설정
└── index.ts             # 서버 엔트리 포인트
```

## 빠른 시작

### 1. PostgreSQL 설치 및 실행

#### Windows (PostgreSQL 다운로드)
```
https://www.postgresql.org/download/windows/
```

#### Docker 사용 (권장)
```bash
docker run --name ict-quiz-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ict_quiz \
  -p 5432:5432 \
  -d postgres:15
```

### 2. 환경변수 설정

```bash
# .env 파일 생성
cp .env.example .env
```

`.env` 파일 내용:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ict_quiz"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
ADMIN_EMPLOYEE_ID="admin"
ADMIN_PASSWORD="admin@"
CORS_ORIGIN="http://localhost:5173"
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 데이터베이스 설정

```bash
# Prisma 마이그레이션 (테이블 생성)
npm run prisma:migrate

# Prisma Client 생성
npm run prisma:generate

# 시드 데이터 생성
npm run prisma:seed
```

### 5. 서버 실행

```bash
# 개발 모드 (Hot reload)
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

서버가 http://localhost:3000 에서 실행됩니다.

### 6. API 확인

```bash
curl http://localhost:3000/api/health
```

## 주요 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 시작 (nodemon) |
| `npm run build` | TypeScript 빌드 |
| `npm start` | 프로덕션 서버 시작 |
| `npm run prisma:generate` | Prisma Client 생성 |
| `npm run prisma:migrate` | 마이그레이션 실행 |
| `npm run prisma:studio` | Prisma Studio (DB GUI) |
| `npm run prisma:seed` | 시드 데이터 생성 |
| `npm run lint` | ESLint 실행 |

## API 엔드포인트

### 인증 (Auth)
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보

### 퀴즈 (Quizzes)
- `GET /api/quizzes` - 퀴즈 목록 (진행상황 포함)
- `GET /api/quizzes/:id` - 퀴즈 상세
- `GET /api/quizzes/:id/progress` - 내 진행 상황

### 게임 (Sessions)
- `POST /api/sessions` - 게임 세션 시작
- `GET /api/sessions/:id/questions` - 문제 가져오기
- `POST /api/sessions/:id/answers` - 답변 제출
- `POST /api/sessions/:id/complete` - 세션 완료/중단

### 관리자 (Admin)
- `GET /api/admin/stats` - 대시보드 통계
- `GET /api/admin/quizzes` - 퀴즈 관리 목록
- `POST /api/admin/quizzes` - 퀴즈 생성
- `PUT /api/admin/quizzes/:id` - 퀴즈 수정
- `DELETE /api/admin/quizzes/:id` - 퀴즈 삭제
- `GET /api/admin/quizzes/:id/questions` - 문제 목록
- `POST /api/admin/quizzes/:id/questions` - 문제 추가
- `PUT /api/admin/questions/:id` - 문제 수정
- `DELETE /api/admin/questions/:id` - 문제 삭제
- `POST /api/admin/questions/bulk` - 문제 대량 등록
- `GET /api/admin/departments` - 부서 목록

자세한 API 사용법은 [API_GUIDE.md](docs/API_GUIDE.md)를 참고하세요.

## 시드 데이터

### 계정 정보

| 구분 | 행원번호 | 비밀번호 | 이름 | 권한 |
|------|---------|---------|------|------|
| 관리자 | admin | admin@ | 관리자 | ADMIN |
| 테스트1 | 2024001 | test123 | 김철수 | USER |
| 테스트2 | 2024002 | test123 | 이영희 | USER |
| 테스트3 | 2024003 | test123 | 박민수 | USER |

### 부서
- IT부 (IT)
- 인사부 (HR)
- 재무부 (FINANCE)
- 여신부 (LOAN)
- 수신부 (DEPOSIT)

### 샘플 퀴즈
- 제목: "2025년 11월"
- 기간: 2025-11-01 ~ 2025-11-30
- 문제 4개 (LuckyDraw 1개 포함)

## 데이터베이스 관리

### Prisma Studio 사용
```bash
npm run prisma:studio
```

브라우저에서 http://localhost:5555 에 자동으로 열립니다.
데이터를 GUI로 확인하고 수정할 수 있습니다.

### 마이그레이션 생성
```bash
npx prisma migrate dev --name migration_name
```

### 마이그레이션 초기화 (주의!)
```bash
npx prisma migrate reset  # 모든 데이터 삭제 후 재생성
```

## 트러블슈팅

### 1. 데이터베이스 연결 실패
```
Error: Can't reach database server at localhost:5432
```

**해결방법:**
- PostgreSQL이 실행 중인지 확인
- `.env`의 DATABASE_URL이 올바른지 확인
- 방화벽 설정 확인

### 2. Prisma Client 오류
```
Error: @prisma/client did not initialize yet
```

**해결방법:**
```bash
npm run prisma:generate
```

### 3. 마이그레이션 오류
```
Error: Migration failed
```

**해결방법:**
```bash
# 마이그레이션 재설정
npx prisma migrate reset

# 다시 마이그레이션
npm run prisma:migrate
```

### 4. 포트 이미 사용 중
```
Error: Port 3000 is already in use
```

**해결방법:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID번호] /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

### 5. TypeScript 컴파일 오류
```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# 타입 정의 재생성
npm run prisma:generate
```

## 프로덕션 배포

### 환경변수 설정
```env
NODE_ENV="production"
DATABASE_URL="postgresql://user:password@production-host:5432/db"
JWT_SECRET="강력한-프로덕션-시크릿-키"
PORT=3000
```

### 빌드 및 실행
```bash
# 빌드
npm run build

# 마이그레이션
npm run prisma:migrate deploy

# 서버 시작
npm start
```

### PM2 사용 (권장)
```bash
npm install -g pm2

# 시작
pm2 start dist/index.js --name ict-quiz-api

# 로그 확인
pm2 logs ict-quiz-api

# 재시작
pm2 restart ict-quiz-api
```

## 보안 권장사항

1. **JWT Secret 변경**: 프로덕션에서는 강력한 시크릿 키 사용
2. **HTTPS 사용**: 프로덕션 환경에서는 반드시 HTTPS 사용
3. **Rate Limiting**: express-rate-limit 추가 권장
4. **Helmet 미들웨어**: HTTP 헤더 보안 강화
5. **환경변수 보호**: .env 파일을 절대 커밋하지 않기

## 로그 확인

로그는 Winston을 사용하여 콘솔에 출력됩니다.

- **개발 모드**: 모든 로그 출력
- **프로덕션 모드**: info 레벨 이상만 출력

## 다음 단계

백엔드 구현이 완료되었습니다!

1. ✅ 데이터베이스 스키마 설계
2. ✅ API 스펙 작성
3. ✅ TypeScript 타입 정의
4. ✅ MVC 구조로 백엔드 구현
5. ⏳ 프론트엔드 개발

프론트엔드 개발을 시작하려면 `src/types/index.ts` 파일을 프론트엔드 프로젝트에 복사하여 사용하세요.
