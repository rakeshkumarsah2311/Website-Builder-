import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { REVENUE, CUSTOMERS, PAYMENTS, SUBS, TEMPLATES, inr } from '../data'
import { api, API } from '../api'

const TABS = ['Dashboard', 'Customers', 'Websites', 'Subscriptions', 'Payments', 'Templates', 'Add-ons', 'Moderation', 'Blacklist', 'Reports', 'Settings']
const Pill = ({ s }) => <span className={'pill ' + s}>{s}</span>
const Table = ({ cols, rows }) => (
  <div className="card"><table><thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
    <tbody>{rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>) : <tr><td colSpan={cols.length} className="muted">Nothing here yet.</td></tr>}</tbody></table></div>)

function Chart({ data }) {
  const max = Math.max(...data.map(r => r.v)), w = 520, h = 160
  const pts = data.map((r, i) => [30 + i * ((w - 60) / (data.length - 1)), h - 20 - (r.v / max) * (h - 40)])
  const line = pts.map(p => p.join(',')).join(' ')
  return (<svg viewBox={`0 0 ${w} ${h + 20}`} role="img" aria-label="Revenue over the last 6 months">
    <polygon points={`${pts[0][0]},${h - 20} ${line} ${pts.at(-1)[0]},${h - 20}`} fill="var(--accent-soft)" />
    <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="3" />
    {pts.map((p, i) => <g key={i}><circle cx={p[0]} cy={p[1]} r="4" fill="var(--accent)" />
      <text x={p[0]} y={h + 10} textAnchor="middle" fontSize="11" fill="#6b7785">{data[i].m}</text></g>)}</svg>)
}

