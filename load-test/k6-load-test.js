/**
 * PanaLearn — Load Test com k6
 *
 * Instalação do k6:
 *   Windows (winget):  winget install k6
 *   Windows (choco):   choco install k6
 *   Linux/macOS:       https://k6.io/docs/getting-started/installation/
 *
 * Uso:
 *   k6 run load-test/k6-load-test.js
 *   k6 run --vus 20 --duration 60s load-test/k6-load-test.js
 *
 * Cenários disponíveis (var SCENARIO):
 *   smoke   — sanity check rápido (1 VU, 1 min)
 *   load    — carga normal       (10 VUs, 5 min)
 *   stress  — pico de stress     (50 VUs, 5 min com ramp)
 *   soak    — resistência        (10 VUs, 30 min)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ─── Configuração ─────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://oqoxhavdhrgdjvxvajze.supabase.co';
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xb3hoYXZkaHJnZGp2eHZhanplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDAyODQsImV4cCI6MjA5MDUwMDI4NH0.5GGVnENUhOw3DlgxNW5Qik5sT8Tf4Cg7AyfA-PcAWbM';

const SCENARIO = __ENV.SCENARIO || 'load';

const SCENARIOS_CONFIG = {
  smoke: {
    vus: 1,
    duration: '1m',
  },
  load: {
    stages: [
      { duration: '30s', target: 10 },
      { duration: '3m',  target: 10 },
      { duration: '30s', target: 0  },
    ],
  },
  stress: {
    stages: [
      { duration: '1m',  target: 20  },
      { duration: '2m',  target: 50  },
      { duration: '1m',  target: 100 },
      { duration: '1m',  target: 0   },
    ],
  },
  soak: {
    stages: [
      { duration: '2m',  target: 10 },
      { duration: '26m', target: 10 },
      { duration: '2m',  target: 0  },
    ],
  },
};

export const options = {
  ...(SCENARIOS_CONFIG[SCENARIO] || SCENARIOS_CONFIG.load),
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed:   ['rate<0.01'],
    error_rate:        ['rate<0.01'],
  },
};

// ─── Custom metrics ───────────────────────────────────────────────────────
const errorRate   = new Rate('error_rate');
const reqDuration = new Trend('req_duration_custom', true);
const totalErrors = new Counter('total_errors');

// ─── Helpers ──────────────────────────────────────────────────────────────
const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
};

function restGet(path) {
  const res = http.get(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  reqDuration.add(res.timings.duration);
  const ok = check(res, {
    'status 200': r => r.status === 200,
    'body not empty': r => r.body && r.body.length > 2,
  });
  if (!ok) {
    errorRate.add(1);
    totalErrors.add(1);
  } else {
    errorRate.add(0);
  }
  return res;
}

// ─── Cenários de usuário ──────────────────────────────────────────────────
export default function () {
  const roll = Math.random();

  if (roll < 0.35) {
    // Aluno listando cursos (cenário mais frequente)
    restGet('cursos?select=id,nome,categoria,descricao&order=criado_em.desc&limit=20');
    sleep(1 + Math.random() * 2);

  } else if (roll < 0.55) {
    // Aluno verificando seu progresso
    restGet('progresso_usuario?select=id,curso_id,percentual_concluido&limit=10');
    sleep(0.5 + Math.random() * 1);

  } else if (roll < 0.70) {
    // Listagem de certificados
    restGet('certificados?select=id,numero_certificado,status,data_emissao&order=data_emissao.desc&limit=15');
    sleep(0.5 + Math.random() * 1.5);

  } else if (roll < 0.82) {
    // Admin: lista de usuários
    restGet('usuarios?select=id,nome,email,tipo_usuario&limit=20');
    sleep(1 + Math.random() * 2);

  } else if (roll < 0.91) {
    // Admin: lista de empresas
    restGet('empresas?select=id,nome,plano&limit=10');
    sleep(0.5 + Math.random());

  } else {
    // Categorias e planos de conteúdo
    restGet('categorias?select=*');
    sleep(0.3 + Math.random() * 0.7);
  }
}
