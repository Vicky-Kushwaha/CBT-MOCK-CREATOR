import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { errorMessage } from '../api/client'
import { login } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from || '/'

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const t = await login(username.trim(), password)
      setAuth(t.access, t.refresh, username.trim())
      nav(from, { replace: true })
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <AuthShell title="Sign in to continue">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Username</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required /></div>
        <div><label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-center text-sm text-ink-soft">No account? <Link className="text-rail underline" to="/register">Register</Link></p>
      </form>
    </AuthShell>
  )
}
