// ─── Shared TypeScript Types ───────────────────────────────────────────────

export type UserRole = 'individual' | 'institution_admin' | 'teacher' | 'student';

export interface User {
  id: number;
  name: string;
  email: string | null;
  provider: 'local' | 'google';
  avatar_url: string | null;
  institution_id: number | null;
  email_verified_at: string | null;
  roles: UserRole[];
  created_at: string;
}

export interface Institution {
  id: number;
  name: string;
  owner_user_id: number;
  plan: string;
  status: string;
  logo_path: string | null;
}

export interface SchoolClass {
  id: number;
  institution_id: number;
  teacher_id: number;
  name: string;
  join_code: string;
  students_count?: number;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

export type TestVisibility = 'public' | 'private' | 'invite_only';
export type TestStatus = 'draft' | 'published' | 'archived';
export type TemplateKey = 'corporate' | 'focused' | 'custom';

export interface TestTheme {
  template_key: TemplateKey;
  primary_color: string;
  accent_color: string;
  logo_path: string | null;
  layout_config: Record<string, unknown> | null;
}

export interface Test {
  id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  visibility: TestVisibility;
  passing_score: number | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  status: TestStatus;
  owner_type: 'individual' | 'institution';
  has_negative_marking: boolean;
  negative_mark: number | null;
  question_count?: number;
  questions_count?: number;
  attempts_count?: number;
  creator: { id: number; name: string };
  theme?: TestTheme | null;
  shares?: Array<{ slug: string }>;
  questions?: Question[];
  created_at: string;
  updated_at: string;
}

export interface Option {
  id: number;
  question_id: number;
  option_text: string;
  is_correct?: boolean; // only visible to creator
}

export interface Question {
  id: number;
  test_id: number;
  question_text: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  order_index: number;
  marks: number;
  options: Option[];
}

// ─── Shares ─────────────────────────────────────────────────────────────────

export interface TestShare {
  id: number;
  test_id: number;
  label: string | null;
  slug: string;
  url: string;
  max_participants: number | null;
  expires_at: string | null;
  view_count: number;
  start_count: number;
  completion_count: number;
  completion_rate: number;
  remaining_slots: number | null;
  created_at: string;
}

// ─── Attempts ─────────────────────────────────────────────────────────────

export type QuestionState =
  | 'not_visited'
  | 'not_answered'
  | 'answered'
  | 'marked'
  | 'answered_marked';

export type AttemptStatus = 'in_progress' | 'submitted' | 'expired';
export type GenerationStatus = 'pending' | 'completed' | 'failed_fallback';

export interface AttemptAnswer {
  question_id: number;
  selected_option_id: number | null;
  state: QuestionState;
}

export interface Attempt {
  id: number;
  test_id: number;
  status: AttemptStatus;
  score: number | null;
  started_at: string | null;
  submitted_at: string | null;
  expires_at: string;
  time_remaining_seconds: number;
  guest_name: string | null;
  guest_email: string | null;
  user?: User;
  answers?: AttemptAnswer[];
  test?: Test;
}

export interface TopicAdvice {
  topic: string;
  advice: string;
}

export interface TopicStat {
  topic: string;
  correct: number;
  wrong: number;
  total: number;
  earned: number;
  possible: number;
  percentage: number;
}

export interface AttemptReport {
  attempt_id: number;
  test_id?: number;
  test_title?: string;
  score?: number | null;
  total_questions?: number;
  attempted_questions?: number;
  unattempted_questions?: number;
  correct_questions?: number;
  wrong_questions?: number;
  total_earned_marks?: number;
  total_possible_marks?: number;
  has_negative_marking?: boolean;
  negative_mark?: number;
  topics?: TopicStat[];
  strong_topics: string[];
  weak_topics: string[];
  ai_summary: string | null;
  topic_advice: TopicAdvice[];
  generation_status: GenerationStatus;
  created_at: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface IndividualDashboard {
  role: 'individual';
  total_tests: number;
  published_tests: number;
  total_attempts: number;
  tests: Test[];
}

export interface TeacherDashboard {
  role: 'teacher';
  class_count: number;
  test_count: number;
  total_attempts: number;
}

export interface AdminDashboard {
  role: 'institution_admin';
  institution: Institution;
  test_count: number;
  total_attempts: number;
}

export interface StudentDashboard {
  role: 'student';
  total_attempts: number;
  average_score: number | null;
  recent_attempts: Attempt[];
}

export type DashboardData =
  | IndividualDashboard
  | TeacherDashboard
  | AdminDashboard
  | StudentDashboard;

// ─── API Pagination ──────────────────────────────────────────────────────────

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: { first: string; last: string; prev: string | null; next: string | null };
}
