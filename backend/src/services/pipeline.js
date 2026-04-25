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
    addLog(taskId, 'Generating code');

    const generation = await generateProject({
      prompt: initial.prompt,
      taskId,
      onFeedEvent: (evt) => {
        if (!evt || typeof evt !== 'object') return;
        const key = typeof evt.key === 'string' ? evt.key : 'step';
        const phase = typeof evt.phase === 'string' ? evt.phase : 'update';
        const label = typeof evt.label === 'string' ? evt.label : '';
        const value = typeof evt.value === 'string' ? evt.value : '';
        addLog(taskId, `FEED|${key}|${phase}|${label}|${value}`);
      },
      onLog: (msg) => {
        if (typeof msg === 'string') addLog(taskId, msg);
      },
    });
    if (!generation || !generation.projectPath || !generation.previewUrl) {
      throw new Error('generateProject returned an invalid result');
    }

    updateTask(taskId, { status: TASK_STATES.BUILDING });
    addLog(taskId, 'Building project');
    await sleep(TRANSIENT_DELAY_MS);

    updateTask(taskId, { status: TASK_STATES.DEPLOYING });
    addLog(taskId, 'Deploying preview');
    updateTask(taskId, {
      previewUrl: generation.previewUrl,
      projectPath: generation.projectPath,
    });
    await sleep(TRANSIENT_DELAY_MS);
    updateTask(taskId, { status: TASK_STATES.DEPLOYED });
    addLog(taskId, 'Ready for acceptance');

    logger.info(`Pipeline finished for task ${taskId}`);
  } catch (err) {
    logger.error(`Pipeline failed for task ${taskId}:`, err.message);
    failTask(taskId, err);
  }
}

export default runPipeline;
