import { customAlphabet } from 'nanoid';

import { TASK_STATES, isValidState } from '../utils/states.js';
import { logger } from '../utils/logger.js';

const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const ID_LENGTH = 10;
const generateId = customAlphabet(ID_ALPHABET, ID_LENGTH);

const MAX_LOGS_PER_TASK = 200;
const MAX_EVENTS_PER_TASK = 200;
const MAX_FILES_PER_TASK = 500;

/**
 * @typedef {Object} TaskEvent
 * @property {string} message      Human-readable description of the step.
 * @property {'info'|'success'|'error'} level
 * @property {string} ts           ISO timestamp.
 * @property {number} elapsedMs    Milliseconds elapsed since task creation.
 */

/**
 * @typedef {Object} TaskFile
 * @property {string} path         Posix-style path relative to projectPath.
 * @property {'created'|'modified'} status
 */

/**
 * @typedef {Object} Task
 * @property {string}  id
 * @property {string}  prompt
 * @property {string}  projectId
 * @property {string}  status        One of TASK_STATES
 * @property {string[]} logs         Plain message log (live feed during generation).
 * @property {TaskEvent[]} events    Structured timeline used by the Logs tab.
 * @property {TaskFile[]} files      Project file tree (Files tab).
 * @property {string|null} projectPath
 * @property {string|null} previewUrl
 * @property {string|null} repoUrl
 * @property {string|null} branch
 * @property {string|null} branchUrl
 * @property {string|null} intellijUrl  Optional jetbrains:// deep link from Arnau
 * @property {string|null} name         Project display name produced by the generator
 * @property {string|null} stack        Short tech stack label (e.g. "React + Vite")
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
    events: [],
    files: [],
    projectPath: null,
    previewUrl: null,
    repoUrl: null,
    branch: null,
    branchUrl: null,
    intellijUrl: null,
    name: null,
    stack: null,
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
function snapshot(task) {
  return {
    ...task,
    logs: [...task.logs],
    events: task.events.map((e) => ({ ...e })),
    files: task.files.map((f) => ({ ...f })),
  };
}

export function createTask({ prompt, projectId } = {}) {
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('prompt is required and must be a non-empty string');
  }
  const task = buildTask({ prompt: prompt.trim(), projectId });
  tasks.set(task.id, task);
  logger.info(`Task created: ${task.id} (projectId=${task.projectId})`);
  return snapshot(task);
}

/**
 * Get a task by id. Returns a shallow copy so callers can't mutate the store.
 * @param {string} id
 * @returns {Task|null}
 */
export function getTask(id) {
  const task = tasks.get(id);
  if (!task) return null;
  return snapshot(task);
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

  const {
    id: _ignoredId,
    logs: _ignoredLogs,
    events: _ignoredEvents,
    createdAt: _ignoredCreatedAt,
    files: incomingFiles,
    ...allowed
  } = partial;

  Object.assign(task, allowed, { updatedAt: nowIso() });

  if (Array.isArray(incomingFiles)) {
    const sanitized = incomingFiles
      .filter((f) => f && typeof f.path === 'string' && f.path.length > 0)
      .map((f) => ({
        path: f.path,
        status: f.status === 'modified' ? 'modified' : 'created',
      }))
      .slice(0, MAX_FILES_PER_TASK);
    task.files = sanitized;
  }

  if (partial.status) {
    logger.info(`Task ${id} -> ${partial.status}`);
  }

  return snapshot(task);
}

function inferLevel(message) {
  const lower = message.toLowerCase();
  if (lower.startsWith('error') || lower.includes(' failed')) return 'error';
  if (
    lower.includes('ready') ||
    lower.includes('successful') ||
    lower.includes('deployed') ||
    lower.includes('accepted') ||
    lower.includes('pushed')
  ) {
    return 'success';
  }
  return 'info';
}

/**
 * Append a log entry to a task. Trims the array to MAX_LOGS_PER_TASK.
 * Also pushes a structured event (with timestamp + elapsedMs) to `events`.
 * @param {string} id
 * @param {string} message
 * @param {{ level?: 'info'|'success'|'error' }} [opts]
 * @returns {Task|null}
 */
export function addLog(id, message, opts = {}) {
  const task = tasks.get(id);
  if (!task) return null;
  if (typeof message !== 'string' || message.length === 0) {
    throw new Error('log message must be a non-empty string');
  }

  task.logs.push(message);
  if (task.logs.length > MAX_LOGS_PER_TASK) {
    task.logs.splice(0, task.logs.length - MAX_LOGS_PER_TASK);
  }

  const ts = nowIso();
  const level = opts.level || inferLevel(message);
  const elapsedMs = Math.max(0, Date.parse(ts) - Date.parse(task.createdAt));
  task.events.push({ message, level, ts, elapsedMs });
  if (task.events.length > MAX_EVENTS_PER_TASK) {
    task.events.splice(0, task.events.length - MAX_EVENTS_PER_TASK);
  }

  task.updatedAt = ts;

  logger.debug(`Task ${id} log: ${message}`);
  return snapshot(task);
}

/**
 * Mark a task as failed with an error message.
 * @param {string} id
 * @param {Error|string} err
 * @returns {Task|null}
 */
export function failTask(id, err) {
  const message = err instanceof Error ? err.message : String(err);
  addLog(id, `Error: ${message}`, { level: 'error' });
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
    .map(snapshot)
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
