import type { SessionQuestion } from '../api/types'

export const pad = (n: number) => String(n).padStart(2, '0')

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}

export interface SectionRange { name: string; start: number; count: number }

export function deriveSections(questions: SessionQuestion[]): SectionRange[] {
  const out: SectionRange[] = []
  questions.forEach((q, i) => {
    const last = out[out.length - 1]
    if (last && last.name === q.section) last.count += 1
    else out.push({ name: q.section, start: i, count: 1 })
  })
  return out
}
