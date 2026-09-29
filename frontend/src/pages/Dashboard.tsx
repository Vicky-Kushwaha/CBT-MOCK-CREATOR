import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listSessions } from '../api/endpoints'

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

export default function Dashboard() {
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: listSessions })

  const completedSessions = sessions.data?.filter((s) => s.status === 'completed') || []
  const totalAttempts = sessions.data?.length || 0
  const avgAccuracy = completedSessions.length
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.accuracy || 0), 0) / completedSessions.length)
    : 0
  const bestScore = completedSessions.length
    ? Math.max(...completedSessions.map((s) => s.score || 0))
    : 0

  return (
    <div className="space-y-10 pb-10">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tests Taken" value={totalAttempts} subtitle="Keep it up!" bg="bg-gradient-to-br from-blue-500 to-indigo-600" />
        <StatCard title="Total Attempts" value={totalAttempts} subtitle="Keep it up!" bg="bg-gradient-to-br from-emerald-400 to-teal-600" />
        <StatCard title="Avg. Accuracy" value={`${avgAccuracy}%`} subtitle="Across completed exams" bg="bg-gradient-to-br from-amber-400 to-orange-500" />
        <StatCard title="Highest Score" value={bestScore} subtitle="Personal best" bg="bg-gradient-to-br from-violet-500 to-fuchsia-600" />
      </div>



      {/* Recent Attempts Section */}
      <div>
        <h2 className="mb-4 text-2xl font-bold text-slate-800">Recent attempts</h2>
        {sessions.data?.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No attempts yet. Take a mock test to see your history here.
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
                  {sessions.data.slice(0, 8).map((s) => (
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
                          : <Link className="font-medium text-indigo-600 hover:text-indigo-800" to={`/result/${s.id}`}>View result →</Link>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
