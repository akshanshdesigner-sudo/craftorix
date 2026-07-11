const { CONTENT_PATH, getFile, putFile, isAuthenticated, json } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod === 'GET') {
    try {
      const file = await getFile(CONTENT_PATH);
      if (!file) return json(404, { error: 'content.json not found in repo' });
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: file.content };
    } catch (e) {
      return json(500, { error: 'Server error: ' + e.message });
    }
  }

  if (event.httpMethod === 'POST') {
    if (!isAuthenticated(event)) return json(401, { error: 'Not authenticated' });
    let body;
    try {
      body = JSON.parse(event.body || '');
    } catch (e) {
      return json(400, { error: 'Body must be valid JSON' });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json(400, { error: 'Body must be a JSON object' });
    }
    try {
      const existing = await getFile(CONTENT_PATH);
      await putFile(CONTENT_PATH, JSON.stringify(body, null, 2), existing ? existing.sha : null, 'Update site content via admin');
      return json(200, { ok: true });
    } catch (e) {
      return json(500, { error: 'Server error: ' + e.message });
    }
  }

  return json(405, { error: 'Method not allowed' });
};
