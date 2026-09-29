import { FormEvent, useMemo, useState } from 'react'
import { errorMessage } from '../api/client'
import { createQuestion } from '../api/endpoints'
import type { Exam } from '../api/types'

interface Props { exam: Exam; onClose: () => void; onSaved: () => void }

export default function ManualQuestionModal({ exam, onClose, onSaved }: Props) {
  const subjects = useMemo(() => {
    const seen = new Map<number, string>()
    exam.pattern?.sections.forEach((s) => seen.set(s.subject, s.subject_name))
    return [...seen.entries()].map(([id, name]) => ({ id, name }))
  }, [exam])

  const [subject, setSubject] = useState<number>(subjects[0]?.id ?? 0)
  const [topic, setTopic] = useState('')
  const [text, setText] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correct, setCorrect] = useState(0)
  const [difficulty, setDifficulty] = useState('medium')
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  function reset() {
    setText(''); setOptions(['', '', '', '']); setCorrect(0); setExplanation('')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await createQuestion({
        exam: exam.slug, subject, topic, text: text.trim(), options: options.map((o) => o.trim()),
        correct_index: correct, difficulty, explanation,
      })
      setSavedCount((c) => c + 1)
      reset()
      onSaved()
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={submit} className="card my-8 w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add your own question</h2>
          <button type="button" className="text-2xl leading-none text-ink-soft" onClick={onClose} aria-label="Close">×</button>
        </div>
        {savedCount > 0 && <p className="rounded bg-green-50 p-2 text-sm text-green-700">{savedCount} question(s) added. Add another or close.</p>}

        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label">Subject</label>
            <select className="input" value={subject} onChange={(e) => setSubject(Number(e.target.value))}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          <div><label className="label">Topic (optional)</label>
            <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} /></div>
          <div><label className="label">Difficulty</label>
            <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select></div>
        </div>

        <div><label className="label">Question</label>
          <textarea className="input min-h-[90px]" value={text} onChange={(e) => setText(e.target.value)} required minLength={10} /></div>

        <div className="space-y-2">
          <label className="label">Options (select the correct one)</label>
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} aria-label={`Option ${i + 1} is correct`} />
              <input className="input" placeholder={`Option ${String.fromCharCode(65 + i)}`} value={o} required
                onChange={(e) => setOptions((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))} />
            </div>
          ))}
        </div>

        <div><label className="label">Explanation (optional)</label>
          <textarea className="input" value={explanation} onChange={(e) => setExplanation(e.target.value)} /></div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>Done</button>
          <button className="btn-primary" disabled={busy || !subject}>{busy ? 'Saving…' : 'Save question'}</button>
        </div>
      </form>
    </div>
  )
}
