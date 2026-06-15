// HybridAthlete Server — Coach-Proxy + Datenspeicher
// Läuft auf Render.com. Der API-Key wird sicher als Umgebungsvariable gespeichert.

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

const API_KEY = process.env.ANTHROPIC_API_KEY;
const DATA_FILE = path.join(__dirname, 'userdata.json');

// ─── COACH ENDPOINT (Proxy zur Anthropic API) ───
app.post('/api/coach', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: 'API-Key nicht konfiguriert. Bitte ANTHROPIC_API_KEY in Render setzen.' });
  }
  try {
    const { system, messages, model } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: system || '',
        messages: messages || []
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Coach-Verbindung fehlgeschlagen: ' + err.message });
  }
});

// ─── DATEN SPEICHERN ───
app.post('/api/save', (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DATEN LADEN ───
app.get('/api/load', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      res.json(data);
    } else {
      res.json({});
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('HybridAthlete Server läuft auf Port ' + PORT));
