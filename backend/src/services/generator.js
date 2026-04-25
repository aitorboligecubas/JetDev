import { sleep } from '../utils/sleep.js';
import { logger } from '../utils/logger.js';

/**
 * Contract that Toni's real implementation MUST respect.
 *
 *   generateProject({ prompt, taskId }) -> Promise<{ projectPath, previewUrl, files? }>
 *
 *   - prompt:      string. The natural language input from the mobile app.
 *   - taskId:      string. Unique id created by the backend, used for naming the
 *                  output directory and any deploy that needs a unique slug.
 *
 *   Returns:
 *   - projectPath: absolute path on disk to the generated project. Arnau will
 *                  push this folder to GitHub.
 *   - previewUrl:  publicly accessible URL of the deployed preview.
 *   - files:       (optional) array of file paths that were created/modified.
 *
 *   On failure: throw new Error("descriptive message").
 *
 * NOTE: This mock will be replaced in Fase 9 by importing Toni's real module.
 */

const USE_MOCK = process.env.USE_MOCK_GENERATOR !== 'false';

const FAIL_GENERATOR_KEYWORD = '__force_generator_error__';
const FAIL_GITHUB_KEYWORD = '__force_github_error__';

async function mockGenerateProject({ prompt, taskId }) {
  logger.info(`[generator:mock] start for task ${taskId}`);
  await sleep(800);

  if (typeof prompt === 'string' && prompt.includes(FAIL_GENERATOR_KEYWORD)) {
    throw new Error('Mock generator failure (forced by prompt keyword)');
  }

  const githubFailureMarker =
    typeof prompt === 'string' && prompt.includes(FAIL_GITHUB_KEYWORD)
      ? `/${FAIL_GITHUB_KEYWORD}`
      : '';

  await sleep(800);
  logger.info(`[generator:mock] done for task ${taskId}`);

  return {
    projectPath: `/generated/${taskId}${githubFailureMarker}`,
    previewUrl: `https://preview.example.com/${taskId}`,
    files: [
      'index.html',
      'styles/main.css',
      'scripts/app.js',
    ],
  };
}

/**
 * @param {{ prompt: string, taskId: string }} input
 * @returns {Promise<{ projectPath: string, previewUrl: string, files?: string[] }>}
 */
export async function generateProject(input) {
  if (USE_MOCK) {
    return mockGenerateProject(input);
  }
  throw new Error(
    'Real generator not wired yet. Toni will provide the implementation in Fase 9.',
  );
}

export default generateProject;
