import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SECTIONS, inr } from '../data'
import { api, API } from '../api'
import SitePreview from '../components/SitePreview'

const FIELDS = SECTIONS.flatMap(s => s.f).filter(([k]) => k !== 'type' && k !== 'years')
const addYear = d => { const x = new Date(d || Date.now()); x.setFullYear(x.getFullYear() + 1); return x.toISOString().slice(0, 10) }

export default function Portal() {
  const u = api.user()
  const [sites, setSites] = useState(api.sites().filter(s => s.email === u.email))
  const [invoices, setInvoices] = useState(api.invoices().filter(i => i.email === u.email))
  const [cur, setCur] = useState(null), [msg, setMsg] = useState('')
  const flash = m => { setMsg(m); setTimeout(() => setMsg(''), 2000) }
  useEffect(() => { if (API) { api.call('/api/sites').then(setSites).catch(() => {}); api.call('/api/invoices').then(setInvoices).catch(() => {}) } }, [])
  const persist = list => { setSites(list); api.saveSites([...list, ...api.sites().filter(s => s.email !== u.email)]) }

  async function saveEdits() {
    if (API) { try { const s = await api.call('/api/sites/' + cur.id, 'PUT', { data: cur.data }); setSites(sites.map(x => x.id === s.id ? s : x)); flash('Changes published') } catch (e) { flash(e.message) } return }
    persist(sites.map(s => s.id === cur.id ? { ...s, owner: cur.data.name, data: cur.data } : s)); flash('Changes published')
  }
  async function renew(s) {
    if (API) { // pay first; the server confirms the payment before extending the plan
      try { const orderId = await api.checkout({ siteId: s.id }); await api.call(`/api/sites/${s.id}/renew`, 'POST', { orderId })
        setSites(await api.call('/api/sites')); setInvoices(await api.call('/api/invoices')); flash('Renewed for one year') } catch (e) { flash(e.message) }
      return
    }
    persist(sites.map(x => x.id === s.id ? { ...x, status: 'Active', renews: addYear(x.renews) } : x))
    const inv = { id: 'INV-' + Date.now(), email: u.email, plan: s.plan, amount: s.amount || 0, date: new Date().toISOString().slice(0, 10) }
    localStorage.setItem('invoices', JSON.stringify([inv, ...api.invoices()])); setInvoices([inv, ...invoices]); flash('Renewed for one year (demo)')
  }
  return (
    <main className="portal">
      <header className="between"><Link to="/" className="logo">SiteCraft</Link><span>{u.name}</span></header>
      <h2>My websites</h2>
      {msg && <p className="ok" role="status">{msg}</p>}
      {!sites.length && <p className="muted">No websites yet. <Link to="/builder">Build your first one</Link>.</p>}
      {sites.map(s => (
        <div className="card between" key={s.id}>
          <div><b>{s.domain}.sitecraft.in</b><br /><small className="muted">{s.plan} · renews {s.renews}</small></div>
          <span className={'pill ' + s.status}>{s.status}</span>
          <span className="acts"><button onClick={() => setCur(s)} disabled={!s.data}>Edit content</button><button onClick={() => renew(s)}>Renew</button></span>
        </div>))}
      {cur && <div className="editor"><div className="panel">
        <h3>Edit {cur.domain}</h3>
        {FIELDS.map(([k, l, kind]) => <label key={k}>{l}
          {kind === 'area' ? <textarea rows="3" value={cur.data[k] || ''} onChange={e => setCur({ ...cur, data: { ...cur.data, [k]: e.target.value } })} />
            : <input type={kind === 'color' ? 'color' : 'text'} value={cur.data[k] || (kind === 'color' ? '#0b7a75' : '')} onChange={e => setCur({ ...cur, data: { ...cur.data, [k]: e.target.value } })} />}</label>)}
        <div className="nav"><button className="btn primary" onClick={saveEdits}>Publish changes</button><button className="btn" onClick={() => setCur(null)}>Close</button></div>
      </div><aside className="side"><SitePreview d={cur.data} /></aside></div>}
      <h2>Invoices</h2>
      <div className="card"><table><thead><tr><th>Invoice</th><th>Date</th><th>Plan</th><th>Amount</th><th /></tr></thead>
        <tbody>{invoices.length ? invoices.map(i => <tr key={i.id}><td>{i.id}</td><td>{i.date}</td><td>{i.plan}</td><td>{inr(i.amount || 0)}</td>
          <td><button className="acts" onClick={() => window.print()}>Print</button></td></tr>) : <tr><td colSpan="5" className="muted">No invoices yet.</td></tr>}</tbody></table></div>
    </main>
  )
}
