import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readBearerToken, runAiChat } from './src/server/aiChatCore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile(fileName) {
  const filePath = path.join(__dirname, fileName);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

const app = express();
const port = process.env.PORT || 3001;
const distPath = path.join(__dirname, 'dist');

app.use(express.json({ limit: '1mb' }));

app.post('/api/ai-chat', async (req, res) => {
  const result = await runAiChat({
    message: req.body?.message,
    history: req.body?.history,
    token: readBearerToken(req),
    timeoutMs: 60000,
  });

  return res.status(result.status).json(result.body);
});

app.use(express.static(distPath));

app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) return next();

  res.sendFile(path.join(distPath, 'index.html'), (error) => {
    if (error) res.status(404).send('Build the frontend first with npm run build.');
  });
});

app.listen(port, () => {
  console.log(`Dahab app listening on http://localhost:${port}`);
});
