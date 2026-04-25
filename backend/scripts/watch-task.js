/**
 * Live watcher for a task. Useful for manual testing and the demo.
 *
 * Usage:
 *   node scripts/watch-task.js <taskId>
 *   node scripts/watch-task.js --prompt "Build a gym landing page"
 *
 * The first form watches an existing task. The second form creates one
 * via POST /generate and watches it from the start.
 */

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3001';

const STATE_ORDER = [
  'queued',
  'generating',
  'building',
  'deploying',
  'pushing',
  'deployed',
];

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function colorForStatus(status, current) {
  if (status === 'error') return COLORS.red;
  if (current === 'error') return COLORS.gray;
  const idx = STATE_ORDER.indexOf(status);
  const cur = STATE_ORDER.indexOf(current);
  if (idx === -1 || cur === -1) return COLORS.gray;
  if (idx < cur) return COLORS.green;
  if (idx === cur) return COLORS.yellow + COLORS.bold;
  return COLORS.gray;
}

function renderProgressBar(task) {
  const parts = STATE_ORDER.map((s) => `${colorForStatus(s, task.status)}${s}${COLORS.reset}`);
  const arrow = `${COLORS.dim} -> ${COLORS.reset}`;
  return parts.join(arrow);
}

async function fetchJson(method, path, body) {
  const init = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, init);
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { status: res.status, json };
}

async function createTask(prompt, projectId) {
  const r = await fetchJson('POST', '/generate', { prompt, projectId: projectId || 'demo' });
  if (r.status !== 202) {
    throw new Error(`POST /generate returned ${r.status}: ${JSON.stringify(r.json)}`);
  }
  return r.json.taskId;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clearLine() {
  if (process.stdout.isTTY) {
    process.stdout.write('\r\x1b[2K');
  }
}

function printStatic(lines) {
  console.log(lines.join('\n'));
}

async function watch(taskId) {
  console.log(`${COLORS.bold}Watching task ${taskId}${COLORS.reset} (${BASE})\n`);
  let lastLogIdx = 0;
  let lastStatus = null;
  let dotCount = 0;

  const startedAt = Date.now();
  const timeoutMs = 60000;

  while (Date.now() - startedAt < timeoutMs) {
    const r = await fetchJson('GET', `/task/${taskId}`);
    if (r.status !== 200) {
      console.error(`GET /task/${taskId} -> ${r.status}`);
      process.exit(1);
    }
    const task = r.json;

    if (task.status !== lastStatus) {
      if (lastStatus !== null) clearLine();
      lastStatus = task.status;
      dotCount = 0;
    }

    while (lastLogIdx < task.logs.length) {
      clearLine();
      console.log(`${COLORS.dim}[log]${COLORS.reset} ${task.logs[lastLogIdx]}`);
      lastLogIdx++;
    }

    clearLine();
    const dots = '.'.repeat((dotCount % 4));
    process.stdout.write(`${renderProgressBar(task)}   ${COLORS.dim}polling${dots}${COLORS.reset}`);
    dotCount++;

    if (task.status === 'deployed' || task.status === 'error') {
      clearLine();
      console.log(renderProgressBar(task));
      console.log('');
      printSummary(task);
      process.exit(task.status === 'deployed' ? 0 : 1);
    }

    await sleep(400);
  }

  clearLine();
  console.error(`Timed out waiting for task ${taskId}`);
  process.exit(2);
}

function printSummary(task) {
  console.log(`${COLORS.bold}Final state:${COLORS.reset} ${task.status === 'deployed' ? COLORS.green : COLORS.red}${task.status}${COLORS.reset}`);
  console.log(`  taskId:      ${task.id}`);
  console.log(`  prompt:      ${task.prompt}`);
  console.log(`  projectId:   ${task.projectId}`);
  console.log(`  previewUrl:  ${task.previewUrl ?? COLORS.gray + 'null' + COLORS.reset}`);
  console.log(`  repoUrl:     ${task.repoUrl ?? COLORS.gray + 'null' + COLORS.reset}`);
  console.log(`  branch:      ${task.branch ?? COLORS.gray + 'null' + COLORS.reset}`);
  console.log(`  intellijUrl: ${task.intellijUrl ?? COLORS.gray + 'null' + COLORS.reset}`);
  if (task.error) {
    console.log(`  ${COLORS.red}error: ${task.error}${COLORS.reset}`);
  }
  console.log('');
  console.log(`${COLORS.dim}logs (${task.logs.length}):${COLORS.reset}`);
  for (const l of task.logs) console.log(`  - ${l}`);
}

(async () => {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node scripts/watch-task.js <taskId>');
    console.error('       node scripts/watch-task.js --prompt "your prompt here"');
    process.exit(2);
  }

  let taskId;
  if (args[0] === '--prompt') {
    const prompt = args.slice(1).join(' ').trim();
    if (!prompt) {
      console.error('Provide a prompt after --prompt');
      process.exit(2);
    }
    console.log(`${COLORS.cyan}Creating task with prompt:${COLORS.reset} ${prompt}`);
    taskId = await createTask(prompt);
    console.log(`${COLORS.cyan}Created task:${COLORS.reset} ${taskId}\n`);
  } else {
    taskId = args[0];
  }

  await watch(taskId);
})().catch((err) => {
  console.error(`Watcher crashed: ${err.message}`);
  process.exit(2);
});
