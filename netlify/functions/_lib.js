const crypto = require('crypto');

const GITHUB_API = 'https://api.github.com';
const CONTENT_PATH = 'content.json';
const AUTH_PATH = 'auth.json';
const SESSION_COOKIE = 'craftorix_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const DEFAULT_PASSWORD = 'changeme';

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function githubHeaders() {
  return {
    Authorization: `Bearer ${env('GITHUB_TOKEN')}`,
    'User-Agent': 'craftorix-cms',
    Accept: 'application/vnd.github+json'
  };
}

function repoInfo() {
  return { repo: env('GITHUB_REPO'), branch: process.env.GITHUB_BRANCH || 'main' };
}

// ---------- GitHub Contents API ----------
async function getFile(path) {
  const { repo, branch } = repoInfo();
  const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}?ref=${branch}`, {
    headers: githubHeaders()
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return { content: Buffer.from(data.content, 'base64').toString('utf8'), sha: data.sha };
}

async function putFile(path, contentStr, sha, message) {
  const { repo, branch } = repoInfo();
  const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: Buffer.from(contentStr, 'utf8').toString('base64'),
      branch,
      ...(sha ? { sha } : {})
    })
  });
  if (!res.ok) throw new Error(`GitHub write failed (${res.status}): ${await res.text()}`);
  return res.json();
}

// ---------- password hashing ----------
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, auth) {
  if (typeof password !== 'string' || !password) return false;
  const candidate = Buffer.from(hashPassword(password, auth.salt), 'hex');
  const stored = Buffer.from(auth.hash, 'hex');
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

function newPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, hash: hashPassword(password, salt) };
}

async function loadAuth() {
  const file = await getFile(AUTH_PATH);
  if (file) return { auth: JSON.parse(file.content), sha: file.sha };
  const auth = newPasswordRecord(DEFAULT_PASSWORD);
  const result = await putFile(AUTH_PATH, JSON.stringify(auth, null, 2), null, 'Create default admin auth');
  return { auth, sha: result.content.sha };
}

async function saveAuth(auth, sha) {
  await putFile(AUTH_PATH, JSON.stringify(auth, null, 2), sha, 'Update admin password');
}

// ---------- signed session cookies (stateless, no server memory) ----------
function sign(value) {
  return crypto.createHmac('sha256', env('SESSION_SECRET')).update(value).digest('hex');
}

function createSessionCookie() {
  const expiry = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = String(expiry);
  const token = `${payload}.${sign(payload)}`;
  return `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax; Secure`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}

function parseCookies(event) {
  const header = (event.headers && (event.headers.cookie || event.headers.Cookie)) || '';
  const out = {};
  header.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return out;
}

function isAuthenticated(event) {
  const token = parseCookies(event)[SESSION_COOKIE];
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return Number(payload) > Date.now();
}

function json(statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
    body: JSON.stringify(body)
  };
}

module.exports = {
  CONTENT_PATH, AUTH_PATH,
  getFile, putFile,
  verifyPassword, newPasswordRecord,
  loadAuth, saveAuth,
  createSessionCookie, clearSessionCookie, isAuthenticated,
  json
};
