export interface Subject { id: number; name: string; slug: string; topics: { id: number; name: string }[] }
export interface PatternSection {
  id: number; name: string; subject_ids: number[]; subject_names: string; order: number
  question_count: number; marks_per_question: number; negative_marks: number
}
export interface ExamPattern {
  duration_minutes: number; instructions: string; difficulty_distribution: Record<string, number>
  total_questions: number; total_marks: number; sections: PatternSection[]
}
export interface Exam { id: number; name: string; slug: string; description: string; is_default?: boolean; pattern: ExamPattern | null }

export interface Paper {
  id: number; exam: number; original_name: string; file_type: string
  status: 'uploaded' | 'processing' | 'extracted' | 'failed'
  extracted_count: number; duplicate_count: number; invalid_count: number; unclassified_count: number
  error: string; created_at: string
}
export interface SectionAvailability {
  name: string; subject_id: number; subject: string; required: number; available: number; shortfall: number
}
export interface Availability {
  required_questions: number; available_questions: number; shortfall: number
  status: 'ok' | 'insufficient'; sections: SectionAvailability[]
  unclassified_questions: number; invalid_questions: number
}
export interface GenerationJob { id: number; status: 'pending' | 'running' | 'done' | 'failed'; created_count: number; error: string }

export interface Mock {
  id: number; title: string; exam: number; exam_name: string; duration_minutes: number; total_marks: number
  instructions: string; total_questions: number; created_at: string
  sections: { name: string; count: number; marks_per_question: number; negative_marks: number }[]
}

export interface SessionQuestion {
  id: number; order: number; section: string; text: string; marks: number; negative_marks: number
  options: { id: number; text: string }[]
}
export interface SessionAnswer { selected_option: number | null; marked: boolean; visited: boolean; time_spent_seconds: number }
export interface SessionData {
  id: number; status: 'in_progress' | 'submitted' | 'expired'
  mock: { id: number; title: string; exam_name: string; duration_minutes: number; total_marks: number }
  expires_at: string; server_time: string; remaining_seconds: number; current_index: number
  questions: SessionQuestion[]; answers: Record<string, SessionAnswer>
}
export interface HistoryRow {
  id: number; mock_title: string; exam_name: string; status: string; started_at: string
  submitted_at: string | null; score: number | null; total_marks: number; accuracy: number | null
}

export interface Bucket { name: string; subject?: string; attempted: number; correct: number; incorrect: number; score: number; time: number; total: number; accuracy: number }
export interface ResultQuestion {
  mock_question: number; question_id: number; order: number; section: string; text: string
  options: { id: number; text: string; is_correct: boolean }[]
  selected_option: number | null; correct_option: number | null
  outcome: 'correct' | 'incorrect' | 'unattempted'; marks_awarded: number; marks: number; time_spent: number
  subject: string; topic: string | null; explanation: string | null
}
export interface ResultData {
  session_id: number; mock: SessionData['mock']
  result: {
    score: number; total_marks: number; attempted: number; correct: number; incorrect: number; unattempted: number
    accuracy: number; time_used_seconds: number; duration_seconds: number
    analysis: {
      subjects: Bucket[]; sections: Bucket[]; weak_topics: Bucket[]; strong_topics: Bucket[]
      slowest_questions: { order: number; section: string; time_spent: number; outcome: string }[]
    }
  }
  questions: ResultQuestion[]
}
export interface AnalyticsSummary {
  tests_taken: number; average_accuracy: number; best_score: number
  history: { session_id: number; title: string; exam: string; score: number; total_marks: number; accuracy: number; date: string }[]
  subjects: { subject: string; attempted: number; correct: number; accuracy: number }[]
  weak_topics: { subject: string; topic: string; attempted: number; accuracy: number }[]
  strong_topics: { subject: string; topic: string; attempted: number; accuracy: number }[]
}
