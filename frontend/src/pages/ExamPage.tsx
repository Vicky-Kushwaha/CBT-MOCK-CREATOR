import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSession, submitSession } from '../api/endpoints'
import { errorMessage } from '../api/client'
import QuestionPalette from '../features/exam/QuestionPalette'
import SubmitDialog from '../features/exam/SubmitDialog'
import { useAutosave } from '../features/exam/useAutosave'
import { useFullscreen } from '../features/exam/useFullscreen'
import { useKeyboardNav } from '../features/exam/useKeyboardNav'
import { Backup, backupKey, useExamStore } from '../store/examStore'
import { deriveSections, formatClock } from '../utils/exam'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function readBackup(id: number): Backup | null {
  try {
    const raw = localStorage.getItem(backupKey(id))
    return raw ? (JSON.parse(raw) as Backup) : null
  } catch { return null }
}

export default function ExamPage() {
  const sessionId = Number(useParams().sessionId)
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSubmit, setShowSubmit] = useState(false)
  const fullscreen = useFullscreen()

  const { questions, answers, currentIndex, remaining, phase, title } = useExamStore()
  const load = useExamStore((s) => s.load)
  const sections = useMemo(() => deriveSections(questions), [questions])
  const active = phase === 'active'
  const flush = useAutosave(sessionId, !loading && (active || phase === 'submitting'))

  useEffect(() => {
    let alive = true
    getSession(sessionId)
      .then((s) => {
        if (!alive) return
        if (s.status !== 'in_progress') { nav(`/result/${sessionId}`, { replace: true }); return }
        load(s, readBackup(sessionId))
        setLoading(false)
      })
      .catch((e) => alive && setError(errorMessage(e)))
    return () => { alive = false; useExamStore.getState().reset() }
  }, [sessionId, load, nav])

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => useExamStore.getState().tick(), 1000)
    return () => clearInterval(id)
  }, [active])

  useEffect(() => {
    if (!active) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [active])

  useEffect(() => {
    if (!active) return
    // Push a dummy state to trap the back button
    window.history.pushState(null, '', window.location.href)
    const handlePopState = (e: PopStateEvent) => {
      // If the user presses back, we push the state again to trap them
      window.history.pushState(null, '', window.location.href)
      // Optionally alert them
      alert('You cannot leave the exam without submitting. Please click the Submit button to finish your test.')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [active])

  const doSubmit = useCallback(async (auto: boolean) => {
    const store = useExamStore.getState()
    if (store.phase !== 'active') return
    store.setPhase('submitting')
    for (let i = 0; i < 6; i++) { if (await flush()) break; await sleep(500) }
    for (;;) {
      try {
        await submitSession(sessionId)
        break
      } catch (e) {
        // when time has run out we must keep retrying; otherwise let the student try again
        if (!auto) { store.setPhase('active'); setError(errorMessage(e)); return }
        await sleep(3000)
      }
    }
    localStorage.removeItem(backupKey(sessionId))
    store.setPhase('submitted')
    if (document.fullscreenElement) void document.exitFullscreen()
    nav(`/result/${sessionId}`, { replace: true })
  }, [flush, nav, sessionId])

  useEffect(() => {
    if (!loading && active && remaining <= 0) void doSubmit(true)
  }, [loading, active, remaining, doSubmit])

  const saveAndNext = useCallback(() => {
    const s = useExamStore.getState()
    if (s.currentIndex >= s.questions.length - 1) setShowSubmit(true)
    else s.next()
  }, [])
  useKeyboardNav(active && !showSubmit, saveAndNext)

  if (error && loading) return <div className="p-10 text-center text-red-700">{error}</div>
  if (loading) return <div className="p-10 text-center text-ink-soft">Loading your exam…</div>

  const q = questions[currentIndex]
  const a = answers[q.id]
  const currentSection = sections.find((s) => currentIndex >= s.start && currentIndex < s.start + s.count)
  const isLast = currentIndex === questions.length - 1

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-rail px-4 py-3 text-white">
        <h1 className="text-base font-semibold sm:text-lg">{title}</h1>
        <div className="flex items-center gap-3">
          <div
            className={`rounded bg-white/15 px-3 py-1 font-mono text-lg tabular-nums ${remaining <= 300 ? 'bg-red-600' : ''}`}
            role="timer" aria-label="Time remaining"
          >
            {formatClock(remaining)}
          </div>
          <button className="btn border border-white/40 text-white hover:bg-white/10" onClick={fullscreen.toggle}>
            {fullscreen.on ? 'Exit full screen' : 'Full screen'}
          </button>
          <button className="btn bg-white text-rail hover:bg-slate-100" onClick={() => setShowSubmit(true)}>Submit</button>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b bg-white px-4" aria-label="Sections">
        {sections.map((s) => (
          <button
            key={s.name + s.start}
            onClick={() => useExamStore.getState().goTo(s.start)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${
              s === currentSection ? 'border-rail text-rail' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {s.name}
          </button>
        ))}
      </nav>

      {error && <div className="bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <main className="grid flex-1 gap-4 p-4 lg:grid-cols-[320px_1fr]">
        <div className="order-2 lg:order-1">
          <QuestionPalette
            questions={questions} answers={answers} sections={sections} current={currentIndex}
            onSelect={(i) => useExamStore.getState().goTo(i)}
          />
        </div>

        <section className="card order-1 flex flex-col lg:order-2" aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-sm">
            <h2 className="font-semibold">Question {currentIndex + 1} of {questions.length}</h2>
            <span className="text-ink-soft">
              {currentSection?.name} · +{q.marks} for correct{q.negative_marks > 0 ? `, −${q.negative_marks} for wrong` : ''}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-lg leading-relaxed">{q.text}</p>

          <div className="mt-6 space-y-3" role="radiogroup" aria-label="Options">
            {q.options.map((o, i) => (
              <label
                key={o.id}
                className={`flex cursor-pointer items-start gap-3 rounded border p-3 ${
                  a.selected === o.id ? 'border-rail bg-blue-50' : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio" name={`q-${q.id}`} checked={a.selected === o.id}
                  onChange={() => useExamStore.getState().select(o.id)} className="mt-1"
                />
                <span><span className="mr-2 font-semibold text-ink-soft">{'ABCDEF'[i]}.</span>{o.text}</span>
              </label>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3 border-t pt-4">
            <button className="btn-outline" onClick={() => useExamStore.getState().prev()} disabled={currentIndex === 0}>Previous</button>
            <button className="btn-outline" onClick={() => useExamStore.getState().toggleMark()}>
              {a.marked ? 'Unmark review' : 'Mark for review'}
            </button>
            <button className="btn-outline" onClick={() => useExamStore.getState().clear()} disabled={a.selected === null}>Clear response</button>
            <button className="btn-primary ml-auto" onClick={saveAndNext}>{isLast ? 'Save & review' : 'Save & next'}</button>
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-100 p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Keyboard Shortcuts</h4>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <span className="flex gap-1"><kbd className="flex h-5 items-center justify-center rounded border border-slate-300 bg-white px-1.5 font-sans shadow-sm font-bold text-slate-700">←</kbd><kbd className="flex h-5 items-center justify-center rounded border border-slate-300 bg-white px-1.5 font-sans shadow-sm font-bold text-slate-700">→</kbd></span>
                <span>Move</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex gap-1"><kbd className="flex h-5 items-center justify-center rounded border border-slate-300 bg-white px-1.5 font-sans shadow-sm font-bold text-slate-700">A-D</kbd> or <kbd className="flex h-5 items-center justify-center rounded border border-slate-300 bg-white px-1.5 font-sans shadow-sm font-bold text-slate-700">1-4</kbd></span>
                <span>Choose option</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="flex h-5 items-center justify-center rounded border border-slate-300 bg-white px-1.5 font-sans shadow-sm font-bold text-slate-700">M</kbd>
                <span>Mark/Unmark</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="flex h-5 items-center justify-center rounded border border-slate-300 bg-white px-2 font-sans shadow-sm font-bold text-slate-700">Backspace</kbd>
                <span>Clear response</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="flex h-5 items-center justify-center rounded border border-slate-300 bg-white px-2 font-sans shadow-sm font-bold text-indigo-600">Enter</kbd>
                <span>Save & next</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {showSubmit && (
        <SubmitDialog
          questions={questions} answers={answers} sections={sections} submitting={phase === 'submitting'}
          onCancel={() => setShowSubmit(false)} onConfirm={() => void doSubmit(false)}
        />
      )}
    </div>
  )
}
