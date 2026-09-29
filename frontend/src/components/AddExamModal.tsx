import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { createExam, updateExam, listSubjects } from '../api/endpoints'
import { errorMessage } from '../api/client'
import type { Exam } from '../api/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialData?: Exam | null
}

export default function AddExamModal({ isOpen, onClose, initialData }: Props) {
  const qc = useQueryClient()
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: listSubjects })
  
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('60')
  const [sections, setSections] = useState([{ name: '', subject_ids: [] as number[], question_count: '', marks_per_question: '1', negative_marks: '0.33' }])
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name)
      if (initialData.pattern) {
        setDuration(initialData.pattern.duration_minutes.toString())
        setSections(initialData.pattern.sections.map(s => ({
          name: s.name,
          subject_ids: s.subject_ids || [],
          question_count: s.question_count.toString(),
          marks_per_question: s.marks_per_question.toString(),
          negative_marks: s.negative_marks.toString()
        })))
      }
    } else if (isOpen && !initialData) {
      setName('')
      setDuration('60')
      setSections([{ name: '', subject_ids: [], question_count: '', marks_per_question: '1', negative_marks: '0.33' }])
    }
  }, [isOpen, initialData])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  const create = useMutation({
    mutationFn: (data: any) => initialData ? updateExam(initialData.slug, data) : createExam(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams'] })
      onClose()
    }
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Ensure data is valid
    if (!name || !duration) return
    const formattedSections = sections.map(s => ({
      name: s.name,
      subjects: s.subject_ids.map(id => ({ id })), 
      subject_ids: s.subject_ids,
      question_count: parseInt(s.question_count),
      marks_per_question: parseFloat(s.marks_per_question),
      negative_marks: parseFloat(s.negative_marks),
    })).filter(s => !!s.name && s.subject_ids.length > 0 && !isNaN(s.question_count))

    if (formattedSections.length === 0) {
      setFormError("Add at least one complete section with a valid subject mapping.")
      return
    }
    setFormError('')

    create.mutate({
      name,
      description: `Mock Test for ${name}`,
      pattern: {
        duration_minutes: parseInt(duration),
        sections: formattedSections
      }
    })
  }

  const addSection = () => setSections([...sections, { name: '', subject_ids: [], question_count: '', marks_per_question: '1', negative_marks: '0.33' }])
  const removeSection = (i: number) => setSections(sections.filter((_, idx) => idx !== i))

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Edit Exam' : 'Add New Exam'}</h2>
          <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Exam Name <span className="text-red-500">*</span></label>
              <input type="text" required placeholder="e.g. RRB NTPC (CBT-1)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Duration (Minutes) <span className="text-red-500">*</span></label>
              <input type="number" required min="1" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Exam Pattern (Sections)</h3>
              <button type="button" onClick={addSection} className="text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Section
              </button>
            </div>
            
            <div className="space-y-4">
              {sections.map((s, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                  {sections.length > 1 && (
                    <button type="button" onClick={() => removeSection(i)} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                  
                  <div className="grid gap-4 sm:grid-cols-1">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Section Name <span className="text-red-500">*</span></label>
                      <input type="text" required placeholder="e.g. General Science" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none" value={s.name} onChange={e => { const n = [...sections]; n[i].name = e.target.value; setSections(n) }} />
                    </div>
                    <div className="relative mt-2">
                      <label className="mb-2 block text-xs font-semibold text-slate-500">Subject Mapping (Select one or more) <span className="text-red-500">*</span></label>
                      <div className="flex flex-wrap gap-2">
                        {subjects.data?.map(sub => {
                          const isSelected = s.subject_ids.includes(sub.id)
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                const n = [...sections]
                                if (isSelected) {
                                  n[i].subject_ids = n[i].subject_ids.filter(id => id !== sub.id)
                                } else {
                                  n[i].subject_ids = [...n[i].subject_ids, sub.id]
                                }
                                setSections(n)
                              }}
                              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all ${
                                isSelected 
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {sub.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Total Questions <span className="text-red-500">*</span></label>
                      <input type="number" required min="1" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none" value={s.question_count} onChange={e => { const n = [...sections]; n[i].question_count = e.target.value; setSections(n) }} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-emerald-600">Marks for Correct <span className="text-red-500">*</span></label>
                      <input type="number" required min="0" step="0.01" className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none" value={s.marks_per_question} onChange={e => { const n = [...sections]; n[i].marks_per_question = e.target.value; setSections(n) }} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-red-600">Marks for Wrong <span className="text-red-500">*</span></label>
                      <input type="number" required min="0" step="0.01" className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 transition-all focus:border-red-500 focus:bg-white focus:outline-none" value={s.negative_marks} onChange={e => { const n = [...sections]; n[i].negative_marks = e.target.value; setSections(n) }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {formError && (
            <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">{formError}</div>
          )}
          {create.isError && (
            <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">{errorMessage(create.error)}</div>
          )}

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button type="button" className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200" onClick={onClose}>Cancel</button>
            <button type="submit" className="flex-[2] rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg disabled:opacity-70 flex justify-center items-center gap-2" disabled={create.isPending}>
              {create.isPending ? 'Saving...' : initialData ? 'Update Exam' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
