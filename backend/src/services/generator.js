import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sleep } from '../utils/sleep.js';
import { logger } from '../utils/logger.js';

/**
 * Contract that Toni's real implementation MUST respect.
 *
 *   generateProject({ prompt, taskId }) -> Promise<{
 *     projectPath, previewUrl, name?, stack?, files?
 *   }>
 *
 *   - prompt:      string. The natural language input from the mobile app.
 *   - taskId:      string. Unique id created by the backend, used for naming the
 *                  output directory and any deploy that needs a unique slug.
 *
 *   Returns:
 *   - projectPath: absolute path on disk to the generated project. Arnau will
 *                  push this folder to GitHub.
 *   - previewUrl:  publicly accessible URL of the deployed preview.
 *   - name, stack: short labels rendered on the preview UI.
 *   - files:       (optional) array of `{ path: string, status: 'created'|'modified' }`
 *                  describing the final project tree. The frontend converts the
 *                  flat list into a folder tree.
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
    name: 'Mock Project',
    stack: 'React + Vite',
    files: [
      { path: 'README.md', status: 'created' },
      { path: 'index.html', status: 'created' },
      { path: 'package.json', status: 'created' },
      { path: 'vite.config.js', status: 'created' },
      { path: 'src/App.css', status: 'modified' },
      { path: 'src/App.jsx', status: 'modified' },
      { path: 'src/main.jsx', status: 'created' },
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

async function realGenerateProject({ prompt, taskId }) {
  logger.info(`[generator:real] start for task ${taskId}`);
  const realGen = await loadRealGeneratorModule();

  const result = await realGen.generateProject({ prompt, taskId });

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

  return {
    projectPath: result.projectPath,
    previewUrl: result.previewUrl,
    name: typeof result.name === 'string' ? result.name : null,
    stack: typeof result.stack === 'string' ? result.stack : null,
    files: normalizeFiles(result.files),
  };
}

function normalizeFiles(rawFiles) {
  if (!Array.isArray(rawFiles)) return undefined;
  const out = [];
  for (const entry of rawFiles) {
    if (!entry) continue;
    if (typeof entry === 'string') {
      out.push({ path: entry, status: 'created' });
      continue;
    }
    if (typeof entry === 'object' && typeof entry.path === 'string') {
      out.push({
        path: entry.path,
        status: entry.status === 'modified' ? 'modified' : 'created',
      });
    }
  }
  return out.length > 0 ? out : undefined;
}

/**
 * @param {{ prompt: string, taskId: string }} input
 * @returns {Promise<{
 *   projectPath: string,
 *   previewUrl: string,
 *   name?: string|null,
 *   stack?: string|null,
 *   files?: Array<{ path: string, status: 'created'|'modified' }>
 * }>}
 */
export async function generateProject(input) {
  if (USE_MOCK) {
    return mockGenerateProject(input);
  }
  return realGenerateProject(input);
}

export default generateProject;
