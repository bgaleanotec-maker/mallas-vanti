const XLSX = require('xlsx');
const path = require('path');
const fs   = require('fs');

const wb = XLSX.readFile(path.join(__dirname, 'Mallas_verificadas.xlsx'));
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

const result = {};
const seen = new Set();

rows.forEach(row => {
  const filial   = String(row['descrip_soc_estandar'] || '').trim();
  const municipio = String(row['descrip_poblac_suministro'] || '').trim().toUpperCase();
  const barrio    = String(row['barrio'] || '').trim().toUpperCase();
  const malla     = parseInt(row['malla'], 10);

  if (!filial || !municipio || isNaN(malla)) return;

  // Deduplicar barrio+malla dentro de cada filial/municipio
  const key = `${filial}|${municipio}|${barrio}|${malla}`;
  if (seen.has(key)) return;
  seen.add(key);

  if (!result[filial]) result[filial] = {};
  if (!result[filial][municipio]) result[filial][municipio] = [];
  result[filial][municipio].push({ barrio, malla });
});

// Ordenar: filiales -> municipios -> barrios
const sorted = {};
Object.keys(result).sort().forEach(filial => {
  sorted[filial] = {};
  Object.keys(result[filial]).sort().forEach(mun => {
    sorted[filial][mun] = result[filial][mun].sort((a, b) => a.barrio.localeCompare(b.barrio));
  });
});

fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(sorted, null, 2), 'utf8');

// Stats
const filiales = Object.keys(sorted).length;
const municipios = Object.values(sorted).reduce((s, f) => s + Object.keys(f).length, 0);
const barrios = Object.values(sorted).reduce((s, f) =>
  s + Object.values(f).reduce((s2, arr) => s2 + arr.length, 0), 0);
const mallas = new Set(
  Object.values(sorted).flatMap(f => Object.values(f).flatMap(arr => arr.map(e => e.malla)))
).size;

console.log(`✅ data.json generado: ${filiales} filiales, ${municipios} municipios, ${barrios} registros, ${mallas} mallas unicas`);
