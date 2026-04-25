import { Router } from 'express';

import { getTask, listTasks, deleteTask, updateTask, addLog, failTask } from '../store/tasks.js';
import { TASK_STATES } from '../utils/states.js';
import { pushToGitHub } from '../services/github.js';

const router = Router();

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

router.post('/task/:taskId/accept', async (req, res, next) => {
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

    updateTask(taskId, { status: TASK_STATES.PUSHING, error: null });
    addLog(taskId, 'Pushing to GitHub');

    try {
      const gitResult = await pushToGitHub({
        projectPath: task.projectPath,
        taskId: task.id,
        prompt: task.prompt,
      });
      if (!gitResult?.repoUrl || !gitResult?.branch || !gitResult?.branchUrl) {
        throw new Error('pushToGitHub returned an invalid result');
      }

      const updated = updateTask(taskId, {
        status: TASK_STATES.ACCEPTED,
        repoUrl: gitResult.repoUrl,
        branch: gitResult.branch,
        branchUrl: gitResult.branchUrl,
      });
      addLog(taskId, 'Accepted');
      return res.json(updated);
    } catch (err) {
      const failed = failTask(taskId, err);
      return res.status(500).json(failed);
    }
  } catch (err) {
    return next(err);
  }
});

export default router;
