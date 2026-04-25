import {
  createTask,
  getTask,
  updateTask,
  addLog,
  failTask,
  listTasks,
  deleteTask,
  _resetStore,
} from '../src/store/tasks.js';
import { TASK_STATES } from '../src/utils/states.js';

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    failures++;
    console.error(`  FAIL: ${message}`);
  } else {
    console.log(`  ok   ${message}`);
  }
}

function header(title) {
  console.log(`\n--- ${title} ---`);
}

_resetStore();

header('createTask');
const t1 = createTask({ prompt: 'Build a gym site', projectId: 'demo' });
assert(t1.id.startsWith('task-'), 'id starts with "task-"');
assert(t1.status === TASK_STATES.QUEUED, 'initial status is queued');
assert(t1.prompt === 'Build a gym site', 'prompt stored');
assert(t1.projectId === 'demo', 'projectId stored');
assert(Array.isArray(t1.logs) && t1.logs.length === 0, 'logs starts empty');
assert(t1.previewUrl === null && t1.repoUrl === null, 'urls null at start');
assert(t1.intellijUrl === null && t1.branch === null && t1.error === null, 'optional fields null at start');
assert(typeof t1.createdAt === 'string', 'createdAt is set');

header('createTask defaults projectId to "demo"');
const t2 = createTask({ prompt: 'no projectId here' });
assert(t2.projectId === 'demo', 'projectId default works');

header('createTask validation');
try {
  createTask({ prompt: '' });
  assert(false, 'empty prompt should throw');
} catch {
  assert(true, 'empty prompt throws');
}
try {
  createTask({});
  assert(false, 'missing prompt should throw');
} catch {
  assert(true, 'missing prompt throws');
}

header('getTask');
const fetched = getTask(t1.id);
assert(fetched && fetched.id === t1.id, 'getTask returns the task');
assert(getTask('does-not-exist') === null, 'getTask returns null when missing');

header('mutating returned copy does not affect store');
fetched.logs.push('hacked');
const refetched = getTask(t1.id);
assert(refetched.logs.length === 0, 'store is isolated from external mutation');

header('updateTask + status validation');
const updated = updateTask(t1.id, { status: TASK_STATES.GENERATING });
assert(updated.status === TASK_STATES.GENERATING, 'status updated to generating');
assert(updated.updatedAt !== t1.updatedAt, 'updatedAt advanced');
try {
  updateTask(t1.id, { status: 'nope' });
  assert(false, 'invalid status should throw');
} catch {
  assert(true, 'invalid status throws');
}
assert(updateTask('missing', { status: TASK_STATES.GENERATING }) === null, 'updateTask null when missing');

header('updateTask cannot overwrite id, logs, createdAt');
updateTask(t1.id, { id: 'forged', logs: ['forged'], createdAt: '1999-01-01T00:00:00Z', previewUrl: 'https://x' });
const protectedTask = getTask(t1.id);
assert(protectedTask.id === t1.id, 'id is protected');
assert(protectedTask.logs.length === 0, 'logs are protected');
assert(protectedTask.createdAt === t1.createdAt, 'createdAt is protected');
assert(protectedTask.previewUrl === 'https://x', 'other fields update normally');

header('addLog');
addLog(t1.id, 'Understanding request');
addLog(t1.id, 'Generating code');
const withLogs = getTask(t1.id);
assert(withLogs.logs.length === 2, 'logs appended');
assert(withLogs.logs[0] === 'Understanding request', 'first log correct');
try {
  addLog(t1.id, '');
  assert(false, 'empty log should throw');
} catch {
  assert(true, 'empty log throws');
}

header('failTask');
const failed = failTask(t1.id, new Error('boom'));
assert(failed.status === TASK_STATES.ERROR, 'status set to error');
assert(failed.error === 'boom', 'error message stored');
assert(failed.logs.at(-1) === 'Error: boom', 'error logged');

header('listTasks');
const list = listTasks();
assert(list.length === 2, 'listTasks returns all tasks');
assert(list[0].createdAt >= list[1].createdAt, 'list sorted desc by createdAt');

header('deleteTask');
assert(deleteTask(t1.id) === true, 'delete returns true');
assert(deleteTask(t1.id) === false, 'delete returns false the second time');
assert(getTask(t1.id) === null, 'task is gone');

console.log(`\n${failures === 0 ? 'ALL TESTS PASSED' : `FAILED: ${failures}`}\n`);
process.exit(failures === 0 ? 0 : 1);
