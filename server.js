// Athletee Server — Coach-Proxy, Datenspeicher & Apple-Health-Endpoint
// Läuft z.B. auf Render.com. Der Anthropic-API-Key wird NUR als Umgebungsvariable
// gespeichert (ANTHROPIC_API_KEY) und niemals an den Browser ausgeliefert.

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    // App-Seite & Service Worker nie im Browser-HTTP-Cache festhalten — Updates sofort sichtbar
    if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

const API_KEY = process.env.ANTHROPIC_API_KEY;
const STEPS_TOKEN = process.env.STEPS_TOKEN || 'athletee'; // für Apple-Kurzbefehl
const DATA_FILE = path.join(__dirname, 'userdata.json');
const STEPS_FILE = path.join(__dirname, 'steps.json');

function readJSON(file, fallback) {
  try { return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback; }
  catch (e) { return fallback; }
}
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data)); }

// ─── COACH ENDPOINT (sicherer Proxy zur Anthropic-API) ───
app.post('/api/coach', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: 'API-Key nicht konfiguriert. Bitte ANTHROPIC_API_KEY in den Server-Umgebungsvariablen setzen.' });
  }
  try {
    const { system, messages, model, max_tokens } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-6',
        max_tokens: max_tokens || 800,
        system: system || '',
        messages: messages || []
      })
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Coach-Verbindung fehlgeschlagen: ' + err.message });
  }
});

// ─── DATEN SPEICHERN (gesamter App-Zustand) ───
app.post('/api/save', (req, res) => {
  try { writeJSON(DATA_FILE, req.body); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DATEN LADEN (App-Zustand + von Apple Health gemeldete Schritte) ───
app.get('/api/load', (req, res) => {
  try {
    const state = readJSON(DATA_FILE, {});
    const steps = readJSON(STEPS_FILE, {});
    res.json({ state, steps });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── APPLE HEALTH SCHRITTE (vom iPhone-Kurzbefehl aufgerufen) ───
// Beispiel-Aufruf:  GET /api/steps?token=athletee&steps=10342&date=2026-06-15
function ingestSteps(req, res) {
  const token = req.query.token || (req.body && req.body.token);
  if (token !== STEPS_TOKEN) return res.status(401).json({ error: 'Ungültiger Token.' });
  const steps = parseInt(req.query.steps || (req.body && req.body.steps), 10);
  const date = (req.query.date || (req.body && req.body.date) || new Date().toISOString().slice(0, 10)).slice(0, 10);
  if (!Number.isFinite(steps)) return res.status(400).json({ error: 'steps fehlt oder ist ungültig.' });
  const data = readJSON(STEPS_FILE, {});
  data[date] = steps;
  writeJSON(STEPS_FILE, data);
  res.json({ ok: true, date, steps });
}
app.get('/api/steps', ingestSteps);
app.post('/api/steps', ingestSteps);

// ─── HEALTHCHECK ───
app.get('/api/health', (req, res) => res.json({ ok: true, keySet: !!API_KEY }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Athletee Server läuft auf Port ' + PORT));
