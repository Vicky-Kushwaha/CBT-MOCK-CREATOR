import { create } from 'zustand'
import type { SessionData, SessionQuestion } from '../api/types'

export interface AnswerState { selected: number | null; marked: boolean; visited: boolean; timeSpent: number }
export type PaletteStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked' | 'answered_marked'

export const emptyAnswer = (): AnswerState => ({ selected: null, marked: false, visited: false, timeSpent: 0 })

export function paletteStatus(a: AnswerState | undefined): PaletteStatus {
  if (!a || !a.visited) return 'not_visited'
  if (a.selected !== null && a.marked) return 'answered_marked'
  if (a.selected !== null) return 'answered'
  if (a.marked) return 'marked'
  return 'not_answered'
}

export interface Backup { answers: Record<number, AnswerState>; dirty: Record<number, true>; currentIndex: number }
export const backupKey = (sessionId: number) => `cbt-session-${sessionId}`

interface ExamState {
  sessionId: number | null
  title: string
  language: string
  questions: SessionQuestion[]
  answers: Record<number, AnswerState>
  dirty: Record<number, true>
  currentIndex: number
  expiresAtMs: number
  clockOffsetMs: number
  remaining: number
  phase: 'idle' | 'active' | 'submitting' | 'submitted'
  load: (s: SessionData, backup?: Backup | null) => void
  reset: () => void
  tick: () => void
  goTo: (index: number) => void
  next: () => void
  prev: () => void
  select: (optionId: number) => void
  clear: () => void
  toggleMark: () => void
  markClean: (synced: Record<number, AnswerState>) => void
  setPhase: (p: ExamState['phase']) => void
}

const initial = {
  sessionId: null, title: '', language: 'english', questions: [], answers: {}, dirty: {}, currentIndex: 0,
  expiresAtMs: 0, clockOffsetMs: 0, remaining: 0, phase: 'idle' as const,
}

/** Live exam state. Purely presentational: the server owns the deadline, saved answers and scoring. */
export const useExamStore = create<ExamState>((set, get) => ({
  ...initial,

  load: (s, backup) => {
    const answers: Record<number, AnswerState> = {}
    const dirty: Record<number, true> = {}
    for (const q of s.questions) {
      const a = s.answers[String(q.id)]
      answers[q.id] = a
        ? { selected: a.selected_option, marked: a.marked, visited: a.visited, timeSpent: a.time_spent_seconds }
        : emptyAnswer()
    }
    // Recover changes that never reached the server (network drop / refresh)
    if (backup) {
      for (const id of Object.keys(backup.dirty).map(Number)) {
        if (answers[id] && backup.answers[id]) { answers[id] = backup.answers[id]; dirty[id] = true }
      }
    }
    const index = Math.min(backup?.currentIndex ?? s.current_index, Math.max(0, s.questions.length - 1))
    const first = s.questions[index]
    if (first && !answers[first.id].visited) {
      answers[first.id] = { ...answers[first.id], visited: true }
      dirty[first.id] = true
    }
    const serverNow = new Date(s.server_time).getTime()
    const expiresAtMs = new Date(s.expires_at).getTime()
    set({
      sessionId: s.id, title: s.mock.title, language: s.mock.language || 'english', questions: s.questions, answers, dirty, currentIndex: index,
      expiresAtMs, clockOffsetMs: serverNow - Date.now(), remaining: s.remaining_seconds, phase: 'active',
    })
  },

  reset: () => set({ ...initial }),

  tick: () => set((s) => {
    if (s.phase !== 'active') return s
    const remaining = Math.max(0, Math.round((s.expiresAtMs - (Date.now() + s.clockOffsetMs)) / 1000))
    const q = s.questions[s.currentIndex]
    if (!q) return { remaining }
    const cur = s.answers[q.id]
    return { remaining, answers: { ...s.answers, [q.id]: { ...cur, timeSpent: cur.timeSpent + 1 } } }
  }),

  goTo: (index) => set((s) => {
    if (index < 0 || index >= s.questions.length || index === s.currentIndex) return s
    const leaving = s.questions[s.currentIndex]
    const target = s.questions[index]
    const answers = { ...s.answers, [target.id]: { ...s.answers[target.id], visited: true } }
    return {
      currentIndex: index, answers,
      dirty: { ...s.dirty, [leaving.id]: true, [target.id]: true },
    }
  }),

  next: () => get().goTo(get().currentIndex + 1),
  prev: () => get().goTo(get().currentIndex - 1),

  select: (optionId) => set((s) => {
    const q = s.questions[s.currentIndex]
    return {
      answers: { ...s.answers, [q.id]: { ...s.answers[q.id], selected: optionId, visited: true } },
      dirty: { ...s.dirty, [q.id]: true },
    }
  }),

  clear: () => set((s) => {
    const q = s.questions[s.currentIndex]
    return {
      answers: { ...s.answers, [q.id]: { ...s.answers[q.id], selected: null } },
      dirty: { ...s.dirty, [q.id]: true },
    }
  }),

  toggleMark: () => set((s) => {
    const q = s.questions[s.currentIndex]
    const cur = s.answers[q.id]
    return {
      answers: { ...s.answers, [q.id]: { ...cur, marked: !cur.marked, visited: true } },
      dirty: { ...s.dirty, [q.id]: true },
    }
  }),

  // Only clear dirty flags for entries that did not change while the request was in flight
  markClean: (synced) => set((s) => {
    const dirty = { ...s.dirty }
    for (const [id, a] of Object.entries(synced)) {
      const now = s.answers[Number(id)]
      if (now && now.selected === a.selected && now.marked === a.marked && now.visited === a.visited) delete dirty[Number(id)]
    }
    return { dirty }
  }),

  setPhase: (phase) => set({ phase }),
}))
