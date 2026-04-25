const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3001';

let pass = 0;
let fail = 0;

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function ok(msg) {
  console.log(`  ${GREEN}ok${RESET}   ${msg}`);
  pass++;
}
function bad(msg) {
  console.log(`  ${RED}FAIL${RESET} ${msg}`);
  fail++;
}
function header(t) {
  console.log(`\n--- ${t} ---`);
}

async function fetchJson(method, path, body) {
  const init = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, init);
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { status: res.status, json };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pollUntil(taskId, predicate, { timeoutMs = 15000, intervalMs = 250 } = {}) {
  const seenStatuses = new Set();
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await fetchJson('GET', `/task/${taskId}`);
    if (r.status !== 200) throw new Error(`GET /task/${taskId} returned ${r.status}`);
    seenStatuses.add(r.json.status);
    if (predicate(r.json)) {
      return { task: r.json, seenStatuses };
    }
    await sleep(intervalMs);
  }
  throw new Error(`pollUntil timed out after ${timeoutMs}ms`);
}

(async () => {
  header('happy path end-to-end');

  const t0 = Date.now();
  const create = await fetchJson('POST', '/generate', {
    prompt: 'Build a gym landing page with prices and bookings',
    projectId: 'demo',
  });
  const responseMs = Date.now() - t0;

  if (create.status !== 202) bad(`POST /generate returned ${create.status}`);
  else ok('POST /generate returns 202');

  if (responseMs >= 1500) bad(`response took ${responseMs}ms (should be < 1500ms; pipeline must run async)`);
  else ok(`response is immediate (${responseMs}ms)`);

  const taskId = create.json?.taskId;
  if (!taskId) {
    bad('no taskId returned');
    return;
  }
  ok(`taskId returned: ${taskId}`);

  if (create.json.status !== 'queued') bad(`status not queued, got ${create.json.status}`);
  else ok('status is queued');

  let intermediate;
  try {
    intermediate = await pollUntil(taskId, (t) => t.status !== 'queued', { timeoutMs: 5000 });
    ok(`task moved past queued (saw: ${[...intermediate.seenStatuses].join(', ')})`);
  } catch (err) {
    bad(`task stuck in queued: ${err.message}`);
    return;
  }

  let final;
  try {
    final = await pollUntil(taskId, (t) => t.status === 'deployed' || t.status === 'error', { timeoutMs: 15000 });
    ok(`task reached terminal state: ${final.task.status}`);
  } catch (err) {
    bad(`task never reached terminal state: ${err.message}`);
    return;
  }

  // We don't assert on "queued" via polling: by the time the first poll fires
  // the pipeline has already moved on. "queued" is verified directly from the
  // POST /generate response above.
  const seen = new Set([...intermediate.seenStatuses, ...final.seenStatuses]);
  for (const expected of ['generating', 'building', 'deploying', 'pushing', 'deployed']) {
    if (seen.has(expected)) ok(`saw status "${expected}"`);
    else bad(`never saw status "${expected}" (saw: ${[...seen].join(', ')})`);
  }

  const t = final.task;
  if (typeof t.previewUrl === 'string' && t.previewUrl.length > 0) ok('previewUrl set');
  else bad(`previewUrl missing: ${t.previewUrl}`);
  if (typeof t.repoUrl === 'string' && t.repoUrl.length > 0) ok('repoUrl set');
  else bad(`repoUrl missing: ${t.repoUrl}`);
  if (typeof t.branch === 'string' && t.branch.startsWith('ai/')) ok('branch named ai/...');
  else bad(`branch wrong: ${t.branch}`);
  if (typeof t.intellijUrl === 'string' && t.intellijUrl.startsWith('jetbrains://')) ok('intellijUrl deep link present');
  else bad(`intellijUrl missing: ${t.intellijUrl}`);
  if (t.error === null) ok('error is null on success');
  else bad(`error not null: ${t.error}`);

  for (const expectedLog of [
    'Understanding request',
    'Generating code',
    'Building project',
    'Deploying preview',
    'Pushing to GitHub',
    'Done',
  ]) {
    if (t.logs.includes(expectedLog)) ok(`log contains "${expectedLog}"`);
    else bad(`log missing "${expectedLog}"`);
  }

  header('error path end-to-end (forced generator failure)');
  const errCreate = await fetchJson('POST', '/generate', {
    prompt: '__force_generator_error__ please fail',
    projectId: 'demo',
  });
  if (errCreate.status !== 202) bad(`POST /generate returned ${errCreate.status}`);
  else ok('POST /generate still returns 202 even when pipeline will fail');

  const errFinal = await pollUntil(errCreate.json.taskId, (x) => x.status === 'error' || x.status === 'deployed', { timeoutMs: 8000 });
  if (errFinal.task.status === 'error') ok('task reaches "error" status');
  else bad(`expected error, got ${errFinal.task.status}`);
  if (typeof errFinal.task.error === 'string' && errFinal.task.error.length > 0) ok('error message populated');
  else bad('error message missing');
  if (errFinal.task.previewUrl === null && errFinal.task.repoUrl === null) ok('no urls set on failure');
  else bad('urls should not be set on failure');

  console.log(`\n${fail === 0 ? GREEN : RED}Result: ${pass} passed, ${fail} failed${RESET}\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((err) => {
  console.error('E2E runner crashed:', err);
  process.exit(2);
});
