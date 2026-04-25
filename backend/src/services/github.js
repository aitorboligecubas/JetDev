import { sleep } from '../utils/sleep.js';
import { logger } from '../utils/logger.js';

/**
 * Contract that Arnau's real implementation MUST respect.
 *
 *   pushToGitHub({ projectPath, taskId }) -> Promise<{ repoUrl, branch, intellijUrl? }>
 *
 *   - projectPath: absolute path on disk produced by the generator.
 *   - taskId:      backend task id (used in branch name and repo slug).
 *
 *   Returns:
 *   - repoUrl:     public URL of the GitHub repo where the project lives.
 *   - branch:      the branch holding the AI-generated code (recommended:
 *                  "ai/<taskId>").
 *   - intellijUrl: (optional) deep link of the form `jetbrains://idea/...` that
 *                  opens IntelliJ and clones the repo with one click.
 *
 *   On failure: throw new Error("descriptive message").
 *
 * NOTE: This mock will be replaced in Fase 9 by importing Arnau's real module.
 */

const USE_MOCK = process.env.USE_MOCK_GITHUB !== 'false';

const FAIL_PATH_KEYWORD = '__force_github_error__';

async function mockPushToGitHub({ projectPath, taskId }) {
  logger.info(`[github:mock] start for task ${taskId} (path=${projectPath})`);
  await sleep(700);

  if (typeof projectPath === 'string' && projectPath.includes(FAIL_PATH_KEYWORD)) {
    throw new Error('Mock github failure (forced by projectPath keyword)');
  }

  const repoUrl = `https://github.com/jetdev-demo/${taskId}`;
  const branch = `ai/${taskId}`;
  const intellijUrl = `jetbrains://idea/checkout/git?idea.required.plugins.id=Git&checkout.repo=${encodeURIComponent(repoUrl)}`;

  logger.info(`[github:mock] done for task ${taskId} (branch=${branch})`);
  return { repoUrl, branch, intellijUrl };
}

/**
 * @param {{ projectPath: string, taskId: string }} input
 * @returns {Promise<{ repoUrl: string, branch: string, intellijUrl?: string }>}
 */
export async function pushToGitHub(input) {
  if (USE_MOCK) {
    return mockPushToGitHub(input);
  }
  throw new Error(
    'Real GitHub integration not wired yet. Arnau will provide the implementation in Fase 9.',
  );
}

export default pushToGitHub;
