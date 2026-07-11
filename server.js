const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4000;
const CONTENT_PATH = path.join(__dirname, 'content.json');
const AUTH_PATH = path.join(__dirname, 'auth.json');
const SESSION_COOKIE = 'craftorix_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEFAULT_PASSWORD = 'changeme';

const sessions = new Map(); // token -> expiry timestamp

app.use(express.json({ limit: '2mb' }));

// ---------- auth helpers ----------
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function loadAuth() {
  if (!fs.existsSync(AUTH_PATH)) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(DEFAULT_PASSWORD, salt);
    fs.writeFileSync(AUTH_PATH, JSON.stringify({ salt, hash }, null, 2));
    console.log('\nNo admin password was set, so one was created.');
    console.log(`Default admin password: "${DEFAULT_PASSWORD}" — log in at /admin and change it right away.\n`);
  }
  return JSON.parse(fs.readFileSync(AUTH_PATH, 'utf8'));
}

function verifyPassword(password, auth) {
  if (typeof password !== 'string' || !password) return false;
  const candidate = Buffer.from(hashPassword(password, auth.salt), 'hex');
  const stored = Buffer.from(auth.hash, 'hex');
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

function setPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  fs.writeFileSync(AUTH_PATH, JSON.stringify({ salt, hash }, null, 2));
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  header.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return out;
}

function createSession(res) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_MS / 1000}; SameSite=Lax`);
}

function destroySession(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

function isAuthenticated(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return false;
  const expiry = sessions.get(token);
  if (!expiry || expiry < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function requireAuth(req, res, next) {
  if (isAuthenticated(req)) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

loadAuth();

// Serve the public site and admin panel as static files.
app.use(express.static(__dirname, { index: 'index.html' }));

// ---------- auth routes ----------
app.get('/api/session', (req, res) => {
  res.json({ authenticated: isAuthenticated(req) });
});

app.post('/api/login', (req, res) => {
  const auth = loadAuth();
  if (!verifyPassword((req.body || {}).password, auth)) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  createSession(res);
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

app.post('/api/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const auth = loadAuth();
  if (!verifyPassword(currentPassword, auth)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  setPassword(newPassword);
  res.json({ ok: true });
});

// ---------- content routes ----------
app.get('/api/content', (req, res) => {
  fs.readFile(CONTENT_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Could not read content.json' });
    res.type('application/json').send(data);
  });
});

app.post('/api/content', requireAuth, (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Body must be a JSON object' });
  }
  fs.writeFile(CONTENT_PATH, JSON.stringify(body, null, 2), 'utf8', (err) => {
    if (err) return res.status(500).json({ error: 'Could not save content.json' });
    res.json({ ok: true });
  });
});

app.listen(PORT, () => {
  console.log(`Site:  http://localhost:${PORT}/`);
  console.log(`Admin: http://localhost:${PORT}/admin`);
});
