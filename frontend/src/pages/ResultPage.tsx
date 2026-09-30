import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { explainQuestion, getResult } from '../api/endpoints'
import type { Bucket, ResultData, ResultQuestion } from '../api/types'
import { formatDuration } from '../utils/exam'

const OUTCOME: Record<string, string> = {
  correct: 'bg-green-100 text-green-800',
  incorrect: 'bg-red-100 text-red-800',
  unattempted: 'bg-slate-100 text-slate-600',
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded bg-slate-50 p-3 text-center">
      <div className="text-xs text-ink-soft">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}

function BucketTable({ title, rows, showSubject }: { title: string; rows: Bucket[]; showSubject?: boolean }) {
  if (!rows.length) return null
  return (
    <div className="card overflow-x-auto">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <table className="w-full text-sm">
        <thead className="text-left text-ink-soft">
          <tr><th className="py-2">Name</th><th>Attempted</th><th>Correct</th><th>Incorrect</th><th>Accuracy</th><th>Score</th><th>Time</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.subject ?? ''}-${r.name}`} className="border-t border-slate-100">
              <td className="py-2">{r.name}{showSubject && r.subject ? <span className="text-ink-soft"> · {r.subject}</span> : null}</td>
              <td>{r.attempted}/{r.total}</td><td>{r.correct}</td><td>{r.incorrect}</td>
              <td>{r.accuracy}%</td><td>{r.score}</td><td>{formatDuration(r.time)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function QuestionCard({ q, sessionId, prefLang }: { q: ResultQuestion; sessionId: number; prefLang: 'english' | 'hindi' }) {
  const qc = useQueryClient()
  const explain = useMutation({
    mutationFn: () => explainQuestion(q.question_id),
    onSuccess: (text) => {
      qc.setQueryData<ResultData>(['result', sessionId], (old) => old && ({
        ...old,
        questions: old.questions.map((x) => (x.question_id === q.question_id ? { ...x, explanation: text } : x)),
      }))
    },
  })
  return (
    <div id={`q${q.order}`} className="card scroll-mt-6">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold">Q{q.order}</span>
        <span className="text-ink-soft">{q.section}{q.topic ? ` · ${q.topic}` : ''}</span>
        <span className={`rounded px-2 py-0.5 capitalize ${OUTCOME[q.outcome]}`}>{q.outcome}</span>
        <span className="text-ink-soft">{q.marks_awarded > 0 ? '+' : ''}{q.marks_awarded} / {q.marks} · {formatDuration(q.time_spent)}</span>
      </div>
      <p className="whitespace-pre-line text-sm font-medium">{prefLang === 'hindi' && q.text_hi ? q.text_hi : q.text}</p>
      <ul className="mt-3 space-y-1.5">
        {q.options.map((o, i) => {
          const chosen = o.id === q.selected_option
          const cls = o.is_correct ? 'border-green-500 bg-green-50' : chosen ? 'border-red-400 bg-red-50' : 'border-slate-200'
          return (
            <li key={o.id} className={`flex gap-2 rounded border px-3 py-2 text-sm ${cls}`}>
              <span className="font-semibold">{String.fromCharCode(65 + i)}.</span>
              <span className="flex-1">{prefLang === 'hindi' && o.text_hi ? o.text_hi : o.text}</span>
              {o.is_correct && <span className="text-xs font-medium text-green-700">Correct</span>}
              {chosen && !o.is_correct && <span className="text-xs font-medium text-red-700">Your answer</span>}
              {chosen && o.is_correct && <span className="text-xs font-medium text-green-700">Your answer</span>}
            </li>
          )
        })}
      </ul>
      <div className="mt-3 text-sm">
        {q.explanation
          ? <div className="rounded bg-blue-50 p-3 text-ink-soft"><b className="text-ink">Solution: </b><span className="whitespace-pre-line">{prefLang === 'hindi' && q.explanation_hi ? q.explanation_hi : q.explanation}</span></div>
          : (
            <>
              <button className="btn-outline" disabled={explain.isPending} onClick={() => explain.mutate()}>
                {explain.isPending ? 'Asking Claude…' : 'Explain with Claude'}
              </button>
              {explain.isError && <span className="ml-3 text-red-600">{errorMessage(explain.error)}</span>}
            </>
          )}
      </div>
    </div>
  )
}

export default function ResultPage() {
  const nav = useNavigate()
  const sessionId = Number(useParams().sessionId)
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all')
  const [prefLang, setPrefLang] = useState<'english' | 'hindi'>('english')
  const res = useQuery({ queryKey: ['result', sessionId], queryFn: () => getResult(sessionId) })

  if (res.isLoading) return <p className="text-ink-soft">Loading result…</p>
  if (res.isError || !res.data) return <p className="text-red-600">{errorMessage(res.error)}</p>

  const { result: r, mock, questions } = res.data
  const a = r.analysis
  const shown = filter === 'all' ? questions : questions.filter((q) => q.outcome === filter)

  return (
    <div className="space-y-6">
      <div className="card text-center relative pt-8">
        <button onClick={() => nav(-1)} className="absolute top-4 left-4 flex items-center justify-center rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" title="Go back">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <p className="text-sm text-ink-soft">{mock.title}</p>
        <h1 className="mt-1 text-sm font-semibold uppercase tracking-wide text-ink-soft">Mock test result</h1>
        <p className="mt-2 text-5xl font-semibold text-rail">{r.score} <span className="text-2xl text-ink-soft">/ {r.total_marks}</span></p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Accuracy" value={`${r.accuracy}%`} />
          <Stat label="Attempted" value={r.attempted} />
          <Stat label="Correct" value={r.correct} />
          <Stat label="Incorrect" value={r.incorrect} />
          <Stat label="Unattempted" value={r.unattempted} />
          <Stat label="Time used" value={formatDuration(r.time_used_seconds)} />
        </div>
        <div className="mt-5 flex justify-center gap-2">
          <Link to="/" className="btn-outline">Dashboard</Link>
          <Link to={`/mocks/${mock.id}/instructions`} className="btn-primary">Retake</Link>
        </div>
      </div>

      <BucketTable title="Subject analysis" rows={a.subjects} />
      <BucketTable title="Section analysis" rows={a.sections} />

      <div className="grid gap-6 md:grid-cols-2">
        <BucketTable title="Weak topics" rows={a.weak_topics} showSubject />
        <BucketTable title="Strong topics" rows={a.strong_topics} showSubject />
      </div>

      {a.slowest_questions.length > 0 && (
        <div className="card">
          <h2 className="mb-3 font-semibold">Most time-consuming questions</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {a.slowest_questions.map((s) => (
              <li key={s.order} className="rounded border border-slate-200 px-3 py-1.5">
                Q{s.order} · {formatDuration(s.time_spent)} · <span className="capitalize">{s.outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2 className="mb-3 font-semibold">Answer Key</h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
          {questions.map((q) => {
            const correctOptIndex = q.options.findIndex((o) => o.is_correct)
            const correctLetter = correctOptIndex >= 0 ? String.fromCharCode(65 + correctOptIndex) : '-'
            const chosenOptIndex = q.options.findIndex((o) => o.id === q.selected_option)
            const chosenLetter = chosenOptIndex >= 0 ? String.fromCharCode(65 + chosenOptIndex) : '-'
            const bgClass = q.outcome === 'correct' ? 'bg-green-100 text-green-800 border-green-200' : q.outcome === 'incorrect' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
            return (
              <a href={`#q${q.order}`} key={q.mock_question} className={`rounded border p-2 text-center text-xs hover:opacity-80 ${bgClass}`}>
                <div className="font-semibold opacity-75">Q{q.order}</div>
                <div className="mt-0.5 text-base font-bold">{correctLetter}</div>
                {chosenLetter !== '-' && chosenLetter !== correctLetter && <div className="mt-0.5 text-[10px] opacity-75 line-through">You: {chosenLetter}</div>}
              </a>
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Question-wise solutions</h2>
          <div className="flex gap-1">
            {(['all', 'correct', 'incorrect', 'unattempted'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded px-3 py-1 text-sm capitalize ${filter === f ? 'bg-rail text-white' : 'border border-slate-300 bg-white'}`}>{f}</button>
            ))}
            {mock.language === 'both' && (
              <select
                className="ml-2 rounded border border-slate-300 bg-white px-3 py-1 text-sm outline-none"
                value={prefLang}
                onChange={(e) => setPrefLang(e.target.value as any)}
              >
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
              </select>
            )}
          </div>
        </div>
        <div className="space-y-4">
          {shown.map((q) => <QuestionCard key={q.mock_question} q={q} sessionId={sessionId} prefLang={prefLang} />)}
          {shown.length === 0 && <p className="text-sm text-ink-soft">No questions in this filter.</p>}
        </div>
      </div>
    </div>
  )
}
