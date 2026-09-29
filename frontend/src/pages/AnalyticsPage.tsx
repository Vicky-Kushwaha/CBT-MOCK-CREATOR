import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { getAnalytics } from '../api/endpoints'

function StatCard({ title, value, subtitle, bg }: { title: string; value: string | number; subtitle: string; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl shadow-lg p-6 text-white relative overflow-hidden transition-transform duration-300 hover:scale-105`}>
      <div className="relative z-10">
        <h3 className="text-white/80 font-medium text-sm tracking-wider uppercase mb-1">{title}</h3>
        <p className="text-4xl font-bold mb-2">{value}</p>
        <p className="text-white/70 text-xs">{subtitle}</p>
      </div>
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute -left-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
    </div>
  )
}

export default function AnalyticsPage() {
  const q = useQuery({ queryKey: ['analytics'], queryFn: getAnalytics })
  if (q.isLoading) return <div className="space-y-6 animate-pulse"><div className="h-32 bg-slate-200 rounded-2xl"></div><div className="h-64 bg-slate-200 rounded-2xl"></div></div>
  if (q.isError || !q.data) return <p className="text-red-600">{errorMessage(q.error)}</p>
  const d = q.data

  const chronological = d.history || []
  const newestFirst = [...chronological].reverse()

  return (
    <div className="space-y-8 pb-10">
      <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Your Performance</h1>
      
      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Tests Taken" value={d.tests_taken} subtitle="Total mocks completed" bg="bg-gradient-to-br from-indigo-500 to-blue-600" />
        <StatCard title="Average Accuracy" value={`${d.average_accuracy}%`} subtitle="Overall correctness" bg="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <StatCard title="Best Score" value={d.best_score} subtitle="Highest marks achieved" bg="bg-gradient-to-br from-amber-500 to-orange-600" />
      </div>

      {/* Progress Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-bold text-slate-800">Mock-to-Mock Progress</h2>
        <div className="flex h-56 items-end gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100 relative">
          {chronological.map((h) => {
            const pct = h.total_marks ? Math.max(4, (h.score / h.total_marks) * 100) : 4
            return (
              <Link key={h.session_id} to={`/result/${h.session_id}`} title={`${h.title}: ${h.score}/${h.total_marks}`}
                className="group relative flex h-full min-w-[32px] flex-1 flex-col justify-end">
                <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100 z-10">
                  {h.score} / {h.total_marks}
                </div>
                <span className="mb-2 text-center text-xs font-medium text-slate-500 transition-colors group-hover:text-indigo-600">{Math.round(pct)}%</span>
                <div className="rounded-t-md bg-gradient-to-t from-indigo-600 to-blue-400 shadow-sm transition-all duration-300 group-hover:from-indigo-700 group-hover:to-blue-500 group-hover:shadow-md" style={{ height: `${pct}%` }} />
              </Link>
            )
          })}
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          Score as a percentage of total marks, oldest → newest.
        </p>
      </div>

      {/* Subject-wise Analysis */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 p-6">
          <h2 className="text-xl font-bold text-slate-800">Subject-wise Accuracy</h2>
          <p className="text-sm text-slate-500">Cumulative performance across all tests</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Subject</th>
                <th className="px-6 py-4 font-medium">Attempted</th>
                <th className="px-6 py-4 font-medium">Correct</th>
                <th className="px-6 py-4 font-medium min-w-[200px]">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {d.subjects.map((s) => (
                <tr key={s.subject} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-900">{s.subject}</td>
                  <td className="px-6 py-4">{s.attempted}</td>
                  <td className="px-6 py-4 text-green-600 font-medium">{s.correct}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-32 overflow-hidden rounded-full bg-slate-200">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${s.accuracy >= 70 ? 'bg-emerald-500' : s.accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} 
                          style={{ width: `${s.accuracy}%` }} 
                        />
                      </div>
                      <span className="font-medium text-slate-700">{s.accuracy}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weak & Strong Topics */}
      <div className="grid gap-6 md:grid-cols-2">
        {([
          ['Weak Topics', d.weak_topics, 'Focus your preparation here to improve your overall score.', 'border-red-200', 'bg-red-50', 'text-red-700', 'text-red-600'], 
          ['Strong Topics', d.strong_topics, 'You are doing great in these areas. Keep it up!', 'border-emerald-200', 'bg-emerald-50', 'text-emerald-700', 'text-emerald-600']
        ] as const).map(([title, rows, subtitle, border, bg, titleColor, statColor]) => (
          <div key={title} className={`rounded-2xl border ${border} bg-white shadow-sm flex flex-col overflow-hidden`}>
            <div className={`${bg} p-5 border-b ${border}`}>
              <h2 className={`text-lg font-bold ${titleColor}`}>{title}</h2>
              <p className={`text-xs mt-1 ${titleColor} opacity-80`}>{subtitle}</p>
            </div>
            <div className="p-5 flex-1">
              {rows.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400 italic">Not enough data yet.</div>
              ) : (
                <ul className="space-y-4 text-sm">
                  {rows.map((t) => (
                    <li key={`${t.subject}-${t.topic}`} className="group flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-slate-800">{t.topic}</span>
                        <span className={`font-bold ${statColor}`}>{t.accuracy}%</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">{t.subject}</span>
                        <span className="text-slate-400">({t.attempted} attempts)</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* History Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 p-6">
          <h2 className="text-xl font-bold text-slate-800">Test History</h2>
          <p className="text-sm text-slate-500">Your recent test records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Mock Test</th>
                <th className="px-6 py-4 font-medium">Exam Type</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Score</th>
                <th className="px-6 py-4 font-medium">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {newestFirst.map((h) => (
                <tr key={h.session_id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <Link className="font-medium text-indigo-600 hover:text-indigo-800" to={`/result/${h.session_id}`}>{h.title}</Link>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{h.exam}</td>
                  <td className="px-6 py-4">{new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{h.score} <span className="text-slate-400 text-xs">/ {h.total_marks}</span></td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${h.accuracy >= 70 ? 'bg-green-100 text-green-800' : h.accuracy >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {h.accuracy}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
