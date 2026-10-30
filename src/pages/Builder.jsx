import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TEMPLATES, TYPES, PLANS, SECTIONS, TAKEN, SAMPLES, inr } from '../data'
import { api } from '../api'
import SitePreview from '../components/SitePreview'

const STEPS = ['Template', 'Your content', 'Add-ons', 'Preview', 'Plan & payment', 'Website address', 'Live']
const EMPTY = { template: 1, type: 'Doctor', years: '5+', hours: 'Mon–Sat 9:00–18:00', addons: [], plan: 'Professional', sub: '', color: '',
  name: '', title: '', tagline: '', about: '', services: '', expertise: '', why: '', testimonials: '', gallery: '', phone: '', email: '',
  address: '', instagram: '', linkedin: '', facebook: '', seoTitle: '', seoDesc: '' }
const load = () => { try { return { ...EMPTY, ...JSON.parse(localStorage.getItem('draft')) } } catch { return EMPTY } }

export default function Builder() {
  const [step, setStep] = useState(0), [sec, setSec] = useState(0)
  const [d, setD] = useState(load), [err, setErr] = useState('')
  const [paying, setPaying] = useState(false), [paid, setPaid] = useState(false)
  const ADDONS = api.addons(), cfg = api.settings()

  useEffect(() => { try { localStorage.setItem('draft', JSON.stringify(d)) } catch {} }, [d])
  const set = (k, v) => setD(p => ({ ...p, [k]: v }))
  const plan = PLANS.find(p => p.id === d.plan), addons = ADDONS.filter(a => d.addons.includes(a.id))
  const total = plan.price + addons.reduce((s, a) => s + a.price, 0), gst = Math.round(total * cfg.gst / 100)
  const taken = [...TAKEN, ...cfg.reserved.split(',').map(s => s.trim())]
  const missing = ['name', 'title', 'tagline', 'about'].filter(k => !d[k])

  async function next() {
    setErr('')
    if (step === 1) {
      if (sec === 0 && missing.length) return setErr('Fill in your name, title, tagline and about text to continue.')
      if (sec === 6 && d.email && !/^\S+@\S+\.\S+$/.test(d.email)) return setErr('Enter a valid email address.')
      if (sec < SECTIONS.length - 1) return setSec(sec + 1)
    }
    if (step === 5) {
      if (!/^[a-z0-9-]{3,30}$/.test(d.sub)) return setErr('Use 3–30 lowercase letters, numbers or hyphens.')
      if (taken.includes(d.sub)) return setErr('That address is taken. Try another.')
      const API = import.meta.env.VITE_API_URL
      if (API) {
        const r = await fetch(API + '/api/sites', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + api.token() },
          body: JSON.stringify({ orderId: d.orderId, sub: d.sub, data: d }) })
        if (!r.ok) return setErr((await r.json()).error || 'Could not publish. Please try again.')
      } else api.publish({ domain: d.sub, owner: d.name, email: api.user().email, data: d, amount: total + gst,
        template: TEMPLATES.find(t => t.id === d.template).name, plan: d.plan })
    }
    setStep(step + 1)
  }
  function back() { setErr(''); if (step === 1 && sec > 0) setSec(sec - 1); else setStep(step - 1) }
  const loadRzp = () => new Promise((ok, fail) => { if (window.Razorpay) return ok()
    const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = ok; s.onerror = fail; document.body.appendChild(s) })
  async function pay() {
    const API = import.meta.env.VITE_API_URL
    setErr(''); setPaying(true)
    if (!API) return setTimeout(() => { setPaying(false); setPaid(true); setStep(5) }, 1200) // demo mode
    try {
      const h = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + api.token() }
      const o = await (await fetch(API + '/api/payments/order', { method: 'POST', headers: h, body: JSON.stringify({ plan: d.plan, addons: d.addons }) })).json()
      await loadRzp()
      new window.Razorpay({ key: o.key, order_id: o.orderId, amount: o.amount, currency: 'INR', name: 'SiteCraft',
        modal: { ondismiss: () => setPaying(false) },
        handler: async r => { // the server checks the signature before anything is unlocked
          const v = await fetch(API + '/api/payments/verify', { method: 'POST', headers: h,
            body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }) })
          setPaying(false)
          if (v.ok) { set('orderId', r.razorpay_order_id); setPaid(true); setStep(5) } else setErr('We could not verify your payment. If money was deducted, contact support.')
        } }).open()
    } catch { setErr('Could not start the payment. Please try again.'); setPaying(false) }
  }
  const toggle = id => set('addons', d.addons.includes(id) ? d.addons.filter(x => x !== id) : [...d.addons, id])

  const Field = ([k, l, kind]) => (
    <label key={k}>{l}
      {kind === 'area' ? <textarea rows="4" value={d[k]} onChange={e => set(k, e.target.value)} />
        : kind === 'type' ? <select value={d.type} onChange={e => set('type', e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
        : kind === 'years' ? <select value={d.years} onChange={e => set('years', e.target.value)}>{['1+', '5+', '10+', '15+', '20+'].map(y => <option key={y}>{y}</option>)}</select>
        : kind === 'color' ? <input type="color" value={d.color || '#0b7a75'} onChange={e => set('color', e.target.value)} />
        : <input value={d[k]} onChange={e => set(k, e.target.value)} />}
    </label>)
  const S = SECTIONS[sec]

  return (
    <div className="builder">
      <aside className="steps"><Link to="/" className="logo">SiteCraft</Link>
        <ol>{STEPS.map((s, i) => <li key={s} className={i === step ? 'on' : i < step ? 'done' : ''}>{s}</li>)}</ol>
        <p className="muted">Your progress saves automatically.</p></aside>

      <section className="panel fade" key={step + '-' + sec}>
        {step === 0 && <><h2>Choose a design</h2><p className="muted">You can switch later without losing your content.</p>
          <div className="grid4">{TEMPLATES.map(t => (
            <button key={t.id} className={'tcard' + (d.template === t.id ? ' sel' : '')} onClick={() => set('template', t.id)}>
              <span className="thumb"><SitePreview d={{ ...SAMPLES.Doctor, template: t.id }} /></span><b>{t.name}</b></button>))}</div></>}

        {step === 1 && <><p className="muted">Section {sec + 1} of {SECTIONS.length}</p>
          <div className="bar"><i style={{ width: `${((sec + 1) / SECTIONS.length) * 100}%` }} /></div>
          <h2>{S.t}</h2>
          {S.f.map(Field)}
          {S.t === 'Review' && <ul className="review">{SECTIONS.slice(0, -1).map(s => {
            const filled = s.f.some(([k]) => d[k] && d[k] !== EMPTY[k])
            return <li key={s.t}>{filled ? '✓' : '–'} {s.t}{!filled && <span className="muted"> (optional, skipped)</span>}</li>})}</ul>}</>}

        {step === 2 && <><h2>Add extras</h2><p className="muted">Optional. You can add these later too.</p>
          {ADDONS.map(a => <label key={a.id} className="check"><input type="checkbox" checked={d.addons.includes(a.id)} onChange={() => toggle(a.id)} />
            <span>{a.name}</span><b>{inr(a.price)}</b></label>)}</>}

        {step === 3 && <><h2>Preview your website</h2><p className="muted">Happy with it? Continue to choose a plan.</p>
          <div className="previewbox"><SitePreview d={d} /></div></>}

        {step === 4 && <><h2>Choose a plan</h2>
          <div className="grid3">{PLANS.map(p => (
            <button key={p.id} className={'plan' + (d.plan === p.id ? ' sel' : '')} onClick={() => set('plan', p.id)}>
              <b>{p.id}</b><strong>{inr(p.price)}<small>/yr</small></strong><span>{p.pages}</span>{p.perks.map(x => <em key={x}>{x}</em>)}</button>))}</div>
          <div className="bill"><div><span>{plan.id} plan</span><span>{inr(plan.price)}</span></div>
            {addons.map(a => <div key={a.id}><span>{a.name}</span><span>{inr(a.price)}</span></div>)}
            <div><span>GST ({cfg.gst}%)</span><span>{inr(gst)}</span></div>
            <div className="tot"><span>Total</span><span>{inr(total + gst)}</span></div></div>
          <button className="btn primary lg" disabled={paying} onClick={pay}>{paying ? 'Confirming payment…' : `Pay ${inr(total + gst)}`}</button></>}

        {step === 5 && <><h2>Choose your website address</h2><p className="muted">Payment received. Pick the address visitors will use.</p>
          <div className="sub"><input value={d.sub} onChange={e => set('sub', e.target.value.toLowerCase())} placeholder="drrahulsharma" /><span>.sitecraft.in</span></div></>}

        {step === 6 && <div className="live"><h2>Your website is live</h2><p className="url">https://{d.sub}.sitecraft.in</p>
          <button className="btn" onClick={() => { localStorage.removeItem('draft'); setD(EMPTY); setStep(0); setSec(0); setPaid(false) }}>Build another website</button></div>}

        {err && <p className="error" role="alert">{err}</p>}
        {step < 4 && <div className="nav">{(step > 0) && <button className="btn" onClick={back}>Back</button>}
          <button className="btn primary" onClick={next}>{step === 1 && sec === SECTIONS.length - 1 ? 'Looks good' : 'Continue'}</button></div>}
        {step === 4 && <div className="nav"><button className="btn" onClick={back}>Back</button></div>}
        {step === 5 && <div className="nav"><button className="btn primary" disabled={!paid} onClick={next}>Publish website</button></div>}
      </section>
      {step >= 1 && step <= 3 && <aside className="side"><small className="muted">Live preview</small><SitePreview d={d} /></aside>}
    </div>
  )
}
