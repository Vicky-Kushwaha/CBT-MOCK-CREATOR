import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listSessions } from '../api/endpoints'
import { errorMessage } from '../api/client'

export default function HistoryPage() {
  const [visibleCount, setVisibleCount] = useState(20)
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: listSessions })

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Test History</h1>
        <p className="mt-1 text-slate-500">Review your past attempts and answer keys.</p>
      </div>

      {sessions.isLoading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-slate-200"></div>)}
        </div>
      )}

      {sessions.isError && (
        <div className="rounded-xl bg-red-50 p-4 text-red-600 font-medium">
          {errorMessage(sessions.error)}
        </div>
      )}

      {sessions.data?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
          <svg className="mb-4 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h3 className="text-xl font-bold text-slate-800">No tests taken yet</h3>
          <p className="mt-2 text-slate-500">Your completed mock tests will appear here.</p>
          <Link to="/tests" className="mt-6 btn-primary">Take a Mock Test</Link>
        </div>
      )}

      {!!sessions.data?.length && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Mock Test</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Score</th>
                  <th className="px-6 py-4 font-medium">Accuracy</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sessions.data.slice(0, visibleCount).map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">{s.mock_title}</td>
                    <td className="px-6 py-4">{new Date(s.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${s.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{s.score !== null ? `${s.score} / ${s.total_marks}` : '—'}</td>
                    <td className="px-6 py-4">{s.accuracy !== null ? `${s.accuracy}%` : '—'}</td>
                    <td className="px-6 py-4 text-right">
                      {s.status === 'in_progress'
                        ? <Link className="font-medium text-rail hover:text-rail-dark" to={`/exam/${s.id}`}>Resume →</Link>
                        : <Link className="font-medium text-indigo-600 hover:text-indigo-800" to={`/result/${s.id}`}>View Result / Key →</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sessions.data && visibleCount < sessions.data.length && (
        <div className="pt-4 pb-2 text-center">
          <button 
            onClick={() => setVisibleCount(v => v + 20)} 
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
          >
            Load More
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      )}
    </div>
  )
}
