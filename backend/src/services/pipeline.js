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
import { pushToGitHub } from './github.js';

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
 *   queued -> generating -> building -> deploying -> pushing -> deployed
 *                                                                 \-> error (any step)
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
    });
    if (!generation || !generation.projectPath || !generation.previewUrl) {
      throw new Error('generateProject returned an invalid result');
    }

    updateTask(taskId, { status: TASK_STATES.BUILDING });
    addLog(taskId, 'Building project');
    await sleep(TRANSIENT_DELAY_MS);

    updateTask(taskId, { status: TASK_STATES.DEPLOYING });
    addLog(taskId, 'Deploying preview');
    updateTask(taskId, { previewUrl: generation.previewUrl });
    await sleep(TRANSIENT_DELAY_MS);

    updateTask(taskId, { status: TASK_STATES.PUSHING });
    addLog(taskId, 'Pushing to GitHub');

    const gitResult = await pushToGitHub({
      projectPath: generation.projectPath,
      taskId,
    });
    if (!gitResult || !gitResult.repoUrl || !gitResult.branch) {
      throw new Error('pushToGitHub returned an invalid result');
    }

    updateTask(taskId, {
      status: TASK_STATES.DEPLOYED,
      repoUrl: gitResult.repoUrl,
      branch: gitResult.branch,
      intellijUrl: gitResult.intellijUrl ?? null,
    });
    addLog(taskId, 'Done');

    logger.info(`Pipeline finished for task ${taskId}`);
  } catch (err) {
    logger.error(`Pipeline failed for task ${taskId}:`, err.message);
    failTask(taskId, err);
  }
}

export default runPipeline;
