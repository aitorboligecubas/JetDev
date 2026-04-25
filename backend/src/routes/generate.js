import { Router } from 'express';

import { createTask } from '../store/tasks.js';
import { runPipeline } from '../services/pipeline.js';
import { logger } from '../utils/logger.js';

const router = Router();

const MAX_PROMPT_LENGTH = 4000;

router.post('/generate', (req, res, next) => {
  try {
    const { prompt, projectId } = req.body ?? {};

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Field "prompt" is required and must be a non-empty string.',
      });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        error: `Field "prompt" must be <= ${MAX_PROMPT_LENGTH} characters.`,
      });
    }
    if (projectId !== undefined && typeof projectId !== 'string') {
      return res.status(400).json({
        error: 'Field "projectId" must be a string when provided.',
      });
    }

    const task = createTask({ prompt, projectId });

    runPipeline(task.id).catch((err) => {
      logger.error(`Unhandled pipeline error for ${task.id}:`, err);
    });

    logger.info(`POST /generate accepted task ${task.id}`);

    return res.status(202).json({
      taskId: task.id,
      status: task.status,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
