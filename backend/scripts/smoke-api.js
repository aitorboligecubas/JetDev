const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3001';

let pass = 0;
let fail = 0;

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ${GREEN}ok${RESET}   ${name}`);
    pass++;
  } catch (err) {
    console.log(`  ${RED}FAIL${RESET} ${name} :: ${err.message}`);
    fail++;
  }
}

function header(title) {
  console.log(`\n--- ${title} ---`);
}

async function fetchJson(method, path, body) {
  const init = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, init);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* leave null */
  }
  return { status: res.status, json, text };
}

(async () => {
  let created;

  header('POST /generate (happy path)');
  await test('returns 202 + taskId + status=queued', async () => {
    const r = await fetchJson('POST', '/generate', { prompt: 'Build a gym landing page', projectId: 'demo' });
    if (r.status !== 202) throw new Error(`expected 202, got ${r.status}`);
    if (!r.json?.taskId) throw new Error(`no taskId in ${r.text}`);
    if (r.json.status !== 'queued') throw new Error(`status not queued, got ${r.json.status}`);
    created = r.json;
  });
  await test('accepts request without projectId (defaults to "demo")', async () => {
    const r = await fetchJson('POST', '/generate', { prompt: 'no project id here' });
    if (r.status !== 202) throw new Error(`expected 202, got ${r.status}`);
  });

  header('POST /generate (validation)');
  await test('missing prompt -> 400', async () => {
    const r = await fetchJson('POST', '/generate', {});
    if (r.status !== 400) throw new Error(`got ${r.status}`);
  });
  await test('empty prompt -> 400', async () => {
    const r = await fetchJson('POST', '/generate', { prompt: '' });
    if (r.status !== 400) throw new Error(`got ${r.status}`);
  });
  await test('non-string projectId -> 400', async () => {
    const r = await fetchJson('POST', '/generate', { prompt: 'x', projectId: 123 });
    if (r.status !== 400) throw new Error(`got ${r.status}`);
  });
  await test('invalid JSON -> 400', async () => {
    const r = await fetchJson('POST', '/generate', '{not json');
    if (r.status !== 400) throw new Error(`got ${r.status}`);
  });
  await test('prompt too long -> 400', async () => {
    const r = await fetchJson('POST', '/generate', { prompt: 'x'.repeat(5000) });
    if (r.status !== 400) throw new Error(`got ${r.status}`);
  });

  header('GET /task/:id');
  await test('returns full task shape', async () => {
    const r = await fetchJson('GET', `/task/${created.taskId}`);
    if (r.status !== 200) throw new Error(`got ${r.status}`);
    if (r.json.id !== created.taskId) throw new Error('id mismatch');
    if (r.json.status !== 'queued') throw new Error(`status mismatch, got ${r.json.status}`);
    const required = [
      'id', 'prompt', 'projectId', 'status', 'logs',
      'previewUrl', 'repoUrl', 'branch', 'error',
      'createdAt', 'updatedAt',
    ];
    for (const f of required) {
      if (!Object.prototype.hasOwnProperty.call(r.json, f)) {
        throw new Error(`missing field ${f}`);
      }
    }
  });
  await test('missing task -> 404', async () => {
    const r = await fetchJson('GET', '/task/does-not-exist');
    if (r.status !== 404) throw new Error(`got ${r.status}`);
    if (!r.json?.error) throw new Error('no error message');
  });

  header('GET /tasks (debug)');
  await test('lists at least one task', async () => {
    const r = await fetchJson('GET', '/tasks');
    if (r.status !== 200) throw new Error(`got ${r.status}`);
    if (!Array.isArray(r.json?.tasks)) throw new Error('tasks not an array');
    if (r.json.tasks.length < 1) throw new Error(`expected >= 1, got ${r.json.tasks.length}`);
  });

  header('DELETE /task/:id');
  await test('delete returns 204', async () => {
    const r = await fetchJson('DELETE', `/task/${created.taskId}`);
    if (r.status !== 204) throw new Error(`got ${r.status}`);
  });
  await test('deleted task -> 404 on next get', async () => {
    const r = await fetchJson('GET', `/task/${created.taskId}`);
    if (r.status !== 404) throw new Error(`got ${r.status}`);
  });
  await test('deleting twice -> 404 the second time', async () => {
    const r = await fetchJson('DELETE', `/task/${created.taskId}`);
    if (r.status !== 404) throw new Error(`got ${r.status}`);
  });

  console.log(`\n${fail === 0 ? GREEN : RED}Result: ${pass} passed, ${fail} failed${RESET}\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((err) => {
  console.error('Smoke runner crashed:', err);
  process.exit(2);
});
