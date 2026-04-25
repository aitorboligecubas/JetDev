import { Router } from 'express';

import { getTask, listTasks, deleteTask } from '../store/tasks.js';

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

export default router;
