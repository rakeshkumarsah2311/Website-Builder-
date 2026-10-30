import { TEMPLATES } from '../data'
const L = s => (s || '').split('\n').map(x => x.trim()).filter(Boolean)
// The wording and extras change with the profession; colours and layout change with the template.
const PRO = {
  Doctor: { cta: 'Book an appointment', kick: 'Medical practice', sv: 'Care & treatments', ex: 'Specialities', note: 'Consultation hours' },
  Consultant: { cta: 'Book a discovery call', kick: 'Advisory', sv: 'How I can help', ex: 'Areas of expertise', note: 'Availability' },
  Freelancer: { cta: 'Start a project', kick: 'Independent studio', sv: 'Services', ex: 'Skills', note: 'Working hours' },
  'Small Business': { cta: 'Visit or call us', kick: 'Local business', sv: 'What we offer', ex: 'Why customers return', note: 'Opening hours' },
  Other: { cta: 'Get in touch', kick: 'Professional', sv: 'Services', ex: 'Expertise', note: 'Hours' },
}
export default function SitePreview({ d }) {
  const t = TEMPLATES.find(x => x.id === d.template) || TEMPLATES[0]
  const p = PRO[d.type] || PRO.Other
  const svc = L(d.services), exp = L(d.expertise), tes = L(d.testimonials), gal = L(d.gallery)
  const initials = (d.name || 'You').replace(/^Dr\.?\s*/i, '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const social = ['instagram', 'linkedin', 'facebook'].filter(k => d[k])
  return (
    <div className={`site t${t.id}`} style={{ '--a': d.color || t.accent, '--bg': t.bg, '--ink': t.ink }}>
      <header className="s-nav"><b>{d.name || 'Your name'}</b><nav><span>About</span><span>Services</span><span>Contact</span></nav><button className="s-btn sm">{p.cta}</button></header>
      <section className="s-hero">
        <div><em className="s-kick">{p.kick}</em><small>{d.title || 'Your title'}</small>
          <h2>{d.tagline || 'Your tagline appears here'}</h2><p>{(d.about || 'A short introduction about you or your business.').slice(0, 150)}</p>
          <button className="s-btn">{p.cta}</button><span className="s-link">Learn more →</span></div>
        <div className="s-art"><div className="s-mono">{initials}</div><span className="s-badge">{d.years} yrs experience</span></div>
      </section>
      <div className="s-stats"><div><b>{d.years}</b><span>Years of experience</span></div><div><b>{svc.length || '—'}</b><span>Services</span></div><div><b>{tes.length || '—'}</b><span>Client stories</span></div></div>
      <section className="s-sec"><h4>About</h4><p>{d.about || 'Tell visitors who you are.'}</p>{d.why && <blockquote>{d.why}</blockquote>}</section>
      {svc.length > 0 && <section className="s-sec"><h4>{p.sv}</h4><div className="s-cards">{svc.map((s, i) => <div key={i}><i>{String(i + 1).padStart(2, '0')}</i>{s}</div>)}</div></section>}
      {exp.length > 0 && <section className="s-sec"><h4>{p.ex}</h4><div className="s-chips">{exp.map((s, i) => <span key={i}>{s}</span>)}</div></section>}
      {tes.length > 0 && <section className="s-sec"><h4>Kind words</h4>{tes.map((s, i) => { const [w, ...q] = s.split('–'); return <figure key={i}><blockquote>“{(q.length ? q.join('–') : w).trim()}”</blockquote>{q.length > 0 && <figcaption>{w.trim()}</figcaption>}</figure> })}</section>}
      {gal.length > 0 && <section className="s-sec"><h4>Gallery</h4><div className="s-gal">{gal.map((u, i) => <img key={i} src={u} alt="" />)}</div></section>}
      <section className="s-sec s-contact"><h4>Contact</h4>
        <div><b>{p.note}</b><span>{d.hours || '—'}</span></div><div><b>Call</b><span>{d.phone || '—'}</span></div>
        <div><b>Email</b><span>{d.email || '—'}</span></div><div><b>Visit</b><span>{d.address || '—'}</span></div>
        <div className="s-chips">{social.map(k => <a key={k} href={d[k]}>{k}</a>)}</div></section>
      <footer className="s-foot">© {d.name || 'Your name'} · Built with SiteCraft</footer>
      {(d.addons || []).includes('wa') && <span className="s-wa">WhatsApp</span>}
    </div>
  )
}
