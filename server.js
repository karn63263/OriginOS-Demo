const express = require('express');
const crypto = require('crypto');
const path = require('path');
const db = require('./db');
require('./seed')();

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.ADMIN_PASSWORD) console.warn('[warn] ADMIN_PASSWORD not set - using default "changeme". Set it in .env / environment before deploying.');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '20kb' }));

// ---------- tiny in-memory rate limiter ----------
const hits = new Map();
function limit(max, windowMs) {
  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'Too many requests. Slow down, builder.' });
    arr.push(now); hits.set(key, arr); next();
  };
}
setInterval(() => hits.clear(), 3600 * 1000).unref();

// ---------- helpers ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAINS = ['AI / ML', 'Web', 'App', 'Cyber Security', 'Cloud & DevOps', 'IoT / Embedded', 'Robotics', 'Open Source'];
const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const wrap = fn => (req, res) => { try { fn(req, res); } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); } };

// ---------- public API ----------
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/stats', wrap((req, res) => res.json(db.prepare('SELECT key,label,value FROM stats ORDER BY sort').all())));

app.get('/api/projects', wrap((req, res) => {
  res.json(db.prepare('SELECT * FROM projects ORDER BY sort').all().map(p => ({ ...p, stack: p.stack.split(',') })));
}));

app.get('/api/team', wrap((req, res) => {
  res.json(db.prepare('SELECT * FROM members ORDER BY sort').all().map(m => ({ ...m, skills: m.skills.split(',') })));
}));

app.get('/api/leaderboard', wrap((req, res) => res.json(db.prepare('SELECT name,category,xp FROM leaderboard ORDER BY xp DESC').all())));
app.get('/api/gallery', wrap((req, res) => res.json(db.prepare('SELECT icon,caption,category,meta FROM gallery ORDER BY sort').all())));
app.get('/api/timeline', wrap((req, res) => res.json(db.prepare('SELECT year,title,body FROM timeline ORDER BY sort').all())));
app.get('/api/missions', wrap((req, res) => res.json(db.prepare('SELECT name,status,description FROM missions ORDER BY sort').all())));
app.get('/api/feed', wrap((req, res) => res.json(db.prepare('SELECT icon,text,created_at FROM feed ORDER BY id DESC LIMIT 20').all())));

app.post('/api/applications', limit(5, 3600 * 1000), wrap((req, res) => {
  const name = clean(req.body.name, 100), email = clean(req.body.email, 150).toLowerCase();
  const domain = clean(req.body.domain, 50), about = clean(req.body.about, 1000);
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'A valid email is required.' });
  if (!DOMAINS.includes(domain)) return res.status(400).json({ error: 'Please choose a domain.' });
  if (db.prepare('SELECT 1 FROM applications WHERE email=?').get(email))
    return res.status(409).json({ error: 'An application from this email already exists.' });
  const txId = 'OG-' + crypto.randomInt(10000, 100000);
  db.prepare('INSERT INTO applications(tx_id,name,email,domain,about) VALUES (?,?,?,?,?)').run(txId, name, email, domain, about);
  db.prepare('INSERT INTO feed(icon,text) VALUES (?,?)').run('✦', `New application: ${domain}`);
  res.status(201).json({ ok: true, transactionId: txId });
}));

app.post('/api/newsletter', limit(10, 3600 * 1000), wrap((req, res) => {
  const email = clean(req.body.email, 150).toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'A valid email is required.' });
  db.prepare('INSERT OR IGNORE INTO subscribers(email) VALUES (?)').run(email);
  res.status(201).json({ ok: true });
}));

app.post('/api/ori', limit(60, 3600 * 1000), wrap((req, res) => {
  const q = clean(req.body.question, 300);
  if (!q) return res.status(400).json({ error: 'Empty question.' });
  if (/sudo recruit me/i.test(q)) {
    db.prepare('INSERT INTO ori_log(question,matched) VALUES (?,1)').run(q);
    return res.json({ action: 'apply', answer: 'Executing…' });
  }
  const hit = db.prepare('SELECT pattern,answer FROM ori_faq ORDER BY sort').all()
    .find(f => new RegExp('(' + f.pattern + ')', 'i').test(q));
  db.prepare('INSERT INTO ori_log(question,matched) VALUES (?,?)').run(q, hit ? 1 : 0);
  res.json({ answer: hit ? hit.answer : 'I am a club assistant, not a general oracle — but I do know everything about <b>ORIGIN</b>. Try: joining, hackathons, events, projects, XP, or resources.' });
}));

