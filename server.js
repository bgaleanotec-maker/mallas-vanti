const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Cargar datos pre-procesados ──────────────────────────────────────────
let DATA = {};
try {
  DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
  const filiales = Object.keys(DATA).length;
  const municipios = Object.values(DATA).reduce((s, f) => s + Object.keys(f).length, 0);
  console.log(`✅ Datos cargados: ${filiales} filiales, ${municipios} municipios`);
} catch (err) {
  console.error('Error leyendo data.json:', err.message);
}

// ── Rutas ─────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/data', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(DATA);
});

app.get('/health', (_req, res) => {
  const filiales = Object.keys(DATA).length;
  const municipios = Object.values(DATA).reduce((s, f) => s + Object.keys(f).length, 0);
  res.json({ status: 'ok', filiales, municipios });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Mallas Vanti corriendo en puerto ${PORT}`);

  // ── Keep-alive: ping propio cada 14 min para evitar hibernación ──────────
  if (process.env.NODE_ENV === 'production') {
    const APP_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    const http = require('http');
    const https = require('https');
    setInterval(() => {
      const lib = APP_URL.startsWith('https') ? https : http;
      lib.get(`${APP_URL}/health`, (res) => {
        console.log(`♻️  Keep-alive ping → ${res.statusCode}`);
      }).on('error', (e) => {
        console.error('Keep-alive error:', e.message);
      });
    }, 14 * 60 * 1000); // cada 14 minutos
    console.log(`♻️  Keep-alive activado → ${APP_URL}/health`);
  }
});
