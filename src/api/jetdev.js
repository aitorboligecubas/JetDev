import { API_BASE } from './config';

const TERMINAL_STATUSES = new Set(['deployed', 'accepted', 'error']);

/**
 * @param {string} prompt
 * @param {string} [projectId]
 * @returns {Promise<{ taskId: string, status: string }>}
 */
export async function createTask(prompt, projectId) {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...(projectId ? { projectId } : {}) }),
  });

  if (!res.ok) {
    let message = `POST /generate failed (${res.status})`;
    try {
      const err = await res.json();
      if (err?.error) message = err.error;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

/**
 * @param {string} taskId
 * @returns {Promise<object>} the task object as returned by the backend
 */
export async function getTask(taskId) {
  const res = await fetch(`${API_BASE}/task/${encodeURIComponent(taskId)}`);
  if (!res.ok) {
    throw new Error(`GET /task/${taskId} failed (${res.status})`);
  }
  return res.json();
}

/**
 * @param {string} taskId
 * @returns {Promise<object>} the task in `accepted` status with repoUrl/branchUrl/intellijUrl
 */
export async function acceptTask(taskId) {
  const res = await fetch(`${API_BASE}/task/${encodeURIComponent(taskId)}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });

  if (!res.ok) {
    let message = `POST /task/${taskId}/accept failed (${res.status})`;
    try {
      const err = await res.json();
      if (err?.error) message = err.error;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

/**
 * Start polling a task until it reaches a terminal status.
 *
 * @param {string} taskId
 * @param {{
 *   onUpdate?: (task: object) => void,
 *   onError?: (err: Error) => void,
 *   intervalMs?: number,
 *   timeoutMs?: number,
 * }} opts
 * @returns {() => void} cancel function
 */
export function pollTask(taskId, opts = {}) {
  const {
    onUpdate,
    onError,
    intervalMs = 500,
    timeoutMs = 5 * 60 * 1000,
  } = opts;

  let cancelled = false;
  let timer = null;
  const start = Date.now();
  let lastStatus = null;
  let lastLogsLength = -1;

  const tick = async () => {
    if (cancelled) return;

    try {
      const task = await getTask(taskId);

      const statusChanged = task.status !== lastStatus;
      const logsChanged = Array.isArray(task.logs) && task.logs.length !== lastLogsLength;
      if (statusChanged || logsChanged) {
        lastStatus = task.status;
        lastLogsLength = Array.isArray(task.logs) ? task.logs.length : -1;
        onUpdate?.(task);
      }

      if (TERMINAL_STATUSES.has(task.status)) {
        return;
      }
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    if (Date.now() - start > timeoutMs) {
      onError?.(new Error(`Polling timed out after ${timeoutMs}ms`));
      return;
    }

    timer = setTimeout(tick, intervalMs);
  };

  tick();

  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}
