#!/usr/bin/env node
/**
 * PanaLearn — Load Test (Node.js, sem dependências extras)
 * Requer Node 18+ (fetch nativo)
 *
 * Uso:
 *   node load-test/node-load-test.js
 *   node load-test/node-load-test.js --vus 20 --duration 60
 *
 * Flags:
 *   --vus        Usuários virtuais simultâneos  (padrão: 10)
 *   --duration   Duração do teste em segundos   (padrão: 30)
 *   --rampup     Segundos de ramp-up             (padrão: 5)
 */

const SUPABASE_URL = 'https://oqoxhavdhrgdjvxvajze.supabase.co';
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xb3hoYXZkaHJnZGp2eHZhanplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDAyODQsImV4cCI6MjA5MDUwMDI4NH0.5GGVnENUhOw3DlgxNW5Qik5sT8Tf4Cg7AyfA-PcAWbM';

// ─── CLI args ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 ? Number(args[i + 1]) : def;
};
const VUS      = getArg('--vus', 10);
const DURATION = getArg('--duration', 30) * 1000;  // ms
const RAMPUP   = getArg('--rampup', 5)  * 1000;    // ms

// ─── Endpoints under test ─────────────────────────────────────────────────
const HEADERS = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

const SCENARIOS = [
  { name: 'GET /cursos',        url: `${SUPABASE_URL}/rest/v1/cursos?select=id,nome,categoria&limit=20`,         weight: 40 },
  { name: 'GET /categorias',    url: `${SUPABASE_URL}/rest/v1/categorias?select=*`,                              weight: 20 },
  { name: 'GET /certificados',  url: `${SUPABASE_URL}/rest/v1/certificados?select=id,numero_certificado&limit=20`, weight: 15 },
  { name: 'GET /usuarios',      url: `${SUPABASE_URL}/rest/v1/usuarios?select=id,nome,tipo_usuario&limit=20`,     weight: 15 },
  { name: 'GET /empresas',      url: `${SUPABASE_URL}/rest/v1/empresas?select=id,nome&limit=10`,                  weight: 10 },
];

// Build weighted pick list
const PICK_LIST = SCENARIOS.flatMap(s => Array(s.weight).fill(s));

// ─── Metrics store ────────────────────────────────────────────────────────
const metrics = {
  requests: 0,
  errors: 0,
  latencies: [],           // ms values
  perEndpoint: Object.fromEntries(SCENARIOS.map(s => [s.name, { count: 0, errors: 0, latencies: [] }])),
};

// ─── Worker logic ─────────────────────────────────────────────────────────
async function runVU(stopAt) {
  while (Date.now() < stopAt) {
    const scenario = PICK_LIST[Math.floor(Math.random() * PICK_LIST.length)];
    const t0 = Date.now();
    let ok = true;
    try {
      const res = await fetch(scenario.url, { headers: HEADERS, signal: AbortSignal.timeout(10_000) });
      ok = res.ok;
      if (!ok) metrics.errors++;
    } catch {
      ok = false;
      metrics.errors++;
    }
    const lat = Date.now() - t0;
    metrics.requests++;
    metrics.latencies.push(lat);
    metrics.perEndpoint[scenario.name].count++;
    metrics.perEndpoint[scenario.name].latencies.push(lat);
    if (!ok) metrics.perEndpoint[scenario.name].errors++;

    // small jitter so VUs don't all fire at the same millisecond
    await sleep(20 + Math.random() * 30);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

function formatMs(n) { return `${n.toFixed(0)} ms`; }

function printReport(elapsedSec) {
  const sorted = [...metrics.latencies].sort((a, b) => a - b);
  const rps    = (metrics.requests / elapsedSec).toFixed(2);
  const errPct = metrics.requests ? ((metrics.errors / metrics.requests) * 100).toFixed(2) : '0.00';

  console.log('\n' + '═'.repeat(60));
  console.log('  PanaLearn Load Test — Resultado Final');
  console.log('═'.repeat(60));
  console.log(`  VUs:              ${VUS}`);
  console.log(`  Duração:          ${(DURATION / 1000).toFixed(0)}s`);
  console.log(`  Total requests:   ${metrics.requests}`);
  console.log(`  RPS:              ${rps}`);
  console.log(`  Errors:           ${metrics.errors} (${errPct}%)`);
  console.log('─'.repeat(60));
  console.log('  Latências globais:');
  console.log(`    min   ${formatMs(sorted[0] ?? 0)}`);
  console.log(`    p50   ${formatMs(percentile(sorted, 50))}`);
  console.log(`    p90   ${formatMs(percentile(sorted, 90))}`);
  console.log(`    p95   ${formatMs(percentile(sorted, 95))}`);
  console.log(`    p99   ${formatMs(percentile(sorted, 99))}`);
  console.log(`    max   ${formatMs(sorted[sorted.length - 1] ?? 0)}`);
  console.log('─'.repeat(60));
  console.log('  Por endpoint:');
  for (const [name, data] of Object.entries(metrics.perEndpoint)) {
    if (!data.count) continue;
    const sl = [...data.latencies].sort((a, b) => a - b);
    const ep50 = percentile(sl, 50);
    const ep99 = percentile(sl, 99);
    const epErr = data.errors ? ` ⚠ ${data.errors} erros` : '';
    console.log(`    ${name.padEnd(24)} n=${String(data.count).padStart(5)}  p50=${formatMs(ep50)}  p99=${formatMs(ep99)}${epErr}`);
  }
  console.log('═'.repeat(60));

  // Thresholds check
  const p95 = percentile(sorted, 95);
  const errorRate = metrics.requests ? (metrics.errors / metrics.requests) : 0;
  console.log('\n  Thresholds:');
  const checks = [
    { label: 'p95 < 800 ms',      pass: p95 < 800 },
    { label: 'error rate < 1%',   pass: errorRate < 0.01 },
    { label: 'RPS > 5',           pass: parseFloat(rps) > 5 },
  ];
  for (const c of checks) {
    console.log(`    ${c.pass ? '✓' : '✗'} ${c.label}`);
  }
  console.log('');
}

// ─── Ramp-up + main ──────────────────────────────────────────────────────
async function main() {
  console.log(`\n  PanaLearn Load Test`);
  console.log(`  VUs: ${VUS}  |  Duração: ${DURATION / 1000}s  |  Ramp-up: ${RAMPUP / 1000}s`);
  console.log(`  Endpoint base: ${SUPABASE_URL}\n`);

  const startAt = Date.now();
  const stopAt  = startAt + RAMPUP + DURATION;

  const vus = [];
  for (let i = 0; i < VUS; i++) {
    // stagger VU start across the ramp-up window
    const delay = (RAMPUP / VUS) * i;
    vus.push(sleep(delay).then(() => runVU(stopAt)));
    process.stdout.write(`\r  Iniciando VUs... ${i + 1}/${VUS}`);
  }
  console.log('\n  Teste em andamento...');

  // Live progress every 5 s
  const progressInterval = setInterval(() => {
    const elapsed = ((Date.now() - startAt - RAMPUP) / 1000).toFixed(0);
    const remaining = Math.max(0, ((stopAt - Date.now()) / 1000).toFixed(0));
    process.stdout.write(`\r  req=${metrics.requests}  erros=${metrics.errors}  elapsed=${elapsed}s  restam=${remaining}s   `);
  }, 1000);

  await Promise.all(vus);
  clearInterval(progressInterval);

  const elapsedSec = (Date.now() - startAt) / 1000;
  printReport(elapsedSec);
}

main().catch(err => { console.error(err); process.exit(1); });
