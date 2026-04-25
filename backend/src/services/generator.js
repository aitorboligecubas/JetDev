import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
 * Toggle the real implementation with USE_MOCK_GENERATOR=false in backend/.env.
 */

const USE_MOCK = process.env.USE_MOCK_GENERATOR !== 'false';

const FAIL_GENERATOR_KEYWORD = '__force_generator_error__';
const FAIL_GITHUB_KEYWORD = '__force_github_error__';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REAL_GENERATOR_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'generator',
  'src',
  'index.js',
);

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

let _realModuleCache = null;

async function loadRealGeneratorModule() {
  if (_realModuleCache) return _realModuleCache;

  let mod;
  try {
    mod = await import(pathToFileURL(REAL_GENERATOR_PATH).href);
  } catch (err) {
    throw new Error(
      `Cannot load real generator at ${REAL_GENERATOR_PATH}: ${err.message}`,
    );
  }

  // Toni's module is CommonJS, so the named exports live under `default`
  // when imported from ESM. Fall back to top-level just in case Node decides
  // to expose them directly.
  const exported = mod?.default ?? mod;
  if (!exported || typeof exported.generateProject !== 'function') {
    throw new Error(
      `Real generator at ${REAL_GENERATOR_PATH} does not export generateProject()`,
    );
  }

  _realModuleCache = exported;
  return exported;
}

async function realGenerateProject(input) {
  const { taskId } = input ?? {};
  logger.info(`[generator:real] start for task ${taskId}`);
  const realGen = await loadRealGeneratorModule();

  // Pass through any optional callbacks (instrumentation-only).
  const result = await realGen.generateProject(input);

  if (
    !result ||
    typeof result.projectPath !== 'string' ||
    typeof result.previewUrl !== 'string'
  ) {
    throw new Error(
      'Real generator returned invalid shape, expected { projectPath, previewUrl }',
    );
  }

  logger.info(
    `[generator:real] done for task ${taskId} -> ${result.previewUrl}`,
  );
  return result;
}

/**
 * @param {{ prompt: string, taskId: string }} input
 * @returns {Promise<{ projectPath: string, previewUrl: string, files?: string[] }>}
 */
export async function generateProject(input) {
  if (USE_MOCK) {
    return mockGenerateProject(input);
  }
  return realGenerateProject(input);
}

export default generateProject;
