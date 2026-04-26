import { Router } from 'express';

import { getTask, listTasks, deleteTask, updateTask, addLog, failTask } from '../store/tasks.js';
import { TASK_STATES } from '../utils/states.js';
import { pushToGitHub } from '../services/github.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Run pushToGitHub in the background and persist the outcome on the task. We
 * deliberately don't await this from the request handler so the UI gets an
 * immediate `pushing` response and can poll for the final status.
 */
async function runPushInBackground(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  try {
    const gitResult = await pushToGitHub({
      projectPath: task.projectPath,
      taskId: task.id,
      prompt: task.prompt,
    });
    if (!gitResult?.repoUrl || !gitResult?.branch || !gitResult?.branchUrl) {
      throw new Error('pushToGitHub returned an invalid result');
    }
    updateTask(taskId, {
      status: TASK_STATES.ACCEPTED,
      repoUrl: gitResult.repoUrl,
      branch: gitResult.branch,
      branchUrl: gitResult.branchUrl,
      intellijUrl: gitResult.intellijUrl ?? null,
    });
    addLog(taskId, 'Accepted', { level: 'success' });
  } catch (err) {
    logger.error(`[tasks] background push failed for ${taskId}: ${err.message}`);
    failTask(taskId, err);
  }
}

router.get('/tasks', (req, res) => {
  res.json({ tasks: listTasks() });
});

router.get('/task/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = getTask(taskId);
  if (!task) {
    return res.status(404).json({ error: `Task "${taskId}" not found` });
  }
  return res.json(task);
});

router.delete('/task/:taskId', (req, res) => {
  const { taskId } = req.params;
  const existed = deleteTask(taskId);
  if (!existed) {
    return res.status(404).json({ error: `Task "${taskId}" not found` });
  }
  return res.status(204).end();
});

router.post('/task/:taskId/accept', (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = getTask(taskId);
    if (!task) {
      return res.status(404).json({ error: `Task "${taskId}" not found` });
    }

    if (task.status !== TASK_STATES.DEPLOYED) {
      return res.status(409).json({
        error: `Task "${taskId}" cannot be accepted from status "${task.status}"`,
      });
    }
    if (!task.projectPath) {
      return res.status(409).json({
        error: `Task "${taskId}" has no generated project to push`,
      });
    }

    // Flip to pushing synchronously so the polling client sees the new status
    // immediately, then run the actual git work in the background. The client
    // resumes polling and renders 'accepted' / 'error' when the push lands.
    const updated = updateTask(taskId, { status: TASK_STATES.PUSHING, error: null });
    addLog(taskId, 'Pushing to GitHub');

    setImmediate(() => {
      runPushInBackground(taskId).catch((err) => {
        logger.error(`[tasks] runPushInBackground threw for ${taskId}: ${err?.message}`);
      });
    });

    return res.status(202).json(updated);
  } catch (err) {
    return next(err);
  }
});

export default router;
