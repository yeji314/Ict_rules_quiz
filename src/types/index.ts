// TypeScript 타입 정의 - SDD 기반으로 OpenAPI 스펙과 Prisma 스키마에서 생성
// 이 파일은 프론트엔드와 백엔드가 공유할 수 있는 타입 정의입니다.

// ========================================
// Enums (Prisma 스키마에서 가져옴)
// ========================================

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum QuestionType {
  DRAG_AND_DROP = 'DRAG_AND_DROP',    // 부서 드래그앤드롭
  TYPE_SENTENCE = 'TYPE_SENTENCE',    // 문장 따라쓰기
  FILL_BLANK = 'FILL_BLANK',          // 빈칸 맞추기
  OX_QUIZ = 'OX_QUIZ',                // OX 문제
  FIND_ERROR = 'FIND_ERROR',          // 틀린 단어 찾기
}

export enum SessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export enum ButtonStatus {
  START = 'START',           // 시작하기
  CONTINUE = 'CONTINUE',     // 계속하기
  COMPLETED = 'COMPLETED',   // 완료
}

// ========================================
// 기본 엔티티 타입
// ========================================

export interface Department {
  id: string;
  code: string;
  name: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  departmentId: string;
  department?: Department;
  role: UserRole;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  maxRounds: number;
  questionsPerRound: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  content: string;
  options?: QuestionOptions;
  correctAnswer: CorrectAnswer;
  explanation?: string;
  isLuckyDraw: boolean;
  order?: number;
  metadata?: QuestionMetadata;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserQuizProgress {
  id: string;
  userId: string;
  quizId: string;
  currentRound: number;
  totalQuestionsAnswered: number;
  luckyDrawBadges: number;
  firstAttemptDate?: Date;
  lastAttemptDate?: Date;
  isCompleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuizSession {
  id: string;
  userId: string;
  quizId: string;
  roundNumber: number;
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  questionsCount: number;
  correctFirstTry: number;
  luckyDrawShown: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Answer {
  id: string;
  userId: string;
  sessionId: string;
  questionId: string;
  userAnswer: UserAnswer;
  isCorrect: boolean;
  attemptCount: number;
  isFirstTryCorrect: boolean;
  answeredAt: Date;
}

// ========================================
// 문제 유형별 데이터 구조
// ========================================

// 빈칸 맞추기 (FILL_BLANK)
export interface FillBlankOptions {
  choices: string[];
}

export interface FillBlankAnswer {
  selectedIndex: number;
}

// 드래그앤드롭 (DRAG_AND_DROP)
export interface DragAndDropMetadata {
  departments: string[];
}

export interface DragAndDropItem {
  id: number | string;
  text: string;
  correctDept: string;
}

export interface DragAndDropAnswer {
  items: DragAndDropItem[];
}

export interface DragAndDropUserAnswer {
  matches: Array<{
    itemId: number | string;
    selectedDept: string;
  }>;
}

// 문장 따라쓰기 (TYPE_SENTENCE)
export interface TypeSentenceMetadata {
  maxLength: number;
  disablePaste: true;
}

export interface TypeSentenceAnswer {
  correctText: string;
}

export interface TypeSentenceUserAnswer {
  typedText: string;
}

// OX 문제 (OX_QUIZ)
export interface OxQuizMetadata {
  characterHint: boolean;
}

export interface OxQuizAnswer {
  correct: boolean;
}

export interface OxQuizUserAnswer {
  selected: boolean;
}

// 틀린 단어 찾기 (FIND_ERROR)
export interface FindErrorMetadata {
  underlinedWords: string[];
}

export interface FindErrorAnswer {
  errorIndex: number;
}

export interface FindErrorUserAnswer {
  selectedIndex: number;
}

// 통합 타입
export type QuestionOptions =
  | FillBlankOptions
  | null;

export type QuestionMetadata =
  | DragAndDropMetadata
  | TypeSentenceMetadata
  | OxQuizMetadata
  | FindErrorMetadata
  | null;

export type CorrectAnswer =
  | FillBlankAnswer
  | DragAndDropAnswer
  | TypeSentenceAnswer
  | OxQuizAnswer
  | FindErrorAnswer;

export type UserAnswer =
  | FillBlankAnswer
  | DragAndDropUserAnswer
  | TypeSentenceUserAnswer
  | OxQuizUserAnswer
  | FindErrorUserAnswer;

// ========================================
// API 요청/응답 타입
// ========================================

// 로그인
export interface LoginRequest {
  employeeId: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

// 퀴즈 목록 (진행상황 포함)
export interface QuizWithProgress extends Quiz {
  progress?: UserQuizProgress & {
    buttonStatus: ButtonStatus;
  };
  totalQuestions?: number;
  totalLuckyDrawQuestions?: number;
}

// 사용자에게 제공되는 문제 (정답 제외)
export interface QuestionForUser {
  id: string;
  type: QuestionType;
  content: string;
  options?: QuestionOptions;
  isLuckyDraw: boolean;
  metadata?: QuestionMetadata;
}

// 답변 제출
export interface AnswerSubmission {
  questionId: string;
  userAnswer: UserAnswer;
}

export interface AnswerResult {
  isCorrect: boolean;
  correctAnswer?: CorrectAnswer;
  explanation?: string;
  attemptCount: number;
  canProceed: boolean;
}

// 세션 완료/계속
export interface CompleteSessionRequest {
  action: 'continue' | 'quit';
}

export interface CompleteSessionResponse {
  status: SessionStatus;
  nextSession?: QuizSession;
}

// 관리자 통계
export interface DepartmentParticipation {
  departmentName: string;
  totalUsers: number;
  participatedUsers: number;
  participationRate: number;
}

export interface LuckyDrawStat {
  userName: string;
  departmentName: string;
  luckyDrawCount: number;
}

export interface AdminStats {
  departmentParticipation: DepartmentParticipation[];
  luckyDrawStats: LuckyDrawStat[];
}

// 문제 관리
export interface QuestionInput {
  type: QuestionType;
  content: string;
  options?: QuestionOptions;
  correctAnswer: CorrectAnswer;
  explanation?: string;
  isLuckyDraw?: boolean;
  metadata?: QuestionMetadata;
}

export interface QuestionBulkCreate {
  questions: QuestionInput[];
}

// ========================================
// 유틸리티 타입
// ========================================

export interface ApiError {
  error: string;
  message: string;
}

export interface ApiSuccess {
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
