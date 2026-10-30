// SiteCraft API: email-code login, Razorpay payments (verified on the server), PostgreSQL, WordPress Multisite provisioning.
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import crypto from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import pg from 'pg'

const run = promisify(execFile) // execFile (not exec): arguments are never run through a shell
const { PORT = 4000, DATABASE_URL, FRONTEND_URL = 'http://localhost:5173', JWT_SECRET, RZP_KEY_ID, RZP_KEY_SECRET,
  RZP_WEBHOOK_SECRET = '', SMTP_URL, WP_PATH, BASE_DOMAIN = 'sitecraft.in', ADMIN_EMAIL = 'admin@sitecraft.in', GST = 18 } = process.env
if (!JWT_SECRET || JWT_SECRET.length < 16) throw new Error('Set a long JWT_SECRET in server/.env')

// Prices live here so customers can never change what they pay. Keep in sync with src/data.js.
const PRICES = { Basic: 2499, Professional: 4999, Premier: 9999 }
const ADDONS = { wa: 499, social: 299, appt: 699 }
const RESERVED = ['www', 'admin', 'app', 'api']
const TN = ['', 'Corporate Blue', 'Aurora Minimal', 'Growth', 'Midnight Pro']

const pool = new pg.Pool({ connectionString: DATABASE_URL })
const q = (text, params = []) => pool.query(text, params).then(r => r.rows)
await q(`
  CREATE TABLE IF NOT EXISTS otps(email text PRIMARY KEY, hash text, exp bigint, sent bigint, tries int DEFAULT 0);
  CREATE TABLE IF NOT EXISTS orders(id text PRIMARY KEY, email text, plan text, kind text DEFAULT 'new', site_id bigint,
    total int, status text DEFAULT 'created', payment_id text, used boolean DEFAULT false);
  CREATE TABLE IF NOT EXISTS sites(id bigint PRIMARY KEY, domain text UNIQUE, email text, owner text, plan text, template int,
    status text, wp_id text, data jsonb, renews date, error text);
  CREATE TABLE IF NOT EXISTS invoices(id text PRIMARY KEY, email text, plan text, amount int, date date DEFAULT now());`)

const SITE = `id::text, domain, email, owner, plan, template, status, wp_id AS "wpId", data, to_char(renews,'YYYY-MM-DD') AS renews`
const pub = s => ({ ...s, template: TN[s.template] || s.template })
const hash = s => crypto.createHash('sha256').update(s).digest('hex')
const safeEq = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
const h = fn => (req, res, next) => fn(req, res).catch(next) // send async errors to the error handler
const mailer = SMTP_URL ? nodemailer.createTransport(SMTP_URL) : null
const auth = role => (req, res, next) => {
  try { const u = jwt.verify((req.get('Authorization') || '').slice(7), JWT_SECRET)
    if (role && u.role !== role) return res.sendStatus(403); req.user = u; next() } catch { res.sendStatus(401) }
}

// Only known text fields are stored, with a length limit, and social links must be http(s).
const TEXT = ['type', 'years', 'hours', 'name', 'title', 'tagline', 'about', 'services', 'expertise', 'why', 'testimonials', 'gallery',
  'phone', 'email', 'address', 'seoTitle', 'seoDesc']
