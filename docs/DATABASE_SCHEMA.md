# 데이터베이스 스키마 설계 문서

## 개요
SDD(Schema Driven Development) 방식으로 설계된 내규 퀴즈 시스템의 데이터베이스 스키마입니다.

## 엔티티 관계도 (ERD)

```
Department (부서)
    ↓ 1:N
User (사용자) ──────┬────────────┬─────────────┐
                    ↓ 1:N        ↓ 1:N         ↓ 1:N
                UserQuizProgress  QuizSession   Answer
                    ↓ N:1            ↓ N:1        ↓ N:1
Quiz (퀴즈) ─────────┴──────────────┴────────────┘
    ↓ 1:N
Question (문제) ─────────────────────────────────┘
```

## 주요 엔티티 설명

### 1. User (사용자)
**역할**: 퀴즈를 푸는 행원 및 관리자

| 필드 | 타입 | 설명 |
|------|------|------|
| employeeId | String (Unique) | 행원번호 (로그인 ID) |
| password | String | 해시된 비밀번호 |
| name | String | 이름 |
| departmentId | String (FK) | 부서 ID |
| role | Enum | ADMIN 또는 USER |

**특이사항**:
- admin 계정: employeeId="admin", password는 해시된 "admin@"

---

### 2. Quiz (퀴즈)
**역할**: 퀴즈 그룹 (예: "2025년 10월")

| 필드 | 타입 | 설명 |
|------|------|------|
| title | String | 퀴즈명 ("2025년 10월") |
| startDate | DateTime | 유효기간 시작 |
| endDate | DateTime | 유효기간 종료 |
| maxRounds | Int | 최대 회차 (기본 3) |
| questionsPerRound | Int | 회차당 문제 수 (기본 5) |

**비즈니스 로직**:
- 각 퀴즈는 **15개 기본 문제 + 3개 LuckyDraw 문제**로 구성
- 유효기간이 지나면 자동으로 비활성화

---

### 3. Question (문제)
**역할**: 개별 퀴즈 문제

| 필드 | 타입 | 설명 |
|------|------|------|
| quizId | String (FK) | 소속 퀴즈 |
| type | Enum | 문제 유형 (5가지) |
| content | String | 문제 내용 |
| options | Json | 선택지 (빈칸, OX 등) |
| correctAnswer | Json | 정답 |
| explanation | String | 해설 |
| isLuckyDraw | Boolean | LuckyDraw 문제 여부 |
| metadata | Json | 유형별 추가 데이터 |

**문제 유형** (QuestionType Enum):
1. `DRAG_AND_DROP`: 부서 드래그앤드롭
2. `TYPE_SENTENCE`: 문장 따라쓰기
3. `FILL_BLANK`: 빈칸 맞추기 (객관식)
4. `OX_QUIZ`: OX 문제
5. `FIND_ERROR`: 틀린 단어 찾기

**데이터 구조 예시**:

```json
// FILL_BLANK (빈칸 맞추기)
{
  "content": "회사의 ___은(는) 중요합니다.",
  "options": ["규칙", "내규", "법규", "원칙"],
  "correctAnswer": 1,
  "metadata": null
}

// DRAG_AND_DROP (드래그앤드롭)
{
  "content": "각 업무를 담당하는 부서를 매칭하세요.",
  "options": null,
  "correctAnswer": {
    "items": [
      {"id": 1, "text": "대출 업무", "correctDept": "여신부"},
      {"id": 2, "text": "예금 업무", "correctDept": "수신부"}
    ]
  },
  "metadata": {
    "departments": ["여신부", "수신부", "IT부", "인사부"]
  }
}

// TYPE_SENTENCE (따라쓰기)
{
  "content": "은행원은 고객의 개인정보를 철저히 보호해야 합니다.",
  "correctAnswer": "은행원은 고객의 개인정보를 철저히 보호해야 합니다.",
  "metadata": {
    "maxLength": 100,
    "disablePaste": true
  }
}

// OX_QUIZ
{
  "content": "업무시간 중 개인적인 용무로 자리를 비워도 된다.",
  "correctAnswer": false,
  "metadata": {
    "characterHint": true // 캐릭터 힌트 활성화
  }
}

// FIND_ERROR (틀린 단어 찾기)
{
  "content": "은행원은 고객의 개인정보를 {철저히|보호|해야|합니다|무시}.",
  "correctAnswer": 4, // "무시"가 틀린 단어 (인덱스)
  "metadata": {
    "underlinedWords": ["철저히", "보호", "해야", "합니다", "무시"]
  }
}
```

---

### 4. UserQuizProgress (사용자별 퀴즈 진행 상황)
**역할**: 사용자가 특정 퀴즈의 전체 진행 상황을 추적

| 필드 | 타입 | 설명 |
|------|------|------|
| userId | String (FK) | 사용자 ID |
| quizId | String (FK) | 퀴즈 ID |
| currentRound | Int | 현재 회차 (0~3) |
| totalQuestionsAnswered | Int | 총 풀은 문제 수 |
| luckyDrawBadges | Int | LuckyDraw 한번에 맞춘 수 |
| firstAttemptDate | DateTime | 처음 푼 날짜 |
| lastAttemptDate | DateTime | 마지막 푼 날짜 |
| isCompleted | Boolean | 3회차 완료 여부 |

**비즈니스 로직**:
- 5개 문제를 풀면 currentRound가 1 증가
- currentRound가 3이 되면 isCompleted = true
- luckyDrawBadges는 LuckyDraw 문제를 **첫 시도에 맞춘 횟수**

