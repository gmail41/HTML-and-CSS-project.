// Contact form endpoint. The recipient, sender and API key come from server
// environment variables only: CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL, RESEND_API_KEY.
const LIMITS = { name: 120, email: 200, topic: 60, message: 5000 };
const hits = new Map(); // best-effort, per server instance
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;

function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > MAX_HITS;
}
const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : '');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ ok: false });

  if (b.website) return res.status(200).json({ ok: true }); // honeypot: silently drop bots

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });

  const name = clean(b.name, LIMITS.name);
  const email = clean(b.email, LIMITS.email);
  const topic = clean(b.topic, LIMITS.topic) || 'General';
  const message = typeof b.message === 'string' ? b.message.trim().slice(0, LIMITS.message) : '';
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Please complete all fields with a valid email address.' });
  }

  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    return res.status(500).json({ ok: false, error: 'Unable to send your message right now.' });
  }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [CONTACT_TO_EMAIL],
        reply_to: email,
        subject: 'Website inquiry: ' + topic,
        text: 'Name: ' + name + '\nEmail: ' + email + '\nType: ' + topic + '\n\n' + message,
      }),
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: 'Unable to send your message right now.' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'Unable to send your message right now.' });
  }
};
