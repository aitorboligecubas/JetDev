import { customAlphabet } from 'nanoid';

import { TASK_STATES, isValidState } from '../utils/states.js';
import { logger } from '../utils/logger.js';

const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const ID_LENGTH = 10;
const generateId = customAlphabet(ID_ALPHABET, ID_LENGTH);

const MAX_LOGS_PER_TASK = 200;

/**
 * @typedef {Object} Task
 * @property {string}  id
 * @property {string}  prompt
 * @property {string}  projectId
 * @property {string}  status        One of TASK_STATES
 * @property {string[]} logs
 * @property {string|null} projectPath
 * @property {string|null} previewUrl
 * @property {string|null} repoUrl
 * @property {string|null} branch
 * @property {string|null} branchUrl
 * @property {string|null} intellijUrl  Optional jetbrains:// deep link from Arnau
 * @property {string|null} error
 * @property {string}  createdAt     ISO timestamp
 * @property {string}  updatedAt     ISO timestamp
 */

const tasks = new Map();

function nowIso() {
  return new Date().toISOString();
}

function buildTask({ prompt, projectId }) {
  const id = `task-${generateId()}`;
  const createdAt = nowIso();
  return {
    id,
    prompt,
    projectId: projectId || 'demo',
    status: TASK_STATES.QUEUED,
    logs: [],
    projectPath: null,
    previewUrl: null,
    repoUrl: null,
    branch: null,
    branchUrl: null,
    intellijUrl: null,
    error: null,
    createdAt,
    updatedAt: createdAt,
  };
}

/**
 * Create and store a new task in `queued` state.
 * @param {{ prompt: string, projectId?: string }} input
 * @returns {Task} the newly created task (a copy is safe to mutate by callers)
 */
export function createTask({ prompt, projectId } = {}) {
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('prompt is required and must be a non-empty string');
  }
  const task = buildTask({ prompt: prompt.trim(), projectId });
  tasks.set(task.id, task);
  logger.info(`Task created: ${task.id} (projectId=${task.projectId})`);
  return { ...task, logs: [...task.logs] };
}

/**
 * Get a task by id. Returns a shallow copy so callers can't mutate the store.
 * @param {string} id
 * @returns {Task|null}
 */
export function getTask(id) {
  const task = tasks.get(id);
  if (!task) return null;
  return { ...task, logs: [...task.logs] };
}

/**
 * Update a task with a partial object. Validates `status` if provided.
 * Returns the updated copy or null if the task does not exist.
 * @param {string} id
 * @param {Partial<Task>} partial
 * @returns {Task|null}
 */
export function updateTask(id, partial = {}) {
  const task = tasks.get(id);
  if (!task) return null;

  if (partial.status !== undefined && !isValidState(partial.status)) {
    throw new Error(`Invalid status: ${partial.status}`);
  }

  const { id: _ignoredId, logs: _ignoredLogs, createdAt: _ignoredCreatedAt, ...allowed } = partial;

  Object.assign(task, allowed, { updatedAt: nowIso() });

  if (partial.status) {
    logger.info(`Task ${id} -> ${partial.status}`);
  }

  return { ...task, logs: [...task.logs] };
}

/**
 * Append a log entry to a task. Trims the array to MAX_LOGS_PER_TASK.
 * @param {string} id
 * @param {string} message
 * @returns {Task|null}
 */
export function addLog(id, message) {
  const task = tasks.get(id);
  if (!task) return null;
  if (typeof message !== 'string' || message.length === 0) {
    throw new Error('log message must be a non-empty string');
  }

  task.logs.push(message);
  if (task.logs.length > MAX_LOGS_PER_TASK) {
    task.logs.splice(0, task.logs.length - MAX_LOGS_PER_TASK);
  }
  task.updatedAt = nowIso();

  logger.debug(`Task ${id} log: ${message}`);
  return { ...task, logs: [...task.logs] };
}

/**
 * Mark a task as failed with an error message.
 * @param {string} id
 * @param {Error|string} err
 * @returns {Task|null}
 */
export function failTask(id, err) {
  const message = err instanceof Error ? err.message : String(err);
  addLog(id, `Error: ${message}`);
  return updateTask(id, {
    status: TASK_STATES.ERROR,
    error: message,
  });
}

/**
 * List all tasks (debug helper). Sorted by createdAt desc.
 * @returns {Task[]}
 */
export function listTasks() {
  return Array.from(tasks.values())
    .map((t) => ({ ...t, logs: [...t.logs] }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * Remove a task. Useful for tests and the optional DELETE endpoint.
 * @param {string} id
 * @returns {boolean} true if it existed
 */
export function deleteTask(id) {
  return tasks.delete(id);
}

/**
 * Wipe the whole store. Tests only.
 */
export function _resetStore() {
  tasks.clear();
}
