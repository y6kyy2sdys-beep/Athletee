const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));

const API_KEY = process.env.ANTHROPIC_API_KEY;
const DATA_FILE = path.join(__dirname, 'data.json');

// ── API ROUTES ──────────────────────────────────────────

app.get('/api/ping', (req, res) => {
  res.json({ ok: true, hasKey: !!API_KEY });
});

app.post('/api/coach', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (!API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY fehlt in Render Environment Variables.' });
  }
  try {
    const { system, messages } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: system || '',
        messages: messages || []
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API Fehler' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/analyze', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (!API_KEY) return res.status(500).json({ error: 'API-Key fehlt.' });
  try {
    const { base64, mime, filename, prompt } = req.body;
    const content = (base64 && mime && mime.startsWith('image/'))
      ? [{ type: 'image', source: { type: 'base64', media_type: mime, data: base64 } },
         { type: 'text', text: prompt || 'Analysiere dieses Gesundheitsdokument detailliert.' }]
      : [{ type: 'text', text: (prompt || 'Analysiere dieses Dokument.') + '\nDatei: ' + filename }];
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content }] })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Fehler' });
    res.json({ result: data.content ? data.content.map(c => c.text || '').join('') : 'Keine Antwort.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/save', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2)); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/load', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    res.json(fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── STATIC (LAST) ───────────────────────────────────────
app.use(express.static(path.join(__dirname)));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server laeuft auf Port ' + PORT + ' | API-Key: ' + (API_KEY ? 'OK' : 'FEHLT!'));
});
