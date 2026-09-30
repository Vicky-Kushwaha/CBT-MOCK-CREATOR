import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { getMockAnswerKey } from '../api/endpoints'

export default function MockAnswerKeyPage() {
  const nav = useNavigate()
  const mockId = Number(useParams().mockId)
  const query = useQuery({
    queryKey: ['mock_answer_key', mockId],
    queryFn: () => getMockAnswerKey(mockId),
  })

  if (query.isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Answer Key...</div>
  }

  if (query.isError || !query.data) {
    return <div className="p-8 text-center text-red-600 font-medium">{errorMessage(query.error)}</div>
  }

  const { title, questions } = query.data
  const hasHindi = questions.some(q => q.text_hi)
  const [prefLang, setPrefLang] = useState<'english' | 'hindi'>('english')

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button onClick={() => nav(-1)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" title="Go back">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Answer Key</h1>
          <p className="mt-1 text-slate-500 font-medium">{title}</p>
        </div>
        {hasHindi && (
          <select
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none hover:border-indigo-300 focus:border-indigo-500"
            value={prefLang}
            onChange={(e) => setPrefLang(e.target.value as any)}
          >
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
          </select>
        )}
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold text-lg">Quick Reference</h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
          {questions.map((q) => {
            const correctOptIndex = q.options.findIndex((o) => o.is_correct)
            const correctLetter = correctOptIndex >= 0 ? String.fromCharCode(65 + correctOptIndex) : '-'
            return (
              <a href={`#q${q.order}`} key={q.id} className="rounded border border-slate-200 bg-slate-50 p-2 text-center hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                <div className="text-xs font-semibold text-slate-500">Q{q.order}</div>
                <div className="mt-1 text-base font-bold text-slate-800">{correctLetter}</div>
              </a>
            )
          })}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800">Detailed Solutions</h2>
        {questions.map((q) => (
          <div id={`q${q.order}`} key={q.id} className="card scroll-mt-6 border border-slate-200 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">Q{q.order}</span>
              <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{q.section_name}</span>
              {q.subject && <span className="font-medium text-slate-500">{q.subject}{q.topic ? ` · ${q.topic}` : ''}</span>}
              <span className="text-slate-400">+{q.marks} / -{q.negative_marks}</span>
            </div>
            
            <p className="whitespace-pre-line text-[15px] font-medium text-slate-800 mb-5">{prefLang === 'hindi' && q.text_hi ? q.text_hi : q.text}</p>
            
            <ul className="space-y-2">
              {q.options.map((o, i) => {
                const cls = o.is_correct 
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm ring-1 ring-emerald-500/20' 
                  : 'border-slate-200 bg-white opacity-60'
                return (
                  <li key={o.id} className={`flex gap-3 rounded-xl border p-3 text-sm transition-all ${cls}`}>
                    <span className={`font-bold ${o.is_correct ? 'text-emerald-700' : 'text-slate-400'}`}>{String.fromCharCode(65 + i)}.</span>
                    <span className={`flex-1 ${o.is_correct ? 'text-emerald-900 font-medium' : 'text-slate-600'}`}>{prefLang === 'hindi' && o.text_hi ? o.text_hi : o.text}</span>
                    {o.is_correct && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded uppercase tracking-wide">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Correct
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>

            {q.explanation && (
              <div className="mt-5 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm">
                <div className="flex items-center gap-1.5 font-bold text-blue-800 mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Solution / Explanation
                </div>
                <div className="whitespace-pre-line text-sm text-slate-700">{prefLang === 'hindi' && q.explanation_hi ? q.explanation_hi : q.explanation}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
