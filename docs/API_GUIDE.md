# API 사용 가이드

## 서버 시작하기

### 1. 환경 설정
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 수정 (DATABASE_URL 등)
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 데이터베이스 설정
```bash
# Prisma 마이그레이션
npm run prisma:migrate

# Prisma Client 생성
npm run prisma:generate

# 시드 데이터 생성 (선택)
npm run prisma:seed
```

### 4. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션
npm run build
npm start
```

## 시드 데이터

`npm run prisma:seed` 실행 시 생성되는 데이터:

### 부서
- IT부 (IT)
- 인사부 (HR)
- 재무부 (FINANCE)
- 여신부 (LOAN)
- 수신부 (DEPOSIT)

### 계정
| 행원번호 | 비밀번호 | 이름 | 권한 |
|---------|---------|------|------|
| admin | admin@ | 관리자 | ADMIN |
| 2024001 | test123 | 김철수 | USER |
| 2024002 | test123 | 이영희 | USER |
| 2024003 | test123 | 박민수 | USER |

### 퀴즈
- 제목: "2025년 11월"
- 기간: 2025-11-01 ~ 2025-11-30
- 샘플 문제 4개 (LuckyDraw 1개 포함)

## API 테스트 예시

### 1. 로그인
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "admin",
    "password": "admin@"
  }'
```

**응답:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "employeeId": "admin",
    "name": "관리자",
    "role": "ADMIN",
    "department": {
      "id": "...",
      "code": "IT",
      "name": "IT부"
    }
  }
}
```

### 2. 퀴즈 목록 조회
```bash
curl -X GET http://localhost:3000/api/quizzes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 게임 세션 시작
```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quizId": "00000000-0000-0000-0000-000000000001"
  }'
```

### 4. 문제 가져오기
```bash
curl -X GET http://localhost:3000/api/sessions/SESSION_ID/questions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. 답변 제출
```bash
# 빈칸 맞추기 문제
curl -X POST http://localhost:3000/api/sessions/SESSION_ID/answers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "QUESTION_ID",
    "userAnswer": {
      "selectedIndex": 0
    }
  }'

# OX 문제
curl -X POST http://localhost:3000/api/sessions/SESSION_ID/answers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "QUESTION_ID",
    "userAnswer": {
      "selected": false
    }
  }'

# 문장 따라쓰기
curl -X POST http://localhost:3000/api/sessions/SESSION_ID/answers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "QUESTION_ID",
    "userAnswer": {
      "typedText": "은행원은 정직과 성실로 고객의 신뢰를 얻어야 한다."
    }
  }'
```

### 6. 세션 완료
```bash
# 계속하기
curl -X POST http://localhost:3000/api/sessions/SESSION_ID/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "continue"
  }'

# 그만하기
curl -X POST http://localhost:3000/api/sessions/SESSION_ID/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "quit"
  }'
```

### 7. 관리자 - 통계 조회
```bash
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 8. 관리자 - 퀴즈 생성
```bash
curl -X POST http://localhost:3000/api/admin/quizzes \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "2025년 12월",
    "description": "2025년 12월 내규 퀴즈",
    "startDate": "2025-12-01T00:00:00Z",
    "endDate": "2025-12-31T23:59:59Z"
  }'
```

### 9. 관리자 - 문제 추가
```bash
curl -X POST http://localhost:3000/api/admin/quizzes/QUIZ_ID/questions \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "FILL_BLANK",
    "content": "은행의 핵심 가치는 ___입니다.",
    "options": {
      "choices": ["신뢰", "이익", "성장", "혁신"]
    },
    "correctAnswer": {
      "selectedIndex": 0
    },
    "explanation": "은행의 핵심 가치는 신뢰입니다.",
    "isLuckyDraw": false
  }'
```

### 10. 관리자 - 문제 대량 등록
```bash
curl -X POST "http://localhost:3000/api/admin/questions/bulk?quizId=QUIZ_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questions": [
      {
        "type": "FILL_BLANK",
        "content": "문제 1",
        "options": { "choices": ["A", "B", "C", "D"] },
        "correctAnswer": { "selectedIndex": 0 },
        "explanation": "설명 1"
      },
      {
        "type": "OX_QUIZ",
        "content": "문제 2",
        "correctAnswer": { "correct": true },
        "explanation": "설명 2",
        "metadata": { "characterHint": true }
      }
    ]
  }'
```

## 에러 코드

| 상태 코드 | 설명 |
|----------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 500 | 서버 에러 |

## Health Check

```bash
curl http://localhost:3000/api/health
```

**응답:**
```json
{
  "status": "OK",
  "message": "ICT Quiz API is running",
  "timestamp": "2025-11-02T..."
}
```