**UI 버튼 상태 결정**:
```
currentRound == 0 → "시작하기"
0 < currentRound < 3 → "계속하기"
currentRound == 3 (또는 isCompleted) → "완료" (비활성화)
유효기간 지남 → "완료" (비활성화)
```

---

### 5. QuizSession (퀴즈 세션)
**역할**: 1회차 (5개 문제 세트) 단위의 게임 세션

| 필드 | 타입 | 설명 |
|------|------|------|
| userId | String (FK) | 사용자 ID |
| quizId | String (FK) | 퀴즈 ID |
| roundNumber | Int | 회차 번호 (1, 2, 3) |
| status | Enum | IN_PROGRESS, COMPLETED, ABANDONED |
| questionsCount | Int | 이번 세션에서 푼 문제 수 |
| correctFirstTry | Int | 한 번에 맞춘 문제 수 |
| luckyDrawShown | Boolean | LuckyDraw 문제가 나왔는지 |

**비즈니스 로직**:
- 5개 문제를 모두 풀면 status = COMPLETED
- "그만하기" 누르면 status = ABANDONED
- **correctFirstTry ≥ 3** 이면 LuckyDraw 문제 출현 조건 만족
- LuckyDraw 문제가 이미 나왔다면 luckyDrawShown = true

**LuckyDraw 출현 로직**:
```
1회차: correctFirstTry >= 3 → 10% 확률
2회차: correctFirstTry >= 3 && 이전 LuckyDraw 출현 → 20% 확률 (10% + 10%)
3회차: correctFirstTry >= 3 && 이전 LuckyDraw 출현 → 30% 확률 (10% + 10% + 10%)
```

---

### 6. Answer (사용자 답변 기록)
**역할**: 각 문제에 대한 사용자의 답변 기록

| 필드 | 타입 | 설명 |
|------|------|------|
| userId | String (FK) | 사용자 ID |
| sessionId | String (FK) | 세션 ID |
| questionId | String (FK) | 문제 ID |
| userAnswer | Json | 사용자 답변 |
| isCorrect | Boolean | 정답 여부 |
| attemptCount | Int | 시도 횟수 |
| isFirstTryCorrect | Boolean | 첫 시도에 맞췄는지 |

**비즈니스 로직**:
- 틀린 문제는 오답노트를 보여주고 다시 풀게 함
- attemptCount가 증가하며 기록
- isFirstTryCorrect = true인 경우만 correctFirstTry에 카운트

---

### 7. Department (부서)
**역할**: 부서별 참여율 통계를 위한 부서 정보

| 필드 | 타입 | 설명 |
|------|------|------|
| code | String (Unique) | 부서 코드 |
| name | String (Unique) | 부서명 |

**관리자 페이지 통계**:
```sql
-- 부서별 참여율
SELECT
  d.name,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT uqp.userId) as participated_users,
  (COUNT(DISTINCT uqp.userId) * 100.0 / COUNT(DISTINCT u.id)) as participation_rate
FROM departments d
LEFT JOIN users u ON u.departmentId = d.id
LEFT JOIN user_quiz_progress uqp ON uqp.userId = u.id
GROUP BY d.id;
```

---

## 주요 비즈니스 로직 정리

### 1. 문제 출제 알고리즘
```
1. 현재 세션에서 아직 안 푼 문제들을 조회
2. 기본 문제 (isLuckyDraw = false)와 LuckyDraw 문제 분리
3. correctFirstTry >= 3이고 luckyDrawShown = false인 경우:
   - LuckyDraw 출현 확률 계산 (회차별 10% 누적)
   - 확률에 따라 LuckyDraw 문제 포함
4. 랜덤으로 문제 선택 (최대 5개)
```

### 2. 회차 진행 로직
```
1. QuizSession 생성 (roundNumber = currentRound + 1)
2. 5개 문제 랜덤 출제
3. 각 문제마다 Answer 레코드 생성
4. 틀린 문제는 attemptCount 증가하며 재시도
5. 5개 문제 완료 시 QuizSession.status = COMPLETED
6. UserQuizProgress.currentRound += 1
7. "계속하기" 또는 "그만하기" 선택
```

### 3. LuckyDraw 뱃지 처리
```
- Answer.isFirstTryCorrect = true이고 Question.isLuckyDraw = true인 경우
- UserQuizProgress.luckyDrawBadges += 1
```

---

## 관리자 페이지 쿼리 예시

### 부서별 참여율
```typescript
const stats = await prisma.department.findMany({
  include: {
    users: {
      include: {
        quizProgress: {
          where: { quizId: selectedQuizId }
        }
      }
    }
  }
});
```

### LuckyDraw 현황
```typescript
const luckyDrawStats = await prisma.answer.groupBy({
  by: ['userId'],
  where: {
    question: { isLuckyDraw: true },
    isFirstTryCorrect: true
  },
  _count: true
});
```

---

## 인덱스 최적화 권장사항

```prisma
// 조회 성능을 위한 인덱스
@@index([userId, quizId])      // UserQuizProgress
@@index([sessionId, questionId]) // Answer
@@index([quizId, isLuckyDraw])  // Question
@@index([startDate, endDate])   // Quiz
```

---

## 마이그레이션 가이드

1. Prisma 설치
```bash
npm install prisma @prisma/client
```

2. 환경변수 설정 (.env)
```
DATABASE_URL="postgresql://user:password@localhost:5432/ict_quiz"
```

3. 마이그레이션 실행
```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## 다음 단계
- [ ] OpenAPI 스펙 작성
- [ ] TypeScript 타입 정의
- [ ] API 엔드포인트 구현
