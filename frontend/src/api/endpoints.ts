import { api } from './client'
import type {
  AnalyticsSummary, Availability, Exam, GenerationJob, HistoryRow, Mock, MockAnswerKeyData, Paper, ResultData, SessionData, Subject,
} from './types'

export const login = (username: string, password: string) =>
  api.post<{ access: string; refresh: string }>('/auth/login/', { username, password }).then((r) => r.data)
export const register = (username: string, email: string, password: string) =>
  api.post('/auth/register/', { username, email, password }).then((r) => r.data)

export const listExams = () => api.get<Exam[]>('/exams/').then((r) => r.data)
export const createExam = (data: any) => api.post<Exam>('/exams/', data).then((r) => r.data)
export const updateExam = (slug: string, data: any) => api.put<Exam>(`/exams/${slug}/`, data).then((r) => r.data)
export const deleteExam = (slug: string) => api.delete(`/exams/${slug}/`)
export const listSubjects = () => api.get<Subject[]>('/subjects/').then((r) => r.data)

export const listPapers = (exam: string) => api.get<Paper[]>('/papers/', { params: { exam } }).then((r) => r.data)
export const uploadPaper = (exam: string, file: File) => {
  const form = new FormData()
  form.append('exam', exam)
  form.append('file', file)
  return api.post<Paper>('/papers/', form).then((r) => r.data)
}
export const deletePaper = (id: number) => api.delete(`/papers/${id}/`)
export const assignSubject = (paperId: number, subject: number) =>
  api.post(`/papers/${paperId}/assign-subject/`, { subject }).then((r) => r.data)
export const classifyPaper = (paperId: number) => api.post(`/papers/${paperId}/classify/`).then((r) => r.data)

export interface ManualQuestion {
  exam: string; subject: number; topic: string; text: string; options: string[]
  correct_index: number; difficulty: string; explanation: string
}
export const createQuestion = (q: ManualQuestion) => api.post('/questions/', q).then((r) => r.data)
export const explainQuestion = (id: number) =>
  api.post<{ explanation: string }>(`/questions/${id}/explain/`).then((r) => r.data.explanation)

export const checkAvailability = (exam: string, paper_ids: number[]) =>
  api.post<Availability>('/mocks/availability/', { exam, paper_ids }).then((r) => r.data)
export const startGeneration = (exam: string, paper_ids: number[]) =>
  api.post<GenerationJob>('/mocks/generate-missing/', { exam, paper_ids }).then((r) => r.data)
export const getGenerationJob = (id: number) => api.get<GenerationJob>(`/mocks/generation-jobs/${id}/`).then((r) => r.data)
export const createMock = (exam: string, paper_ids: number[], title: string) =>
  api.post<Mock>('/mocks/', { exam, paper_ids, title }).then((r) => r.data)
export const listMocks = () => api.get<Mock[]>('/mocks/').then((r) => r.data)
export const getMock = (id: number) => api.get<Mock>(`/mocks/${id}/`).then((r) => r.data)
export const getMockAnswerKey = (id: number) => api.get<MockAnswerKeyData>(`/mocks/${id}/answer_key/`).then((r) => r.data)
export const deleteMock = (id: number) => api.delete(`/mocks/${id}/`)

export const startSession = (mock: number) => api.post<SessionData>('/sessions/', { mock }).then((r) => r.data)
export const getSession = (id: number) => api.get<SessionData>(`/sessions/${id}/`).then((r) => r.data)
export const saveAnswers = (
  id: number,
  answers: { mock_question: number; selected_option: number | null; marked: boolean; visited: boolean; time_spent_seconds: number }[],
  current_index: number,
) => api.put(`/sessions/${id}/answers/`, { answers, current_index }).then((r) => r.data)
export const submitSession = (id: number) => api.post(`/sessions/${id}/submit/`).then((r) => r.data)
export const getResult = (id: number) => api.get<ResultData>(`/sessions/${id}/result/`).then((r) => r.data)
export const listSessions = () => api.get<HistoryRow[]>('/sessions/').then((r) => r.data)

export const getAnalytics = () => api.get<AnalyticsSummary>('/analytics/summary/').then((r) => r.data)
