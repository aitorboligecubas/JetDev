import { createTask, getTask, _resetStore } from '../src/store/tasks.js';
import { TASK_STATES } from '../src/utils/states.js';
import { runPipeline } from '../src/services/pipeline.js';
import { pushToGitHub } from '../src/services/github.js';

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
  header('happy path: pipeline ends in deployed (no auto push)');
  const happy = createTask({ prompt: 'Build a gym landing page', projectId: 'demo' });
  assert(happy.status === TASK_STATES.QUEUED, 'starts in queued');

  await runPipeline(happy.id);

  const finalTask = getTask(happy.id);
  assert(finalTask.status === TASK_STATES.DEPLOYED, 'ends in deployed');
  assert(typeof finalTask.previewUrl === 'string' && finalTask.previewUrl.includes(happy.id), 'previewUrl set');
  assert(typeof finalTask.projectPath === 'string', 'projectPath persisted on the task');
  assert(finalTask.repoUrl === null, 'repoUrl not set yet (push happens on accept)');
  assert(finalTask.branch === null, 'branch not set yet');
  assert(finalTask.error === null, 'no error');

  const expectedLogs = [
    'Understanding request',
    'Generating code',
    'Building project',
    'Deploying preview',
    'Ready for acceptance',
  ];
  for (const expected of expectedLogs) {
    assert(finalTask.logs.includes(expected), `log contains "${expected}"`);
  }

  header('happy path: accept step pushes to GitHub (mock)');
  const gitResult = await pushToGitHub({
    projectPath: finalTask.projectPath,
    taskId: happy.id,
    prompt: happy.prompt,
  });
  assert(typeof gitResult.repoUrl === 'string' && gitResult.repoUrl.length > 0, 'repoUrl returned');
  assert(typeof gitResult.branch === 'string' && gitResult.branch === 'main', 'branch is "main"');
  assert(typeof gitResult.branchUrl === 'string' && gitResult.branchUrl.includes(gitResult.repoUrl), 'branchUrl points at repo');
  assert(typeof gitResult.intellijUrl === 'string' && gitResult.intellijUrl.startsWith('jetbrains://'), 'intellijUrl is a deep link');

  header('error path: generator fails');
  const genFail = createTask({ prompt: 'this prompt has __force_generator_error__ inside', projectId: 'demo' });
  await runPipeline(genFail.id);
  const genFailFinal = getTask(genFail.id);
  assert(genFailFinal.status === TASK_STATES.ERROR, 'ends in error');
  assert(typeof genFailFinal.error === 'string' && genFailFinal.error.length > 0, 'error message set');
  assert(genFailFinal.previewUrl === null, 'no previewUrl on generator failure');
  assert(genFailFinal.repoUrl === null, 'no repoUrl on generator failure');
  assert(genFailFinal.logs.some((l) => l.startsWith('Error:')), 'error appears in logs');

  header('error path: github fails (forced via mock keyword on accept)');
  let pushError = null;
  try {
    await pushToGitHub({
      projectPath: '/generated/forced/__force_github_error__',
      taskId: 'task-forced-error',
      prompt: 'force github failure',
    });
  } catch (err) {
    pushError = err;
  }
  assert(pushError instanceof Error, 'pushToGitHub throws when projectPath has the failure keyword');
  assert(/forced by projectPath keyword/i.test(pushError?.message ?? ''), 'error message identifies the cause');

  header('unknown task id is a no-op');
  await runPipeline('does-not-exist');
  assert(true, 'runPipeline with bogus id does not throw');

  console.log(`\n${fail === 0 ? 'ALL TESTS PASSED' : `FAILED: ${fail}`}\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((err) => {
  console.error('Smoke runner crashed:', err);
  process.exit(2);
});