export default function Admin() {
  const [tab, setTab] = useState('Dashboard'), [sites, setSites] = useState(api.sites()), [q, setQ] = useState('')
  const [log, setLog] = useState([]), [cfg, setCfg] = useState(api.settings()), [addons, setAddons] = useState(api.addons())
  const [tpl, setTpl] = useState(TEMPLATES.map(t => ({ ...t, on: true }))), [saved, setSaved] = useState(false)
  const [ov, setOv] = useState({ customers: CUSTOMERS, payments: PAYMENTS, subs: SUBS, revenue: REVENUE })
  useEffect(() => { if (!API) return // server mode: load real data
    api.call('/api/admin/sites').then(setSites).catch(() => {}); api.call('/api/admin/overview').then(setOv).catch(() => {}) }, [])
  const go = useNavigate(), count = s => sites.filter(x => x.status === s).length

  async function act(id, status, verb) {
    const s = sites.find(x => x.id === id)
    if (status === 'Blacklisted' && !window.confirm(`Blacklist ${s.domain}? The site goes offline immediately.`)) return
    if (API) { try { await api.call(`/api/admin/sites/${id}/status`, 'POST', { status }) } catch (e) { return setLog([`Failed: ${e.message}`, ...log]) } }
    const n = sites.map(x => x.id === id ? { ...x, status } : x); setSites(n); if (!API) api.saveSites(n)
    setLog([`${verb} ${s.domain} · ${new Date().toLocaleTimeString()}`, ...log])
  }
  const SiteRows = list => list.filter(s => (s.domain + s.owner).toLowerCase().includes(q.toLowerCase())).map(s => [
    s.domain + '.sitecraft.in', s.owner, s.template, s.plan, <Pill s={s.status} />,
    <span className="acts">
      {s.status === 'Active' && <button onClick={() => act(s.id, 'Suspended', 'Suspended')}>Suspend</button>}
      {s.status !== 'Active' && s.status !== 'Expired' && <button onClick={() => act(s.id, 'Active', 'Reactivated')}>Reactivate</button>}
      {s.status !== 'Blacklisted' && <button className="danger" onClick={() => act(s.id, 'Blacklisted', 'Blacklisted')}>Blacklist</button>}</span>])
  const SITE_COLS = ['Address', 'Owner', 'Template', 'Plan', 'Status', 'Actions']
  const Search = <input className="search" placeholder="Search by owner or address" value={q} onChange={e => setQ(e.target.value)} />
  function csv() {
    const rows = [['Address', 'Owner', 'Template', 'Plan', 'Status'], ...sites.map(s => [s.domain, s.owner, s.template, s.plan, s.status])]
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }))
    a.download = 'websites-report.csv'; a.click()
  }
  const save = () => { api.saveSettings(cfg); api.saveAddons(addons); setSaved(true); setTimeout(() => setSaved(false), 1800) }

  return (
    <div className="admin">
      <aside className="steps dark"><Link to="/" className="logo">SiteCraft</Link>
        <ol>{TABS.map(x => <li key={x} role="button" tabIndex="0" className={x === tab ? 'on' : ''} onClick={() => setTab(x)} onKeyDown={e => e.key === 'Enter' && setTab(x)}>{x}</li>)}</ol>
        <button className="btn" onClick={() => { api.logout(); go('/login') }}>Sign out</button></aside>
      <main>
        <h2>{tab}</h2>
        {tab === 'Dashboard' && <>
          <div className="kpis"><div><small>Customers</small><b>{ov.customers.length}</b></div><div><small>Active websites</small><b>{count('Active')}</b></div>
            <div><small>Revenue (Oct)</small><b>{inr(ov.revenue.at(-1)?.v || 0)}</b></div><div><small>Suspended / blacklisted</small><b>{count('Suspended') + count('Blacklisted')}</b></div></div>
          <div className="card"><h3>Revenue, last 6 months</h3>{ov.revenue.length > 1 ? <Chart data={ov.revenue} /> : <p className="muted">Revenue appears here after the first payments.</p>}</div>
          <div className="card"><h3>Activity log</h3>{log.length ? log.map((l, i) => <p key={i}>{l}</p>) : <p className="muted">Actions you take on websites appear here.</p>}</div></>}
        {tab === 'Customers' && <Table cols={['Name', 'Email', 'Plan', 'Websites', 'Joined']} rows={ov.customers.map(c => [c.name, c.email, c.plan, c.sites, c.joined])} />}
        {tab === 'Websites' && <>{Search}<Table cols={SITE_COLS} rows={SiteRows(sites)} /></>}
        {tab === 'Subscriptions' && <Table cols={['Customer', 'Plan', 'Renews', 'Status']} rows={ov.subs.map(s => [s.customer, s.plan, s.renews, <Pill s={s.status} />])} />}
        {tab === 'Payments' && <Table cols={['Date', 'Customer', 'Plan', 'Amount', 'Status']} rows={ov.payments.map(p => [p.date, p.customer, p.plan, inr(p.amount), <Pill s={p.status === 'Success' ? 'Active' : 'Blacklisted'} />])} />}
        {tab === 'Templates' && <Table cols={['Template', 'Colour', 'Available to customers']} rows={tpl.map(t => [t.name, <i className="dot" style={{ background: t.accent }} />,
          <input type="checkbox" checked={t.on} onChange={() => setTpl(tpl.map(x => x.id === t.id ? { ...x, on: !x.on } : x))} />])} />}
        {tab === 'Add-ons' && <div className="card">{addons.map(a => <label key={a.id}>{a.name} (₹)
          <input type="number" value={a.price} onChange={e => setAddons(addons.map(x => x.id === a.id ? { ...x, price: +e.target.value } : x))} /></label>)}
          <div className="nav"><button className="btn primary" onClick={save}>{saved ? 'Saved' : 'Save prices'}</button></div></div>}
        {tab === 'Moderation' && <>{Search}<Table cols={SITE_COLS} rows={SiteRows(sites)} /></>}
        {tab === 'Blacklist' && <Table cols={SITE_COLS} rows={SiteRows(sites.filter(s => s.status === 'Blacklisted'))} />}
        {tab === 'Reports' && <div className="card"><p>{sites.length} websites · {count('Active')} active · {count('Expired')} expired · {count('Suspended')} suspended · {count('Blacklisted')} blacklisted</p>
          <button className="btn primary" onClick={csv}>Download websites report (CSV)</button></div>}
        {tab === 'Settings' && <div className="card"><label>Platform name<input value={cfg.brand} onChange={e => setCfg({ ...cfg, brand: e.target.value })} /></label>
          <label>GST (%)<input type="number" value={cfg.gst} onChange={e => setCfg({ ...cfg, gst: +e.target.value })} /></label>
          <label>Reserved addresses (comma separated)<input value={cfg.reserved} onChange={e => setCfg({ ...cfg, reserved: e.target.value })} /></label>
          <div className="nav"><button className="btn primary" onClick={save}>{saved ? 'Saved' : 'Save settings'}</button></div></div>}
      </main>
    </div>
  )
}
