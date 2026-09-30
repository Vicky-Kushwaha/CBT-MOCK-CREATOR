import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import {
  assignSubject, checkAvailability, classifyPaper, createMock, deletePaper, getGenerationJob, listExams,
  listPapers, startGeneration, uploadPaper, deleteExam
} from '../api/endpoints'
import type { Exam, Paper } from '../api/types'
import ManualQuestionModal from '../components/ManualQuestionModal'
import ConfirmModal from '../components/ConfirmModal'
import AddExamModal from '../components/AddExamModal'

const STEPS = [
  { name: 'Select exam', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { name: 'Upload papers', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg> },
  { name: 'Check & create', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
]

function Stepper({ step }: { step: number }) {
  return (
    <div className="mb-10 px-4 md:px-12">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 -z-10 h-1 w-full -translate-y-1/2 rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}></div>
        </div>
        {STEPS.map((s, i) => {
          const active = i === step
          const past = i < step
          return (
            <div key={s.name} className={`flex flex-col items-center ${active || past ? 'text-indigo-600' : 'text-slate-400'}`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-50 transition-colors duration-300 ${past ? 'bg-indigo-600 text-white' : active ? 'border-indigo-100 bg-white shadow-md' : 'bg-slate-100'}`}>
                {s.icon}
              </div>
              <span className="mt-2 text-xs md:text-sm font-semibold">{s.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CreateMockPage() {
  const [step, setStep] = useState(0)
  const [exam, setExam] = useState<Exam | null>(null)
  const [selected, setSelected] = useState<number[]>([])

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <h1 className="mb-8 text-center text-3xl font-bold tracking-tight text-slate-800">Create a Mock Test</h1>
      <Stepper step={step} />
      
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        {step === 0 && <ExamStep onPick={(e) => { setExam(e); setSelected([]); setStep(1) }} />}
        {step === 1 && exam && (
          <PapersStep exam={exam} selected={selected} setSelected={setSelected}
            onBack={() => setStep(0)} onNext={() => setStep(2)} />
        )}
        {step === 2 && exam && (
          <CheckStep exam={exam} selected={selected} onBack={() => setStep(1)} />
        )}
      </div>
    </div>
  )
}

/* ---------- Step 1 ---------- */
function ExamStep({ onPick }: { onPick: (e: Exam) => void }) {
  const qc = useQueryClient()
  const exams = useQuery({ queryKey: ['exams'], queryFn: listExams })
  const [showAdd, setShowAdd] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null)

  const delMutation = useMutation({
    mutationFn: (slug: string) => deleteExam(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams'] })
      setDeletingExam(null)
    }
  })
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <h2 className="text-xl font-bold text-slate-800">Which exam are you preparing for?</h2>
        <button className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 font-bold text-indigo-600 transition-colors hover:bg-indigo-100" onClick={() => setShowAdd(true)}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New Exam
        </button>
      </div>
      {exams.isLoading && <div className="grid gap-4 md:grid-cols-2">{[1,2].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100"></div>)}</div>}
      {exams.isError && <p className="rounded-lg bg-red-50 p-4 text-center text-red-600">{errorMessage(exams.error)}</p>}
      
      <div className="grid gap-5 sm:grid-cols-2">
        {exams.data?.map((e) => (
          <div key={e.id} className="group relative overflow-hidden rounded-2xl border-2 border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-xl cursor-pointer" onClick={() => onPick(e)}>
            {!e.is_default && (
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button 
                  className="p-1.5 rounded-lg bg-white/80 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm backdrop-blur transition-all"
                  onClick={(ev) => { ev.stopPropagation(); setEditingExam(e); setShowAdd(true) }}
                  title="Edit Exam"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button 
                  className="p-1.5 rounded-lg bg-white/80 text-slate-400 hover:text-red-600 hover:bg-red-50 shadow-sm backdrop-blur transition-all"
                  onClick={(ev) => { ev.stopPropagation(); setDeletingExam(e) }}
                  title="Delete Exam"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            )}
            
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-indigo-50 transition-transform group-hover:scale-150"></div>
            <div className="relative z-10 pointer-events-none">
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-slate-800 pr-12">{e.name}</div>
              </div>
              {e.pattern ? (
                <div className="mt-2 text-sm font-medium text-slate-500 flex flex-col gap-1">
                  <span>{e.pattern.total_questions} Qs · {e.pattern.total_marks} Marks · {e.pattern.duration_minutes} Mins</span>
                </div>
              ) : <div className="mt-2 text-sm font-medium text-amber-600">No pattern configured</div>}
              {e.pattern && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {e.pattern.sections.map((s) => (
                    <span key={s.id} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm">{s.name} ({s.question_count})</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <AddExamModal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditingExam(null) }} initialData={editingExam} />
      
      <ConfirmModal
        isOpen={!!deletingExam}
        title="Delete Exam"
        message={`Are you sure you want to delete ${deletingExam?.name}? This action cannot be undone.`}
        confirmText={delMutation.isPending ? "Deleting..." : "Delete Exam"}
        onConfirm={() => deletingExam && delMutation.mutate(deletingExam.slug)}
        onCancel={() => setDeletingExam(null)}
      />
    </div>
  )
}

/* ---------- Step 2 ---------- */
function PapersStep({ exam, selected, setSelected, onBack, onNext }: {
  exam: Exam; selected: number[]; setSelected: (ids: number[]) => void; onBack: () => void; onNext: () => void
}) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const key = ['papers', exam.slug]

  const papers = useQuery({
    queryKey: key,
    queryFn: () => listPapers(exam.slug),
    refetchInterval: (q) => (q.state.data?.some((p) => p.status === 'uploaded' || p.status === 'processing') ? 2500 : false),
  })

  const subjects = useMemo(() => {
    const m = new Map<number, string>()
    exam.pattern?.sections.forEach((s) => m.set(s.subject, s.subject_name))
    return [...m.entries()].map(([id, name]) => ({ id, name }))
  }, [exam])

  const known = useRef<Set<number>>(new Set())
  useEffect(() => {
    const fresh = (papers.data ?? []).filter((p) => p.status === 'extracted' && !known.current.has(p.id))
    if (fresh.length) {
      fresh.forEach((p) => known.current.add(p.id))
      setSelected([...new Set([...selected, ...fresh.map((p) => p.id)])])
    }
  }, [papers.data])

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    setUploading(true); setMsg('')
    try {
      for (const f of Array.from(files)) await uploadPaper(exam.slug, f)
      qc.invalidateQueries({ queryKey: key })
    } catch (e) { setMsg(errorMessage(e)) } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const del = useMutation({
    mutationFn: deletePaper,
    onSuccess: (_d, id) => { setSelected(selected.filter((x) => x !== id)); qc.invalidateQueries({ queryKey: key }) },
  })
  const assign = useMutation({
    mutationFn: ({ id, subject }: { id: number; subject: number }) => assignSubject(id, subject),
    onSuccess: (r) => { setMsg(`${r.updated} question(s) assigned.`); qc.invalidateQueries({ queryKey: key }) },
    onError: (e) => setMsg(errorMessage(e)),
  })
  const classify = useMutation({
    mutationFn: classifyPaper,
    onSuccess: () => { setMsg('Claude is classifying questions. Counts will update shortly.'); qc.invalidateQueries({ queryKey: key }) },
    onError: (e) => setMsg(errorMessage(e)),
  })

  useEffect(() => {
    if (!classify.isSuccess) return
    const t = setInterval(() => qc.invalidateQueries({ queryKey: key }), 3000)
    const stop = setTimeout(() => clearInterval(t), 45000)
    return () => { clearInterval(t); clearTimeout(stop) }
  }, [classify.isSuccess])

  const toggle = (id: number) => setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800">Upload practice papers for {exam.name}</h2>
        <p className="mt-2 text-sm text-slate-500">Upload past papers or mock tests in PDF or Image format. We use AI and OCR to extract questions.</p>
      </div>

      <div 
        className="rounded-3xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-10 text-center transition-all hover:bg-indigo-50 cursor-pointer"
        onClick={() => !uploading && fileRef.current?.click()}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          {uploading ? (
            <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          )}
        </div>
        <h3 className="mb-1 font-bold text-indigo-900">{uploading ? 'Uploading and extracting...' : 'Click to browse files'}</h3>
        <p className="text-sm text-indigo-700/70">Supports PDF, PNG, JPG, WEBP</p>
        <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </div>
      
      {msg && <div className="rounded-xl bg-indigo-50 p-3 text-center text-sm font-medium text-indigo-700">{msg}</div>}

      <div className="space-y-4">
        {papers.data?.length === 0 && <p className="text-center text-sm text-slate-400 italic">No papers uploaded yet. You can skip this and add questions manually in the next step.</p>}
        {papers.data?.map((p: Paper) => (
          <div key={p.id} className={`overflow-hidden rounded-2xl border-2 transition-all ${selected.includes(p.id) ? 'border-indigo-500 bg-white shadow-md' : 'border-slate-100 bg-slate-50 opacity-80'}`}>
            <div className="flex items-center gap-4 p-4 sm:p-5">
              <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" disabled={p.status !== 'extracted'}
                checked={selected.includes(p.id)} onChange={() => toggle(p.id)} aria-label={`Use ${p.original_name}`} />
              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => p.status === 'extracted' && toggle(p.id)}>
                <div className="truncate font-bold text-slate-800">{p.original_name}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs font-medium">
                  {p.status === 'extracted' && (
                    <>
                      <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">{p.extracted_count} valid</span>
                      {p.duplicate_count > 0 && <span className="rounded bg-slate-200 px-2 py-0.5 text-slate-600">{p.duplicate_count} dupes</span>}
                      {p.invalid_count > 0 && <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">{p.invalid_count} invalid</span>}
                      {p.unclassified_count > 0 && <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">{p.unclassified_count} unclassified</span>}
                    </>
                  )}
                  {(p.status === 'uploaded' || p.status === 'processing') && <span className="text-indigo-600 flex items-center gap-1"><svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Extracting...</span>}
                  {p.status === 'failed' && <span className="text-red-600">Failed: {p.error}</span>}
                </div>
              </div>
              <button className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" onClick={() => setDeleteTarget(p.id)}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            {p.status === 'extracted' && p.unclassified_count > 0 && (
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50/50 p-4 text-sm">
                <span className="font-medium text-slate-600">{p.unclassified_count} questions need a subject:</span>
                <button className="rounded-lg bg-indigo-100 px-4 py-1.5 font-semibold text-indigo-700 transition-colors hover:bg-indigo-200" disabled={classify.isPending} onClick={() => classify.mutate(p.id)}>Ask Claude to classify</button>
                <span className="text-slate-400 font-medium">or</span>
                <select className="rounded-lg border-slate-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm outline-none ring-indigo-500 focus:ring-2" defaultValue="" onChange={(e) => {
                  const subject = Number(e.target.value)
                  if (subject) assign.mutate({ id: p.id, subject })
                  e.target.value = ''
                }}>
                  <option value="">Assign all to...</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between border-t border-slate-100 pt-6">
        <button className="rounded-xl px-6 py-2.5 font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700" onClick={onBack}>Back</button>
        <button className="rounded-xl bg-slate-900 px-8 py-2.5 font-bold text-white shadow-md transition-all hover:bg-rail hover:shadow-lg" onClick={onNext}>Continue →</button>
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Remove Paper"
        message="Are you sure you want to remove this paper? Any extracted questions will be permanently deleted."
        confirmText="Remove"
        onConfirm={() => deleteTarget && del.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

/* ---------- Step 3 ---------- */
function CheckStep({ exam, selected, onBack }: { exam: Exam; selected: number[]; onBack: () => void }) {
  const nav = useNavigate()
  const qc = useQueryClient()
  const [manual, setManual] = useState(false)
  const [jobId, setJobId] = useState<number | null>(null)
  const [title, setTitle] = useState(`${exam.name} Mock Test`)
  const [language, setLanguage] = useState('english')
  const [error, setError] = useState('')

  const avail = useQuery({
    queryKey: ['availability', exam.slug, selected],
    queryFn: () => checkAvailability(exam.slug, selected),
  })

  const job = useQuery({
    queryKey: ['gen-job', jobId],
    queryFn: () => getGenerationJob(jobId!),
    enabled: jobId !== null,
    refetchInterval: (q) => (q.state.data && (q.state.data.status === 'done' || q.state.data.status === 'failed') ? false : 2000),
  })

  useEffect(() => {
    if (job.data?.status === 'done') avail.refetch()
  }, [job.data?.status])

  const generate = useMutation({
    mutationFn: () => startGeneration(exam.slug, selected, language),
    onSuccess: (j) => { setError(''); setJobId(j.id) },
    onError: (e) => setError(errorMessage(e)),
  })
  const create = useMutation({
    mutationFn: () => createMock(exam.slug, selected, title, language),
    onSuccess: (m) => { qc.invalidateQueries({ queryKey: ['mocks'] }); nav(`/mocks/${m.id}/instructions`) },
    onError: (e) => setError(errorMessage(e)),
  })

  const a = avail.data
  const running = job.data?.status === 'pending' || job.data?.status === 'running' || generate.isPending

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {avail.isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-indigo-600">
          <svg className="h-10 w-10 animate-spin mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="font-bold">Checking question pool...</p>
        </div>
      )}
      
      {avail.isError && <p className="rounded-xl bg-red-50 p-4 text-center text-red-600 font-medium">{errorMessage(avail.error)}</p>}

      {a && (
        <div className={`overflow-hidden rounded-2xl border-2 shadow-sm ${a.status === 'ok' ? 'border-green-200 bg-white' : 'border-amber-200 bg-white'}`}>
          <div className={`p-6 border-b ${a.status === 'ok' ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${a.status === 'ok' ? 'text-green-800' : 'text-amber-800'}`}>
              {a.status === 'ok' ? (
                <><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Enough questions found!</>
              ) : (
                <><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> More questions needed</>
              )}
            </h2>
            <p className={`mt-1 text-sm font-medium ${a.status === 'ok' ? 'text-green-700' : 'text-amber-700'}`}>
              Found {a.available_questions} valid questions. This exam requires {a.required_questions}.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr><th className="px-6 py-3 font-semibold">Section</th><th className="px-6 py-3 font-semibold text-center">Required</th><th className="px-6 py-3 font-semibold text-center">Available</th><th className="px-6 py-3 font-semibold text-center">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {a.sections.map((s) => (
                  <tr key={s.name} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-800">{s.name}</td>
                    <td className="px-6 py-3 text-center">{s.required}</td>
                    <td className="px-6 py-3 text-center">{s.available}</td>
                    <td className="px-6 py-3 text-center">
                      {s.shortfall ? (
                        <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">Missing {s.shortfall}</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">Ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100">
            {a.unclassified_questions > 0 && <p className="text-sm font-medium text-amber-600 mb-1">⚠️ {a.unclassified_questions} extracted questions have no subject and are not counted.</p>}
            {a.invalid_questions > 0 && <p className="text-sm text-slate-500">ℹ️ {a.invalid_questions} invalid questions were skipped.</p>}
          </div>
        </div>
      )}

      {a?.status === 'insufficient' && (
        <div className="rounded-2xl border-2 border-indigo-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-800">How would you like to add missing questions?</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <button className="group flex flex-col items-start rounded-2xl border-2 border-slate-100 p-5 text-left transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg bg-white" onClick={() => setManual(true)}>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">✍️</div>
              <span className="font-bold text-slate-800">Add manually</span>
              <span className="mt-1 text-xs font-medium text-slate-500">Type or paste questions.</span>
            </button>
            <button className="group flex flex-col items-start rounded-2xl border-2 border-slate-100 p-5 text-left transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg bg-white" onClick={onBack}>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">📄</div>
              <span className="font-bold text-slate-800">Upload more</span>
              <span className="mt-1 text-xs font-medium text-slate-500">Go back to upload PDFs.</span>
            </button>
            <button className="group flex flex-col items-start rounded-2xl border-2 border-slate-100 p-5 text-left transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg bg-white" disabled={running} onClick={() => generate.mutate()}>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-xl text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">🤖</div>
              <span className="font-bold text-slate-800">Generate AI</span>
              <span className="mt-1 text-xs font-medium text-slate-500">Claude writes the missing {a.shortfall}.</span>
            </button>
          </div>
          {running && (
            <div className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-purple-50 p-4 text-purple-700 font-medium">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Generating questions with Claude... please wait.
            </div>
          )}
          {job.data?.status === 'done' && <div className="mt-6 rounded-xl bg-green-50 p-4 text-center font-bold text-green-700">✨ {job.data.created_count} questions generated successfully!</div>}
          {job.data?.status === 'failed' && <div className="mt-6 rounded-xl bg-red-50 p-4 text-center font-bold text-red-600">Generation failed: {job.data.error}</div>}
        </div>
      )}

      {a?.status === 'ok' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block font-bold text-slate-800">Give your Mock Test a Name</label>
          <input className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800 outline-none transition-colors focus:border-indigo-500 focus:bg-white sm:max-w-md" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly Prep #1" />
          
          <label className="mt-6 mb-2 block font-bold text-slate-800">Select Test Language</label>
          <select className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800 outline-none transition-colors focus:border-indigo-500 focus:bg-white sm:max-w-md" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="english">English Only</option>
            <option value="hindi">Hindi Only</option>
            <option value="both">Bilingual (English & Hindi)</option>
          </select>
          <p className="mt-2 text-xs text-slate-500 max-w-md">The AI will generate any missing questions in the selected language format.</p>
        </div>
      )}

      {error && <p className="rounded-xl bg-red-50 p-4 text-center font-medium text-red-600">{error}</p>}

      <div className="mt-8 flex justify-between border-t border-slate-100 pt-6">
        <button className="rounded-xl px-6 py-2.5 font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700" onClick={onBack}>Back</button>
        <button className="rounded-xl bg-slate-900 px-8 py-2.5 font-bold text-white shadow-md transition-all hover:bg-rail hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={a?.status !== 'ok' || create.isPending || !title.trim()} onClick={() => create.mutate()}>
          {create.isPending ? 'Building Mock...' : '✨ Create Mock Test'}
        </button>
      </div>

      {manual && <ManualQuestionModal exam={exam} onClose={() => setManual(false)} onSaved={() => avail.refetch()} />}
    </div>
  )
}
