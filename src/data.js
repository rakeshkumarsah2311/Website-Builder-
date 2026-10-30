// All demo data lives here. Replace with API calls when the backend is ready.
export const TEMPLATES = [
  { id: 1, name: 'Corporate Blue', accent: '#2547d0', bg: '#eaf0ff', ink: '#10243a' },
  { id: 2, name: 'Aurora Minimal', accent: '#1f4d3a', bg: '#f6f4ee', ink: '#1b1b18' },
  { id: 3, name: 'Growth', accent: '#0b7a75', bg: '#e9f6f5', ink: '#0d2b2a' },
  { id: 4, name: 'Midnight Pro', accent: '#f2b134', bg: '#14163a', ink: '#ffffff' },
]
export const TYPES = ['Doctor', 'Consultant', 'Freelancer', 'Individual Professional', 'Small Business', 'Service Provider', 'Other']
// Prices are placeholders – confirm plans with the client in the SRS.
export const PLANS = [
  { id: 'Basic', price: 2499, pages: '5 pages', perks: ['Subdomain', 'Contact form', 'Mobile-ready'] },
  { id: 'Professional', price: 4999, pages: '10 pages', perks: ['Everything in Basic', 'Testimonials & gallery', 'SEO tools'] },
  { id: 'Premier', price: 9999, pages: 'Unlimited', perks: ['Everything in Professional', 'Priority support', 'Analytics'] },
]
export const ADDONS = [
  { id: 'wa', name: 'WhatsApp chat button', price: 499 },
  { id: 'social', name: 'Social media links & feed', price: 299 },
  { id: 'appt', name: 'Appointment request form', price: 699 },
]
export const TAKEN = ['www', 'admin', 'app', 'api', 'drrahul']
export const SITES = [
  { id: 1, domain: 'drrahulsharma', owner: 'Dr. Rahul Sharma', template: 'Corporate Blue', plan: 'Professional', status: 'Active' },
  { id: 2, domain: 'skillhub', owner: 'Neha Patil', template: 'Growth', plan: 'Premier', status: 'Active' },
  { id: 3, domain: 'gopalkart', owner: 'Rohit Agarwal', template: 'Aurora Minimal', plan: 'Basic', status: 'Expired' },
  { id: 4, domain: 'creativenest', owner: 'Pooja Mehta', template: 'Midnight Pro', plan: 'Professional', status: 'Active' },
  { id: 5, domain: 'fitnessZone', owner: 'Siddharth Roy', template: 'Corporate Blue', plan: 'Basic', status: 'Suspended' },
]
export const REVENUE = [
  { m: 'May', v: 52000 }, { m: 'Jun', v: 91000 }, { m: 'Jul', v: 118000 },
  { m: 'Aug', v: 152000 }, { m: 'Sep', v: 201000 }, { m: 'Oct', v: 284000 },
]
export const inr = n => '₹' + n.toLocaleString('en-IN')
export const SECTIONS = [
  { t: 'About you', f: [['type', 'I am a', 'type'], ['name', 'Name or business name'], ['title', 'Professional title'], ['tagline', 'Tagline'], ['about', 'About you', 'area'], ['years', 'Years of experience', 'years']] },
  { t: 'Services', f: [['services', 'Services (one per line)', 'area']] },
  { t: 'Expertise', f: [['expertise', 'Areas of expertise (one per line)', 'area']] },
  { t: 'Why choose you', f: [['why', 'What makes you different', 'area']] },
  { t: 'Testimonials', f: [['testimonials', 'One per line: Name – what they said', 'area']] },
  { t: 'Gallery', f: [['gallery', 'Image links, one per line', 'area']] },
  { t: 'Contact', f: [['phone', 'Phone'], ['email', 'Email'], ['address', 'Address']] },
  { t: 'Business hours', f: [['hours', 'Opening hours']] },
  { t: 'Social media', f: [['instagram', 'Instagram link'], ['linkedin', 'LinkedIn link'], ['facebook', 'Facebook link']] },
  { t: 'Branding', f: [['color', 'Brand colour', 'color']] },
  { t: 'SEO', f: [['seoTitle', 'Page title for Google'], ['seoDesc', 'Description for Google', 'area']] },
  { t: 'Review', f: [] },
]
export const CUSTOMERS = [
  { name: 'Dr. Rahul Sharma', email: 'rahul@clinic.in', plan: 'Professional', sites: 1, joined: '04 Oct 2026' },
  { name: 'Neha Patil', email: 'neha@skillhub.in', plan: 'Premier', sites: 2, joined: '03 Oct 2026' },
  { name: 'Rohit Agarwal', email: 'rohit@gopalkart.in', plan: 'Basic', sites: 1, joined: '28 Sep 2026' },
  { name: 'Pooja Mehta', email: 'pooja@nest.in', plan: 'Professional', sites: 1, joined: '22 Sep 2026' },
]
export const PAYMENTS = [
  { date: '05 Oct 2026', customer: 'Dr. Rahul Sharma', plan: 'Professional', amount: 4999, status: 'Success' },
  { date: '05 Oct 2026', customer: 'Neha Patil', plan: 'Premier', amount: 9999, status: 'Success' },
  { date: '04 Oct 2026', customer: 'Rohit Agarwal', plan: 'Basic', amount: 2499, status: 'Failed' },
  { date: '04 Oct 2026', customer: 'Pooja Mehta', plan: 'Professional', amount: 4999, status: 'Success' },
]
export const SUBS = [
  { customer: 'Dr. Rahul Sharma', plan: 'Professional', renews: '04 Oct 2027', status: 'Active' },
  { customer: 'Neha Patil', plan: 'Premier', renews: '03 Oct 2027', status: 'Active' },
  { customer: 'Rohit Agarwal', plan: 'Basic', renews: '28 Sep 2026', status: 'Expired' },
  { customer: 'Pooja Mehta', plan: 'Professional', renews: '22 Sep 2027', status: 'Active' },
]
// Sample customers used for the showcase and template thumbnails (fictional).
const base = { addons: ['wa'], color: '', instagram: '', linkedin: 'https://linkedin.com', facebook: '', gallery: '' }
export const SAMPLES = {
  Doctor: { ...base, type: 'Doctor', template: 1, name: 'Dr. Ananya Rao', title: 'Consultant Cardiologist', tagline: 'Heart care that listens first.',
    about: 'Fifteen years of treating and preventing heart disease, with time for every question you bring to the consultation.', years: '15+',
    services: 'Preventive cardiology\nEchocardiography\nCardiac rehabilitation\nSecond opinions', expertise: 'Hypertension\nHeart failure\nLipid disorders',
    why: 'Unhurried consultations, clear explanations and a written plan you can take home.', testimonials: 'Rohit M. – I finally understood my reports and what to do next.\nSunita D. – Calm, thorough and always available for follow-up.',
    phone: '+91 98765 43210', email: 'clinic@example.in', address: 'Hill Cart Road, Siliguri', hours: 'Mon–Sat, 10:00–18:00' },
  Consultant: { ...base, type: 'Consultant', template: 2, name: 'Meera Kapoor', title: 'Strategy & Operations Consultant', tagline: 'Clear strategy for growing companies.',
    about: 'I help founders and leadership teams turn ambition into a plan their people can execute.', years: '12+',
    services: 'Growth strategy\nOperating model design\nLeadership workshops', expertise: 'Market entry\nPricing\nProcess improvement',
    why: 'Senior-level attention on every engagement, with practical deliverables, not slideware.', testimonials: 'A. Verma – Our plan went from vague to measurable in six weeks.',
    phone: '+91 91234 56780', email: 'hello@example.in', address: 'Kolkata', hours: 'Mon–Fri, 9:30–17:30' },
  Freelancer: { ...base, type: 'Freelancer', template: 4, name: 'Arjun Sen', title: 'Brand & Web Designer', tagline: 'Design that makes small brands look big.',
    about: 'Independent designer creating identities and websites for founders who care about craft.', years: '8+',
    services: 'Brand identity\nWebsite design\nPackaging', expertise: 'Figma\nTypography\nArt direction', why: 'You work directly with me, from first sketch to final files.',
    testimonials: 'Nisha P. – Fast, thoughtful and a joy to work with.', phone: '+91 99887 76655', email: 'arjun@example.in', address: 'Remote, India', hours: 'Mon–Fri, 11:00–19:00' },
  'Small Business': { ...base, type: 'Small Business', template: 3, name: 'Green Leaf Wellness', title: 'Ayurvedic Wellness Studio', tagline: 'Everyday wellbeing, rooted in tradition.',
    about: 'A neighbourhood studio offering therapies, consultations and herbal products.', years: '6+',
    services: 'Ayurvedic consultation\nMassage therapies\nHerbal products', expertise: 'Stress relief\nDigestive health', why: 'Qualified practitioners and carefully sourced ingredients.',
    testimonials: 'Priya S. – My go-to place to unwind.', phone: '+91 90000 11122', email: 'hello@greenleaf.example', address: 'Sevoke Road, Siliguri', hours: 'Daily, 9:00–20:00' },
}
