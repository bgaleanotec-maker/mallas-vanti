const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Diagnostico de archivos ──────────────────────────────────────────────
const publicDir = path.join(__dirname, 'public');
const indexPath = path.join(publicDir, 'index.html');
console.log('📁 __dirname:', __dirname);
console.log('📁 public dir:', publicDir);
console.log('📁 public exists:', fs.existsSync(publicDir));
console.log('📁 index.html exists:', fs.existsSync(indexPath));
if (fs.existsSync(publicDir)) {
  console.log('📁 public contents:', fs.readdirSync(publicDir));
}
console.log('📁 root contents:', fs.readdirSync(__dirname).filter(f => !f.startsWith('node_modules') && !f.startsWith('.')));

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
app.use(express.static(publicDir));

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
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sendFile:', err.message);
      res.status(404).send('index.html not found');
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mallas Vanti corriendo en puerto ${PORT}`);
});
