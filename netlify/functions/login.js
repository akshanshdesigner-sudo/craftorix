const { loadAuth, verifyPassword, createSessionCookie, json } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid request body' });
  }

  try {
    const { auth } = await loadAuth();
    if (!verifyPassword(body.password, auth)) {
      return json(401, { error: 'Incorrect password' });
    }
    return json(200, { ok: true }, { 'Set-Cookie': createSessionCookie() });
  } catch (e) {
    return json(500, { error: 'Server error: ' + e.message });
  }
};
