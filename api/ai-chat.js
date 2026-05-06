import { readBearerToken, runAiChat } from '../src/server/aiChatCore.js';

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'هذا المسار يقبل POST فقط.' });
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    return json(res, 400, { error: 'صيغة الطلب غير صالحة.' });
  }

  const result = await runAiChat({
    message: body?.message,
    history: body?.history,
    token: readBearerToken(req),
    timeoutMs: 55000,
  });

  return json(res, result.status, result.body);
}
