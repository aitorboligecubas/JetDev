import { TASK_STATES } from '../utils/states.js';
import { logger } from '../utils/logger.js';
import { sleep } from '../utils/sleep.js';
import {
  getTask,
  updateTask,
  addLog,
  failTask,
} from '../store/tasks.js';
import { generateProject } from './generator.js';

// Small visual delay between transient states so the polling UI can render
// "building" and "deploying" before they flip to the next one. Configurable
// via env, set to 0 to disable.
const TRANSIENT_DELAY_MS = Number.parseInt(process.env.PIPELINE_TRANSIENT_DELAY_MS, 10) || 600;

/**
 * Run the end-to-end pipeline for a task. This is fire-and-forget: callers
 * should NOT await it from request handlers. Errors are caught internally and
 * persisted into the task as `error` + status `error`.
 *
 * State machine:
 *   queued -> generating -> building -> deploying -> deployed
 *                                                  \-> error (any step)
 *
 * @param {string} taskId
 * @returns {Promise<void>}
 */
export async function runPipeline(taskId) {
  const initial = getTask(taskId);
  if (!initial) {
    logger.warn(`runPipeline called with unknown taskId=${taskId}`);
    return;
  }

  logger.info(`Pipeline started for task ${taskId}`);

  try {
    updateTask(taskId, { status: TASK_STATES.GENERATING });
    addLog(taskId, 'Understanding request');
    addLog(taskId, 'Refining prompt');

    const generation = await generateProject({
      prompt: initial.prompt,
      taskId,
    });
    if (!generation || !generation.projectPath || !generation.previewUrl) {
      throw new Error('generateProject returned an invalid result');
    }

    updateTask(taskId, { status: TASK_STATES.BUILDING });
    addLog(taskId, 'Building project (npm install + vite build)');
    await sleep(TRANSIENT_DELAY_MS);

    updateTask(taskId, { status: TASK_STATES.DEPLOYING });
    addLog(taskId, 'Deploying preview');

    const files = Array.isArray(generation.files) ? generation.files : [];
    const fileSummary = summarizeFiles(files);

    updateTask(taskId, {
      previewUrl: generation.previewUrl,
      projectPath: generation.projectPath,
      name: generation.name ?? null,
      stack: generation.stack ?? null,
      files,
    });

    if (fileSummary) {
      addLog(taskId, fileSummary);
    }

    await sleep(TRANSIENT_DELAY_MS);
    updateTask(taskId, { status: TASK_STATES.DEPLOYED });
    addLog(taskId, `Preview ready at ${generation.previewUrl}`);

    logger.info(`Pipeline finished for task ${taskId}`);
  } catch (err) {
    logger.error(`Pipeline failed for task ${taskId}:`, err.message);
    failTask(taskId, err);
  }
}

function summarizeFiles(files) {
  if (!Array.isArray(files) || files.length === 0) return null;
  const modified = files.filter((f) => f.status === 'modified').length;
  const created = files.length - modified;
  if (modified === 0) return `Captured ${created} files in the project tree`;
  return `Captured ${files.length} files (${modified} modified, ${created} from scaffolding)`;
}

export default runPipeline;