function clean(d = {}) {
  const o = {}
  for (const k of TEXT) if (d[k] != null) o[k] = String(d[k]).slice(0, 3000)
  for (const k of ['instagram', 'linkedin', 'facebook']) if (/^https?:\/\//i.test(d[k] || '')) o[k] = String(d[k]).slice(0, 300)
  o.template = [1, 2, 3, 4].includes(+d.template) ? +d.template : 1
  if (/^#[0-9a-f]{6}$/i.test(d.color || '')) o.color = d.color
  o.addons = (Array.isArray(d.addons) ? d.addons : []).filter(a => a in ADDONS)
  return o
}

async function markPaid(orderId, paymentId) { // atomic and idempotent: the browser and the webhook can both report the same payment
  const [o] = await q(`UPDATE orders SET status='paid', payment_id=$2 WHERE id=$1 AND status<>'paid' RETURNING *`, [orderId, paymentId])
  if (o) await q('INSERT INTO invoices(id,email,plan,amount) VALUES($1,$2,$3,$4)', ['INV-' + crypto.randomUUID().slice(0, 8).toUpperCase(), o.email, o.plan, o.total])
}

const app = express()
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: FRONTEND_URL.split(',') }))
app.use('/api', rateLimit({ windowMs: 60e3, limit: 120 }))
app.use('/api/auth', rateLimit({ windowMs: 15 * 60e3, limit: 20 }))
app.post('/api/payments/webhook', express.raw({ type: '*/*' }), h(async (req, res) => { // raw body is needed to check the signature
  const sig = crypto.createHmac('sha256', RZP_WEBHOOK_SECRET).update(req.body).digest('hex')
  if (!RZP_WEBHOOK_SECRET || !safeEq(sig, req.get('X-Razorpay-Signature') || '')) return res.sendStatus(400)
  const e = JSON.parse(req.body), p = e.payload?.payment?.entity
  if (e.event === 'payment.captured' && p) await markPaid(p.order_id, p.id)
  res.sendStatus(200)
}))
app.use(express.json({ limit: '100kb' }))

// ---- Login by email code ----
app.post('/api/auth/send', h(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' })
  const [prev] = await q('SELECT sent FROM otps WHERE email=$1', [email])
  if (prev && Date.now() - prev.sent < 30000) return res.status(429).json({ error: 'Please wait 30 seconds before asking for a new code.' })
  const otp = String(crypto.randomInt(100000, 1000000))
  await q(`INSERT INTO otps(email,hash,exp,sent,tries) VALUES($1,$2,$3,$4,0)
    ON CONFLICT(email) DO UPDATE SET hash=$2, exp=$3, sent=$4, tries=0`, [email, hash(otp + email), Date.now() + 600000, Date.now()])
  if (mailer) await mailer.sendMail({ to: email, subject: 'Your SiteCraft code', text: `Your code is ${otp}. It expires in 10 minutes.` })
  else console.log(`[dev] code for ${email}: ${otp}`)
  res.json({ ok: true })
}))
app.post('/api/auth/verify', h(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase()
  const [o] = await q('UPDATE otps SET tries=tries+1 WHERE email=$1 RETURNING *', [email])
  if (!o || o.exp < Date.now() || o.tries > 5) return res.status(400).json({ error: 'Code expired. Request a new one.' })
  if (!safeEq(hash(String(req.body.otp) + email), o.hash)) return res.status(400).json({ error: 'Wrong code.' })
  await q('DELETE FROM otps WHERE email=$1', [email])
  const user = { email, name: String(req.body.name || email.split('@')[0]).slice(0, 80), role: email === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'customer' }
  res.json({ token: jwt.sign(user, JWT_SECRET, { expiresIn: '7d' }), user })
}))

