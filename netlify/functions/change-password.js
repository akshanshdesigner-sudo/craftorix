const { loadAuth, saveAuth, verifyPassword, newPasswordRecord, isAuthenticated, json } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!isAuthenticated(event)) return json(401, { error: 'Not authenticated' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid request body' });
  }

  const { currentPassword, newPassword } = body;
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return json(400, { error: 'New password must be at least 6 characters' });
  }

  try {
    const { auth, sha } = await loadAuth();
    if (!verifyPassword(currentPassword, auth)) {
      return json(401, { error: 'Current password is incorrect' });
    }
    await saveAuth(newPasswordRecord(newPassword), sha);
    return json(200, { ok: true });
  } catch (e) {
    return json(500, { error: 'Server error: ' + e.message });
  }
};
