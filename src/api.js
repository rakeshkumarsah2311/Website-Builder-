// Demo "backend" stored in the browser. Replace each function body with fetch('/api/...') when the server exists.
import { ADDONS, SITES } from './data'
const get = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f } catch { return f } }
const put = (k, v) => localStorage.setItem(k, JSON.stringify(v))
export const api = {
  user: () => get('user', null),
  login(email, otp, name) {
    if (otp !== '123456') throw new Error('Wrong code. In this demo the code is 123456.')
    const u = { email, name: name || email.split('@')[0], role: email === 'admin@sitecraft.in' ? 'admin' : 'customer' }
    put('user', u); return u
  },
  logout: () => { localStorage.removeItem('user'); localStorage.removeItem('token') },
  setSession: (t, u) => { put('token', t); put('user', u) },
  token: () => get('token', null),
  invoices: () => get('invoices', []),
  settings: () => get('settings', { gst: 18, reserved: 'www,admin,app,api', brand: 'SiteCraft' }),
  saveSettings: s => put('settings', s),
  addons: () => get('addons', ADDONS), saveAddons: a => put('addons', a),
  sites: () => get('sites', SITES), saveSites: s => put('sites', s),
  publish(site) {
    const renews = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10)
    put('sites', [{ id: Date.now(), status: 'Active', renews, ...site }, ...api.sites()])
    put('invoices', [{ id: 'INV-' + Date.now(), email: site.email, plan: site.plan, amount: site.amount, date: renews.slice(0, 0) + new Date().toISOString().slice(0, 10) }, ...api.invoices()])
  },
}

// ---- Server mode (used when VITE_API_URL is set) ----
export const API = import.meta.env.VITE_API_URL
api.call = async (path, method = 'GET', body) => {
  const r = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + api.token() }, body: body && JSON.stringify(body) })
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Request failed')
  return r.json()
}
// Opens Razorpay, waits for the server to verify the payment, and returns the paid order id.
api.checkout = async body => {
  const o = await api.call('/api/payments/order', 'POST', body)
  if (!window.Razorpay) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = ok; s.onerror = no; document.body.appendChild(s) })
  return new Promise((ok, no) => new window.Razorpay({ key: o.key, order_id: o.orderId, amount: o.amount, currency: 'INR', name: 'SiteCraft',
    modal: { ondismiss: () => no(new Error('Payment cancelled')) },
    handler: async r => { try { await api.call('/api/payments/verify', 'POST', { orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }); ok(o.orderId) } catch (e) { no(e) } } }).open())
}
