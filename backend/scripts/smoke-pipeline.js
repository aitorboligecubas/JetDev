import { createTask, getTask, _resetStore } from '../src/store/tasks.js';
import { TASK_STATES } from '../src/utils/states.js';
import { runPipeline } from '../src/services/pipeline.js';

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ok   ${msg}`);
    pass++;
  } else {
    console.error(`  FAIL ${msg}`);
    fail++;
  }
}

function header(t) {
  console.log(`\n--- ${t} ---`);
}

_resetStore();

(async () => {
  header('happy path');
  const happy = createTask({ prompt: 'Build a gym landing page', projectId: 'demo' });
  assert(happy.status === TASK_STATES.QUEUED, 'starts in queued');

  await runPipeline(happy.id);

  const finalTask = getTask(happy.id);
  assert(finalTask.status === TASK_STATES.DEPLOYED, 'ends in deployed');
  assert(typeof finalTask.previewUrl === 'string' && finalTask.previewUrl.includes(happy.id), 'previewUrl set');
  assert(typeof finalTask.repoUrl === 'string' && finalTask.repoUrl.includes(happy.id), 'repoUrl set');
  assert(typeof finalTask.branch === 'string' && finalTask.branch.startsWith('ai/'), 'branch named ai/...');
  assert(typeof finalTask.intellijUrl === 'string' && finalTask.intellijUrl.startsWith('jetbrains://'), 'intellijUrl is a deep link');
  assert(finalTask.error === null, 'no error');

  const expectedLogs = [
    'Understanding request',
    'Generating code',
    'Building project',
    'Deploying preview',
    'Pushing to GitHub',
    'Done',
  ];
  for (const expected of expectedLogs) {
    assert(finalTask.logs.includes(expected), `log contains "${expected}"`);
  }

  header('error path: generator fails');
  const genFail = createTask({ prompt: 'this prompt has __force_generator_error__ inside', projectId: 'demo' });
  await runPipeline(genFail.id);
  const genFailFinal = getTask(genFail.id);
  assert(genFailFinal.status === TASK_STATES.ERROR, 'ends in error');
  assert(typeof genFailFinal.error === 'string' && genFailFinal.error.length > 0, 'error message set');
  assert(genFailFinal.previewUrl === null, 'no previewUrl on generator failure');
  assert(genFailFinal.repoUrl === null, 'no repoUrl on generator failure');
  assert(genFailFinal.logs.some((l) => l.startsWith('Error:')), 'error appears in logs');

  header('error path: github fails');
  const ghFail = createTask({ prompt: '__force_github_error__ pls', projectId: 'demo' });
  await runPipeline(ghFail.id);
  const ghFailFinal = getTask(ghFail.id);
  assert(ghFailFinal.status === TASK_STATES.ERROR, 'ends in error');
  assert(ghFailFinal.previewUrl !== null, 'previewUrl was set before github step failed');
  assert(ghFailFinal.repoUrl === null, 'repoUrl never set');
  assert(ghFailFinal.branch === null, 'branch never set');

  header('unknown task id is a no-op');
  await runPipeline('does-not-exist');
  assert(true, 'runPipeline with bogus id does not throw');

  console.log(`\n${fail === 0 ? 'ALL TESTS PASSED' : `FAILED: ${fail}`}\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((err) => {
  console.error('Smoke runner crashed:', err);
  process.exit(2);
});
