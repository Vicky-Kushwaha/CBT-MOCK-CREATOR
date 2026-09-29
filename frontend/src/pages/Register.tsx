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
      nav('/', { replace: true })
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <AuthShell title="Create your account">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Username</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required /></div>
        <div><label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label">Password (min 8 characters)</label>
          <input className="input" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="text-center text-sm text-ink-soft">Have an account? <Link className="text-rail underline" to="/login">Sign in</Link></p>
      </form>
    </AuthShell>
  )
}
