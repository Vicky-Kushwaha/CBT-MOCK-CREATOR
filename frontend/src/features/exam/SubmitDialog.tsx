import type { SessionQuestion } from '../../api/types'
import { AnswerState, paletteStatus } from '../../store/examStore'
import type { SectionRange } from '../../utils/exam'

interface Props {
  questions: SessionQuestion[]
  answers: Record<number, AnswerState>
  sections: SectionRange[]
  submitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function SubmitDialog({ questions, answers, sections, submitting, onCancel, onConfirm }: Props) {
  const rows = sections.map((sec) => {
    const qs = questions.slice(sec.start, sec.start + sec.count)
    const statuses = qs.map((q) => paletteStatus(answers[q.id]))
    return {
      name: sec.name, total: qs.length,
      answered: statuses.filter((s) => s === 'answered' || s === 'answered_marked').length,
      notAnswered: statuses.filter((s) => s === 'not_answered').length,
      marked: statuses.filter((s) => s === 'marked' || s === 'answered_marked').length,
      notVisited: statuses.filter((s) => s === 'not_visited').length,
    }
  })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="submit-title">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h2 id="submit-title" className="text-lg font-semibold">Submit this test?</h2>
        <p className="mt-1 text-sm text-ink-soft">You cannot change your answers after submitting.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-ink-soft">
              <tr><th className="py-2 pr-3">Section</th><th className="px-2">Questions</th><th className="px-2">Answered</th><th className="px-2">Not answered</th><th className="px-2">Marked</th><th className="px-2">Not visited</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{r.name}</td>
                  <td className="px-2">{r.total}</td><td className="px-2">{r.answered}</td>
                  <td className="px-2">{r.notAnswered}</td><td className="px-2">{r.marked}</td><td className="px-2">{r.notVisited}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-outline" onClick={onCancel} disabled={submitting}>Back to test</button>
          <button className="btn-danger" onClick={onConfirm} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit test'}</button>
        </div>
      </div>
    </div>
  )
}