// ---------- admin ----------
function sign(exp) { return exp + '.' + crypto.createHmac('sha256', SECRET).update(String(exp)).digest('hex'); }
function verify(tok) {
  const [exp, mac] = String(tok || '').split('.');
  if (!exp || !mac || Date.now() > Number(exp)) return false;
  const good = sign(exp).split('.')[1];
  return mac.length === good.length && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(good));
}
const auth = (req, res, next) => verify((req.headers.authorization || '').replace('Bearer ', '')) ? next() : res.status(401).json({ error: 'Unauthorized' });

app.post('/api/admin/login', limit(8, 15 * 60 * 1000), (req, res) => {
  const a = Buffer.from(String(req.body.password || '')), b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Wrong password.' });
  res.json({ token: sign(Date.now() + 8 * 3600 * 1000) });
});

app.get('/api/admin/summary', auth, wrap((req, res) => res.json({
  applications: db.prepare('SELECT COUNT(*) c FROM applications').get().c,
  newApplications: db.prepare("SELECT COUNT(*) c FROM applications WHERE status='new'").get().c,
  subscribers: db.prepare('SELECT COUNT(*) c FROM subscribers').get().c,
  oriQuestions: db.prepare('SELECT COUNT(*) c FROM ori_log').get().c,
  oriUnmatched: db.prepare('SELECT COUNT(*) c FROM ori_log WHERE matched=0').get().c,
})));
app.get('/api/admin/applications', auth, wrap((req, res) => res.json(db.prepare('SELECT * FROM applications ORDER BY id DESC').all())));
app.patch('/api/admin/applications/:id', auth, wrap((req, res) => {
  const status = clean(req.body.status, 20);
  if (!['new', 'reviewing', 'challenge', 'accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'Bad status' });
  db.prepare('UPDATE applications SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ ok: true });
}));
app.delete('/api/admin/applications/:id', auth, wrap((req, res) => { db.prepare('DELETE FROM applications WHERE id=?').run(req.params.id); res.json({ ok: true }); }));
app.get('/api/admin/subscribers', auth, wrap((req, res) => res.json(db.prepare('SELECT * FROM subscribers ORDER BY id DESC').all())));
app.get('/api/admin/ori-log', auth, wrap((req, res) => res.json(db.prepare('SELECT * FROM ori_log ORDER BY id DESC LIMIT 200').all())));

app.patch('/api/admin/stats/:key', auth, wrap((req, res) => {
  const v = parseInt(req.body.value, 10);
  if (!Number.isFinite(v) || v < 0) return res.status(400).json({ error: 'Bad value' });
  db.prepare('UPDATE stats SET value=? WHERE key=?').run(v, req.params.key); res.json({ ok: true });
}));
app.post('/api/admin/leaderboard', auth, wrap((req, res) => {
  const name = clean(req.body.name, 80), category = clean(req.body.category, 40), xp = parseInt(req.body.xp, 10);
  if (!name || !Number.isFinite(xp)) return res.status(400).json({ error: 'name and xp required' });
  const row = db.prepare('SELECT id FROM leaderboard WHERE name=?').get(name);
  if (row) db.prepare('UPDATE leaderboard SET xp=?, category=COALESCE(NULLIF(?,\'\'),category) WHERE id=?').run(xp, category, row.id);
  else db.prepare('INSERT INTO leaderboard(name,category,xp) VALUES (?,?,?)').run(name, category || 'General', xp);
  res.json({ ok: true });
}));
app.post('/api/admin/feed', auth, wrap((req, res) => {
  const text = clean(req.body.text, 200); if (!text) return res.status(400).json({ error: 'text required' });
  db.prepare('INSERT INTO feed(icon,text) VALUES (?,?)').run(clean(req.body.icon, 4) || '⎇', text); res.json({ ok: true });
}));

app.get('/api/admin/export/applications.csv', auth, wrap((req, res) => {
  const esc = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"';
  const rows = db.prepare('SELECT tx_id,name,email,domain,about,status,created_at FROM applications ORDER BY id').all();
  res.type('text/csv').attachment('applications.csv')
    .send(['tx_id,name,email,domain,about,status,created_at', ...rows.map(r => Object.values(r).map(esc).join(','))].join('\n'));
}));

// ---------- static ----------
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`ORIGIN is live → http://localhost:${PORT}   (admin: /admin)`));
