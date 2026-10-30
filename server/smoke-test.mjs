// Quick security/behaviour checks. Start the server, then run: npm test
import jwt from 'jsonwebtoken'
const B = process.env.TEST_URL || `http://localhost:${process.env.PORT || 4000}`
const tok = role => 'Bearer ' + jwt.sign({ email: 'test@example.com', role }, process.env.JWT_SECRET)
const call = (p, o = {}) => fetch(B + p, { ...o, headers: { 'Content-Type': 'application/json', ...o.headers } })
const post = (p, body, auth) => call(p, { method: 'POST', body: JSON.stringify(body), headers: auth ? { Authorization: auth } : {} })
const checks = [
  ['no token is rejected', async () => (await call('/api/sites')).status === 401],
  ['customer cannot open admin', async () => (await call('/api/admin/sites', { headers: { Authorization: tok('customer') } })).status === 403],
  ['forged token is rejected', async () => (await call('/api/sites', { headers: { Authorization: 'Bearer abc.def.ghi' } })).status === 401],
  ['bad payment signature is rejected', async () => (await post('/api/payments/verify', { orderId: 'x', paymentId: 'y', signature: 'z' }, tok('customer'))).status === 400],
  ['fake webhook is rejected', async () => (await post('/api/payments/webhook', { event: 'payment.captured' })).status === 400],
  ['site cannot be published without payment', async () => (await post('/api/sites', { orderId: 'x', sub: 'testsite', data: {} }, tok('customer'))).status === 402],
  ['reserved address is refused', async () => (await post('/api/sites', { orderId: 'x', sub: 'admin', data: {} }, tok('customer'))).status === 409],
  ['unknown plan is refused', async () => (await post('/api/payments/order', { plan: 'Free' }, tok('customer'))).status === 400],
  ['security headers are on', async () => (await call('/api/sites')).headers.get('x-content-type-options') === 'nosniff'],
]
let bad = 0
for (const [name, fn] of checks) { let ok = false; try { ok = await fn() } catch {} ; if (!ok) bad++; console.log(ok ? 'PASS' : 'FAIL', name) }
process.exit(bad ? 1 : 0)
