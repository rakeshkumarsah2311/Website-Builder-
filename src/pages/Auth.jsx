import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'

export default function Auth() {
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false), [err, setErr] = useState('')
  const go = useNavigate()
  const API = import.meta.env.VITE_API_URL // set in .env to use the real server; empty = demo mode
  const post = (p, b) => fetch(API + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })
  async function send() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address.')
    setErr('')
    if (API) { const r = await post('/api/auth/send', { email }); if (!r.ok) return setErr((await r.json()).error || 'Could not send the code.') }
    setSent(true)
  }
  async function verify() {
    try {
      if (API) { const r = await post('/api/auth/verify', { email, otp, name }); const j = await r.json(); if (!r.ok) throw new Error(j.error)
        api.setSession(j.token, j.user); return go(j.user.role === 'admin' ? '/admin' : '/builder') }
      const u = api.login(email, otp, name); go(u.role === 'admin' ? '/admin' : '/builder')
    } catch (e) { setErr(e.message) }
  }
  return (
    <main className="auth"><Link to="/" className="logo">SiteCraft</Link>
      <h2>Sign in or create your account</h2>
      <label>Your name<input value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Email<input value={email} onChange={e => setEmail(e.target.value)} /></label>
      {sent && <label>6-digit code<input value={otp} onChange={e => setOtp(e.target.value)} inputMode="numeric" /></label>}
      {err && <p className="error" role="alert">{err}</p>}
      <div className="nav">{sent ? <button className="btn primary" onClick={verify}>Verify and continue</button>
        : <button className="btn primary" onClick={send}>Send code</button>}</div>
      <p className="muted">Demo: any email works, code is 123456. Use admin@sitecraft.in for the admin panel.</p>
    </main>
  )
}
