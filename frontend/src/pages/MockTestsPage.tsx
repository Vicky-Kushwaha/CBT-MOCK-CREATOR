import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { deleteMock, listMocks } from '../api/endpoints'
import ConfirmModal from '../components/ConfirmModal'

export default function MockTestsPage() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(12)
  
  const mocks = useQuery({ queryKey: ['mocks'], queryFn: listMocks })
  const del = useMutation({
    mutationFn: deleteMock,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mocks'] }),
  })

  // Group mocks by exam category
  const categorizedMocks = (mocks.data || []).reduce((acc, mock) => {
    const category = mock.exam_name || 'Other Exams'
    if (!acc[category]) acc[category] = []
    acc[category].push(mock)
    return acc
  }, {} as Record<string, typeof mocks.data>)

  const categories = Object.keys(categorizedMocks).sort()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const selectedCategory = activeCategory || (categories.length > 0 ? categories[0] : null)
  const displayedMocks = selectedCategory ? categorizedMocks[selectedCategory] : []

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mock Tests</h1>
          <p className="mt-1 text-slate-500">Choose an exam category to start practicing.</p>
        </div>
        <Link to="/create" className="btn inline-flex items-center gap-2 bg-indigo-600 text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create mock test
        </Link>
      </div>

      {mocks.isLoading && (
        <div className="space-y-6">
          <div className="flex gap-3"><div className="h-10 w-32 animate-pulse rounded-full bg-slate-200"></div><div className="h-10 w-32 animate-pulse rounded-full bg-slate-200"></div></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-200"></div>)}
          </div>
        </div>
      )}
      
      {mocks.isError && <p className="rounded-xl bg-red-50 p-4 font-semibold text-red-600">{errorMessage(mocks.error)}</p>}

      {mocks.data?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-20 text-center shadow-sm">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 shadow-inner">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-800">No mock tests yet</h3>
          <p className="mb-6 max-w-sm text-slate-500">You haven't created any mock tests. Generate one now to start practicing.</p>
          <Link to="/create" className="btn bg-slate-900 text-white hover:bg-slate-800">Create your first mock</Link>
        </div>
      )}

        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setVisibleCount(12); }}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {cat} <span className={`ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs ${selectedCategory === cat ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{categorizedMocks[cat]?.length}</span>
              </button>
            ))}
          </div>

          {/* Mocks Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedMocks?.slice(0, visibleCount).map((m) => (
              <div key={m.id} className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-100">
                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <h3 className="line-clamp-2 flex-1 text-lg font-bold leading-tight text-slate-800 self-center">{m.title}</h3>
                  <button title="Delete Mock" className="shrink-0 -mr-2 rounded-full p-2 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100" disabled={del.isPending} onClick={() => setDeleteTarget(m.id)}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                
                <div className="mb-6 grid grid-cols-2 gap-3 text-xs font-semibold text-slate-500 border-y border-slate-100 py-4 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {m.total_questions} Qs
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {m.total_marks} Marks
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {m.duration_minutes} Mins
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button className="w-full rounded-xl bg-slate-50 py-2.5 font-bold text-slate-600 transition-all hover:bg-slate-200" onClick={() => nav(`/mocks/${m.id}/key`)}>
                    View Answer Key
                  </button>
                  <button className="w-full rounded-xl bg-indigo-50 py-3 font-bold text-indigo-700 transition-all hover:bg-indigo-600 hover:text-white hover:shadow-md" onClick={() => nav(`/mocks/${m.id}/instructions`)}>
                    Take Test
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {displayedMocks && visibleCount < displayedMocks.length && (
            <div className="pt-6 pb-2 text-center">
              <button 
                onClick={() => setVisibleCount(v => v + 12)} 
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
              >
                Load More
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
          )}
        </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete Mock Test"
        message="Are you sure you want to delete this mock test? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteTarget && del.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
