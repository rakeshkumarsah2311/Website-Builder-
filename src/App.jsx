import { useState, useEffect } from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Builder from './pages/Builder.jsx'
import Admin from './pages/Admin.jsx'
import Auth from './pages/Auth.jsx'
import Portal from './pages/Portal.jsx'
import SitePreview from './components/SitePreview.jsx'
import { SAMPLES, PLANS, inr } from './data'
import { api } from './api'

const Guard = ({ role, children }) => {
  const u = api.user()
  if (!u) return <Navigate to="/login" />
  return role && u.role !== role ? <Navigate to="/" /> : children
}
const STEPS = [['Pick a design', 'Four professional layouts, each tuned for your profession.'], ['Tell your story', 'A guided 12-section form. Your progress saves as you go.'],
  ['Preview and pay', 'See the finished site first. Pay securely once you are happy.'], ['Go live', 'Choose your address and publish. No developer required.']]
const FEATURES = [['Built for your profession', 'Doctors, consultants, freelancers and businesses each get their own wording and sections.'], ['Mobile-first', 'Every design adapts cleanly to phones, tablets and desktops.'],
  ['Found on Google', 'Titles, descriptions and clean structure are set up for you.'], ['WhatsApp ready', 'Let visitors message you in one tap.'],
  ['Edit any time', 'Change your content from your dashboard and republish instantly.'], ['Secure by default', 'HTTPS on every site, verified payments and active moderation.']]
const FAQ = [['Do I need technical skills?', 'No. You answer simple questions and we build the site.'], ['How long until my site is live?', 'Most people finish the form in a few minutes and go live right after payment.'],
  ['Can I change my content later?', 'Yes. Edit and republish from your dashboard whenever you like.'], ['Can I use my own domain?', 'Your site launches on a SiteCraft address. Custom domains are planned for a later release.']]

function Home() {
  const u = api.user(), [pro, setPro] = useState('Doctor')
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.12 })
    document.querySelectorAll('.rv').forEach(el => io.observe(el)); return () => io.disconnect()
  }, [])
  return (
    <main className="home">
      <nav className="topbar"><Link to="/" className="logo">SiteCraft</Link>
        <span className="links"><a href="#showcase">Examples</a><a href="#how">How it works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></span>
        <span>{u ? <><Link to="/portal">My websites</Link> <a href="/" onClick={() => api.logout()}>Sign out</a></> : <Link className="btn sm" to="/login">Sign in</Link>}</span></nav>
      <section className="hero">
        <div><span className="eyebrow">Websites for professionals</span>
          <h1>A website as considered as <em>your work.</em></h1>
          <p>Choose a design, share your story, and publish a polished site on your own address, in minutes.</p>
          <Link className="btn primary lg shine" to="/builder">Build my website</Link> <a className="btn lg" href="#showcase">See examples</a></div>
        <div className="hero-card"><div className="frame"><SitePreview d={SAMPLES.Doctor} /></div></div>
      </section>
      <section className="strip rv"><div><b>4</b>professional designs</div><div><b>12</b>guided sections</div><div><b>3 min</b>to complete the form</div><div><b>100%</b>mobile-friendly</div></section>
      <section id="showcase" className="sec rv"><span className="eyebrow">Examples</span><h2>One platform, a look for every profession</h2>
        <div className="tabs">{Object.keys(SAMPLES).map(k => <button key={k} className={k === pro ? 'on' : ''} onClick={() => setPro(k)}>{k}</button>)}</div>
        <div className="browser"><div className="bar-top"><i /><i /><i /><span>{SAMPLES[pro].name.toLowerCase().replace(/[^a-z]/g, '')}.sitecraft.in</span></div>
          <div className="browser-body" key={pro}><SitePreview d={SAMPLES[pro]} /></div></div>
        <p className="muted">Sample content for illustration.</p></section>
      <section id="how" className="sec rv"><span className="eyebrow">How it works</span><h2>From idea to live in four steps</h2>
        <div className="steps4">{STEPS.map(([t, x], i) => <div key={t}><i>{i + 1}</i><h3>{t}</h3><p>{x}</p></div>)}</div></section>
      <section className="sec rv"><span className="eyebrow">Why SiteCraft</span><h2>Everything you need, nothing you don’t</h2>
        <div className="feat">{FEATURES.map(([t, x]) => <div key={t}><h3>{t}</h3><p>{x}</p></div>)}</div></section>
      <section id="pricing" className="sec rv"><span className="eyebrow">Pricing</span><h2>Simple yearly plans</h2>
        <div className="grid3 price">{PLANS.map(p => <div key={p.id} className={p.id === 'Professional' ? 'plan hot' : 'plan'}>{p.id === 'Professional' && <u>Most popular</u>}
          <b>{p.id}</b><strong>{inr(p.price)}<small>/yr</small></strong><span>{p.pages}</span>{p.perks.map(x => <em key={x}>✓ {x}</em>)}
          <Link className="btn primary" to="/builder">Choose {p.id}</Link></div>)}</div>
        <p className="muted">Prices exclude GST. Add-ons are optional.</p></section>
      <section id="faq" className="sec rv narrow"><span className="eyebrow">FAQ</span><h2>Questions, answered</h2>
        {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
      <section className="cta rv"><h2>Ready when you are.</h2><Link className="btn lg gold shine" to="/builder">Build my website</Link></section>
      <footer className="foot"><b className="logo">SiteCraft</b><span>© {new Date().getFullYear()} SiteCraft. All rights reserved.</span></footer>
    </main>
  )
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/builder" element={<Guard><Builder /></Guard>} />
      <Route path="/portal" element={<Guard><Portal /></Guard>} />
      <Route path="/admin" element={<Guard role="admin"><Admin /></Guard>} />
    </Routes>
  )
}
