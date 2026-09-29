import type { SessionQuestion } from '../../api/types'
import { AnswerState, PaletteStatus, paletteStatus } from '../../store/examStore'
import type { SectionRange } from '../../utils/exam'

export const STATUS_STYLE: Record<PaletteStatus, string> = {
  not_visited: 'bg-slate-100 text-slate-500 border border-slate-200',
  not_answered: 'bg-red-500 text-white shadow-sm border border-red-600',
  answered: 'bg-green-600 text-white shadow-sm border border-green-700',
  marked: 'bg-yellow-400 text-slate-800 shadow-sm border border-yellow-500',
  answered_marked: 'bg-yellow-400 text-slate-800 shadow-sm border-2 border-green-600',
}

const LEGEND: [PaletteStatus, string][] = [
  ['answered', 'Answered'], ['not_answered', 'Not answered'], ['marked', 'Marked for review'],
  ['answered_marked', 'Answered & marked'], ['not_visited', 'Not visited'],
]

interface Props {
  questions: SessionQuestion[]
  answers: Record<number, AnswerState>
  sections: SectionRange[]
  current: number
  onSelect: (index: number) => void
}

export default function QuestionPalette({ questions, answers, sections, current, onSelect }: Props) {
  const counts = questions.reduce<Record<PaletteStatus, number>>(
    (acc, q) => { acc[paletteStatus(answers[q.id])] += 1; return acc },
    { not_visited: 0, not_answered: 0, answered: 0, marked: 0, answered_marked: 0 },
  )
  return (
    <aside className="rounded-xl border border-slate-200 bg-white flex max-h-[calc(100vh-11rem)] flex-col shadow-sm" aria-label="Question palette">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          Question Palette
        </h2>
        <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 text-[11px] font-medium text-slate-600">
          {LEGEND.map(([status, label]) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${STATUS_STYLE[status]}`}>
                {counts[status]}
              </span>
              <span className="leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-6">
        {sections.map((sec) => (
          <div key={sec.name + sec.start}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{sec.name}</h3>
            <div className="grid grid-cols-5 gap-2 px-1 pb-1">
              {questions.slice(sec.start, sec.start + sec.count).map((q, i) => {
                const index = sec.start + i
                const isActive = index === current
                return (
                  <button
                    key={q.id}
                    onClick={() => onSelect(index)}
                    aria-label={`Question ${index + 1}`}
                    aria-current={isActive}
                    className={`h-9 w-full rounded-md text-sm font-bold transition-all duration-200 ${STATUS_STYLE[paletteStatus(answers[q.id])]} ${
                      isActive ? 'ring-2 ring-indigo-600 ring-offset-2 ring-offset-slate-50 scale-110 shadow-md z-10 relative' : 'hover:scale-105 hover:shadow-sm'
                    }`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
