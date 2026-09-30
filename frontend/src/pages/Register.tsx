import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { errorMessage } from '../api/client'
import { login, register } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const nav = useNavigate()

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await register(username.trim(), email.trim(), password)
      const t = await login(username.trim(), password)
      setAuth(t.access, t.refresh, username.trim())
      nav('/dashboard', { replace: true })
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <AuthShell title="Create your account">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="label">Username</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required placeholder="Choose a username" />
        </div>
        <div>
          <label className="label">Email <span className="text-slate-400 font-normal">(Optional)</span></label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">Password <span className="text-slate-400 font-normal">(min 8 characters)</span></label>
          <input className="input" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>
        
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}
        
        <button className="btn-primary w-full h-12 text-base mt-2" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
        
        <p className="text-center text-sm text-ink-soft mt-6">
          Have an account? <Link className="text-rail font-semibold hover:text-blue-600 transition-colors" to="/login">Sign in instead</Link>
        </p>
      </form>
    </AuthShell>
  )
}