// ---- Payments (new site or renewal) ----
app.post('/api/payments/order', auth(), h(async (req, res) => {
  let { plan, addons = [] } = req.body, kind = 'new', siteId = null
  if (req.body.siteId) { // renewal: price comes from the customer's own site, never from the request
    const [s] = await q('SELECT plan FROM sites WHERE id=$1 AND email=$2', [req.body.siteId, req.user.email])
    if (!s) return res.sendStatus(404); plan = s.plan; addons = []; kind = 'renew'; siteId = req.body.siteId
  }
  if (!PRICES[plan]) return res.status(400).json({ error: 'Unknown plan' })
  const net = PRICES[plan] + addons.reduce((s, a) => s + (ADDONS[a] || 0), 0), total = Math.round(net * (1 + GST / 100))
  const r = await fetch('https://api.razorpay.com/v1/orders', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`).toString('base64') },
    body: JSON.stringify({ amount: total * 100, currency: 'INR', receipt: 'r' + Date.now() }) })
  if (!r.ok) return res.status(502).json({ error: 'Payment provider error' })
  const o = await r.json()
  await q('INSERT INTO orders(id,email,plan,kind,site_id,total) VALUES($1,$2,$3,$4,$5,$6)', [o.id, req.user.email, plan, kind, siteId, total])
  res.json({ orderId: o.id, amount: o.amount, key: RZP_KEY_ID })
}))
app.post('/api/payments/verify', auth(), h(async (req, res) => {
  const { orderId, paymentId, signature } = req.body
  const [o] = await q('SELECT email FROM orders WHERE id=$1', [String(orderId)])
  const expected = crypto.createHmac('sha256', RZP_KEY_SECRET || '').update(orderId + '|' + paymentId).digest('hex')
  if (!o || o.email !== req.user.email || !safeEq(expected, String(signature))) return res.status(400).json({ error: 'Invalid signature' })
  await markPaid(orderId, paymentId); res.json({ ok: true })
}))

// ---- WordPress (WP-CLI). Without WP_PATH this only simulates, so you can test everything else first. ----
const wp = (s, ...a) => run('wp', [...a, `--path=${WP_PATH}`, `--url=${s.domain}.${BASE_DOMAIN}`])
const push = s => wp(s, 'option', 'update', 'sitecraft_data', JSON.stringify(s.data), '--format=json')
async function provision(s) {
  for (let i = 1; i <= 3; i++) { // retry so a temporary failure doesn't lose a paid customer's site
    try {
      let wpId = null
      if (WP_PATH) {
        const { stdout } = await run('wp', ['site', 'create', `--slug=${s.domain}`, `--title=${s.data.name || s.domain}`, `--email=${s.email}`, '--porcelain', `--path=${WP_PATH}`])
        wpId = stdout.trim(); await wp(s, 'theme', 'activate', 'sitecraft'); await push(s)
      } else await new Promise(r => setTimeout(r, 1000))
      return void await q(`UPDATE sites SET status='Active', wp_id=$2, error=NULL WHERE id=$1`, [s.id, wpId])
    } catch (e) { if (i === 3) await q(`UPDATE sites SET status='Failed', error=$2 WHERE id=$1`, [s.id, String(e.message).slice(0, 500)]) }
  }
}
setInterval(async () => { // expire unpaid renewals
  const rows = await q(`UPDATE sites SET status='Expired' WHERE status='Active' AND renews < CURRENT_DATE RETURNING wp_id`).catch(() => [])
  if (WP_PATH) for (const r of rows) run('wp', ['site', 'archive', String(r.wp_id), `--path=${WP_PATH}`]).catch(() => {})
}, 3600e3)

// ---- Customer sites ----
app.post('/api/sites', auth(), h(async (req, res) => {
  const { orderId, sub } = req.body, data = clean(req.body.data)
  if (!/^[a-z0-9-]{3,30}$/.test(String(sub)) || RESERVED.includes(sub)) return res.status(409).json({ error: 'That address is not available.' })
  const [o] = await q(`UPDATE orders SET used=true WHERE id=$1 AND email=$2 AND status='paid' AND used=false AND kind='new' RETURNING plan`, [String(orderId), req.user.email])
  if (!o) return res.status(402).json({ error: 'Payment not confirmed.' })
  const id = Date.now()
  try {
    await q(`INSERT INTO sites(id,domain,email,owner,plan,template,status,data,renews) VALUES($1,$2,$3,$4,$5,$6,'Provisioning',$7,CURRENT_DATE + INTERVAL '1 year')`,
      [id, sub, req.user.email, data.name || '', o.plan, data.template, data])
  } catch (e) {
    await q('UPDATE orders SET used=false WHERE id=$1', [orderId]) // the customer already paid: let them pick another address
    if (e.code === '23505') return res.status(409).json({ error: 'That address is not available.' }); throw e
  }
  const [s] = await q(`SELECT ${SITE} FROM sites WHERE id=$1`, [id]); provision(s); res.status(202).json(pub(s))
}))
app.get('/api/sites', auth(), h(async (req, res) => res.json((await q(`SELECT ${SITE} FROM sites WHERE email=$1 ORDER BY id DESC`, [req.user.email])).map(pub))))
app.get('/api/invoices', auth(), h(async (req, res) => res.json(await q(`SELECT id, plan, amount, to_char(date,'YYYY-MM-DD') AS date FROM invoices WHERE email=$1 ORDER BY date DESC`, [req.user.email]))))
app.put('/api/sites/:id', auth(), h(async (req, res) => {
  const data = clean(req.body.data)
  const [s] = await q(`UPDATE sites SET data=$3, owner=$4 WHERE id=$1 AND email=$2 AND status IN ('Active','Provisioning') RETURNING ${SITE}`, [req.params.id, req.user.email, data, data.name || ''])
  if (!s) return res.sendStatus(404)
  if (WP_PATH) await push(s); res.json(pub(s))
}))
app.post('/api/sites/:id/renew', auth(), h(async (req, res) => {
  const [o] = await q(`UPDATE orders SET used=true WHERE id=$1 AND email=$2 AND status='paid' AND used=false AND kind='renew' AND site_id=$3 RETURNING id`, [String(req.body.orderId), req.user.email, req.params.id])
  if (!o) return res.status(402).json({ error: 'Payment not confirmed.' })
  const [s] = await q(`UPDATE sites SET renews=GREATEST(renews,CURRENT_DATE)+INTERVAL '1 year', status=CASE WHEN status='Expired' THEN 'Active' ELSE status END
    WHERE id=$1 RETURNING ${SITE}, wp_id`, [req.params.id])
  if (WP_PATH && s.status === 'Active') run('wp', ['site', 'unarchive', String(s.wpId), `--path=${WP_PATH}`]).catch(() => {})
  res.json(pub(s))
}))

// ---- Admin ----
app.get('/api/admin/sites', auth('admin'), h(async (req, res) => res.json((await q(`SELECT ${SITE} FROM sites ORDER BY id DESC`)).map(pub))))
app.get('/api/admin/overview', auth('admin'), h(async (req, res) => res.json({
  customers: await q(`SELECT max(owner) AS name, email, max(plan) AS plan, count(*)::int AS sites, to_char(to_timestamp(min(id)/1000),'DD Mon YYYY') AS joined FROM sites GROUP BY email`),
  payments: await q(`SELECT to_char(i.date,'DD Mon YYYY') AS date, COALESCE(s.owner,i.email) AS customer, i.plan, i.amount, 'Success' AS status FROM invoices i
    LEFT JOIN (SELECT DISTINCT ON (email) email, owner FROM sites ORDER BY email, id DESC) s USING(email) ORDER BY i.date DESC LIMIT 50`),
  subs: await q(`SELECT owner AS customer, plan, to_char(renews,'DD Mon YYYY') AS renews, CASE WHEN status='Expired' THEN 'Expired' ELSE 'Active' END AS status FROM sites ORDER BY id DESC`),
  revenue: await q(`SELECT to_char(date_trunc('month',date),'Mon') AS m, sum(amount)::int AS v FROM invoices WHERE date >= date_trunc('month',now()) - INTERVAL '5 months'
    GROUP BY date_trunc('month',date) ORDER BY date_trunc('month',date)`),
})))
app.post('/api/admin/sites/:id/status', auth('admin'), h(async (req, res) => {
  const steps = { Active: ['unarchive', 'activate'], Suspended: ['archive'], Blacklisted: ['deactivate'] }[req.body.status]
  if (!steps) return res.sendStatus(400)
  const [s] = await q(`UPDATE sites SET status=$2 WHERE id=$1 RETURNING ${SITE}`, [req.params.id, req.body.status])
  if (!s) return res.sendStatus(404)
  if (WP_PATH) for (const c of steps) await run('wp', ['site', c, String(s.wpId), `--path=${WP_PATH}`]).catch(() => {})
  console.log(`[audit] ${req.user.email} set ${s.domain} to ${s.status}`)
  res.json(pub(s))
}))

app.use((e, req, res, next) => { console.error(e); res.status(500).json({ error: 'Something went wrong. Please try again.' }) })
app.listen(PORT, () => console.log(`SiteCraft API on :${PORT}`))
