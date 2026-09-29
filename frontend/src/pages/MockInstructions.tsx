import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { getMock, startSession } from '../api/endpoints'

export default function MockInstructions() {
  const id = Number(useParams().id)
  const nav = useNavigate()
  const [agree, setAgree] = useState(false)
  const mock = useQuery({ queryKey: ['mock', id], queryFn: () => getMock(id) })

  const start = useMutation({
    mutationFn: () => startSession(id),
    onSuccess: async (s) => {
      try { await document.documentElement.requestFullscreen?.() } catch { /* user can still take the test */ }
      nav(`/exam/${s.id}`)
    },
  })

  if (mock.isLoading) return (
    <div className="mx-auto max-w-4xl space-y-6 py-8 animate-pulse">
      <div className="h-40 rounded-3xl bg-slate-200"></div>
      <div className="h-64 rounded-3xl bg-slate-200"></div>
    </div>
  )
  if (mock.isError || !mock.data) return <div className="mx-auto max-w-4xl pt-10 text-center text-red-600 font-bold">{errorMessage(mock.error)}</div>
  const m = mock.data

  return (
    <div className="mx-auto max-w-4xl pb-12 pt-4">
      {/* Header Card */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-lg border border-slate-100 mb-8 relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-600 to-blue-500"></div>
        <div className="relative z-10 px-8 pt-20 pb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-xl text-3xl">
            📝
          </div>
          <h1 className="text-3xl font-bold text-slate-800">{m.title}</h1>
          <p className="mt-2 text-lg font-medium text-slate-500">{m.exam_name}</p>
          
          <div className="mt-8 grid grid-cols-3 gap-6">
            <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 transition-transform hover:scale-105">
              <dt className="text-sm font-semibold uppercase tracking-wider text-slate-500">Duration</dt>
              <dd className="mt-1 text-3xl font-bold text-indigo-600">{m.duration_minutes}<span className="text-lg font-medium text-slate-500 ml-1">min</span></dd>
            </div>
            <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 transition-transform hover:scale-105">
              <dt className="text-sm font-semibold uppercase tracking-wider text-slate-500">Questions</dt>
              <dd className="mt-1 text-3xl font-bold text-indigo-600">{m.total_questions}</dd>
            </div>
            <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 transition-transform hover:scale-105">
              <dt className="text-sm font-semibold uppercase tracking-wider text-slate-500">Total marks</dt>
              <dd className="mt-1 text-3xl font-bold text-indigo-600">{m.total_marks}</dd>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Sections Info */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Exam Pattern</h2>
          </div>
          
          <div className="space-y-4">
            {m.sections.map((s) => (
              <div key={s.name} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-indigo-100">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 leading-tight">{s.name}</h3>
                  <div className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                    <span>{s.count} Questions</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-indigo-600 line-clamp-1" title={s.subjects?.join(', ')}>{s.subjects?.join(', ')}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1.5 rounded-lg">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    +{s.marks_per_question} Mark
                  </div>
                  {s.negative_marks ? (
                    <div className="flex items-center gap-1.5 font-bold text-red-700 bg-red-100 px-2.5 py-1.5 rounded-lg">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      −{s.negative_marks} Penalty
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 font-bold text-slate-500 bg-slate-200 px-2.5 py-1.5 rounded-lg">
                      No negative marks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Instructions</h2>
          </div>

          <ul className="space-y-4 text-sm font-medium text-slate-600 flex-1">
            <li className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mt-0.5"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg></div>
              <div className="leading-relaxed">Timer runs securely on the server. Refreshing or accidentally closing the page does not pause it, but your progress is automatically saved.</div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mt-0.5"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg></div>
              <div className="leading-relaxed">Answers save automatically when selected. Click <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-bold text-slate-700 shadow-sm">Save & Next</span> to confirm your choice and proceed.</div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mt-0.5"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg></div>
              <div className="leading-relaxed">Keyboard shortcuts: Use <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-bold text-slate-700 shadow-sm font-sans">1-4</kbd> or <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-bold text-slate-700 shadow-sm font-sans">A-D</kbd> to pick options. Use <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-bold text-slate-700 shadow-sm font-sans">←</kbd> <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-bold text-slate-700 shadow-sm font-sans">→</kbd> arrows to navigate quickly between questions.</div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mt-0.5"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg></div>
              <div className="leading-relaxed">The test submits automatically when the time runs out. The exam will open in full-screen mode to prevent distractions.</div>
            </li>
          </ul>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-transparent p-3 transition-colors hover:bg-slate-50">
              <div className="pt-0.5">
                <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              </div>
              <span className="font-semibold text-slate-700">I have read and understood the instructions.</span>
            </label>
            
            {start.isError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{errorMessage(start.error)}</p>}
            
            <div className="mt-6 flex gap-3">
              <button className="flex-1 rounded-xl px-4 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-100" onClick={() => nav('/')}>Cancel</button>
              <button className={`flex-[2] flex items-center justify-center gap-2 rounded-xl px-8 py-3 font-bold text-white shadow-md transition-all ${!agree || start.isPending ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}`} disabled={!agree || start.isPending} onClick={() => start.mutate()}>
                {start.isPending ? (
                  <><svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Starting...</>
                ) : (
                  <>Start Test <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
