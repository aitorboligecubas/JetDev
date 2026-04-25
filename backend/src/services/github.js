import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

import { logger } from '../utils/logger.js';
import { sleep } from '../utils/sleep.js';

/**
 * Contract:
 *
 *   pushToGitHub({ projectPath, taskId, prompt? })
 *     -> Promise<{ repoUrl, branch, branchUrl, intellijUrl }>
 *
 *   - projectPath: absolute path on disk to the generated project.
 *   - taskId:      unique task id (used in commit messages and logs).
 *   - prompt:      original user prompt (used as commit message).
 *
 *   Returns:
 *   - repoUrl:     https URL of the GitHub repo.
 *   - branch:      branch where the changes were pushed (currently always "main").
 *   - branchUrl:   https URL of the branch on github.com.
 *   - intellijUrl: jetbrains:// deep link so a developer can clone the repo into IntelliJ.
 *
 *   On failure: throw new Error("descriptive message").
 *
 * Toggle the real implementation with USE_MOCK_GITHUB=false in backend/.env.
 * The real path requires GITHUB_TOKEN, GITHUB_USER, GITHUB_REPO env vars.
 */

const USE_MOCK = process.env.USE_MOCK_GITHUB !== 'false';
const FAIL_PATH_KEYWORD = '__force_github_error__';

function buildIntellijUrl(repoUrl) {
  return `jetbrains://idea/checkout/git?idea.required.plugins.id=Git&checkout.repo=${encodeURIComponent(repoUrl)}`;
}

async function mockPushToGitHub({ projectPath, taskId }) {
  logger.info(`[github:mock] start for task ${taskId} (path=${projectPath})`);
  await sleep(800);

  if (typeof projectPath === 'string' && projectPath.includes(FAIL_PATH_KEYWORD)) {
    throw new Error('Mock github failure (forced by projectPath keyword)');
  }

  const repoUrl = `https://github.com/jetdev-demo/${taskId}`;
  const branch = 'main';
  const branchUrl = `${repoUrl}/tree/${branch}`;
  const intellijUrl = buildIntellijUrl(repoUrl);

  logger.info(`[github:mock] done for task ${taskId} (branch=${branch})`);
  return { repoUrl, branch, branchUrl, intellijUrl };
}

function runGit(command, cwd) {
  logger.info(`[github] git ${command}`);
  return execSync(`git ${command}`, {
    cwd,
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  }).trim();
}

function initRepoAt(projectPath) {
  logger.info(`[github] git init "${projectPath}"`);
  return execSync(`git init "${projectPath}"`, {
    cwd: path.dirname(projectPath),
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  }).trim();
}

function trimPrompt(prompt, maxLength = 80) {
  const clean = String(prompt || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3)}...`;
}

async function realPushToGitHub({ projectPath, taskId, prompt }) {
  const resolvedProjectPath = path.resolve(projectPath || '');
  const githubToken = process.env.GITHUB_TOKEN;
  const githubUser = process.env.GITHUB_USER;
  const githubRepo = process.env.GITHUB_REPO;

  if (!projectPath || !taskId) {
    throw new Error('Missing required params: projectPath and taskId are required.');
  }
  if (!githubToken || !githubUser || !githubRepo) {
    throw new Error('Missing env vars. Required: GITHUB_TOKEN, GITHUB_USER, GITHUB_REPO.');
  }
  if (!fs.existsSync(resolvedProjectPath)) {
    throw new Error(`projectPath does not exist: ${resolvedProjectPath}`);
  }

  const branch = 'main';
  const trimmedPrompt = trimPrompt(prompt).replace(/"/g, '\'');
  const commitMessage = trimmedPrompt
    ? `Apply AI request: ${trimmedPrompt}`
    : 'Apply AI generated changes';
  const encodedToken = encodeURIComponent(githubToken);
  const remoteUrl = `https://x-access-token:${encodedToken}@github.com/${githubUser}/${githubRepo}.git`;
  const repoUrl = `https://github.com/${githubUser}/${githubRepo}`;
  const branchUrl = `${repoUrl}/tree/${branch}`;
  const intellijUrl = buildIntellijUrl(repoUrl);
  const maskedToken =
    githubToken.length > 8
      ? `${githubToken.slice(0, 4)}...${githubToken.slice(-4)}`
      : '***';
  const maskedRemoteUrl = `https://x-access-token:${maskedToken}@github.com/${githubUser}/${githubRepo}.git`;

  try {
    logger.info(`[github:real] preparing project at ${resolvedProjectPath}`);
    logger.info(`[github:real] using remote ${maskedRemoteUrl}`);

    initRepoAt(resolvedProjectPath);
    runGit('config user.name "AI Hackathon Bot"', resolvedProjectPath);
    runGit('config user.email "ai-hackathon-bot@users.noreply.github.com"', resolvedProjectPath);
    runGit(`checkout -B ${branch}`, resolvedProjectPath);
    runGit('add .', resolvedProjectPath);
    const staged = runGit('status --porcelain', resolvedProjectPath);
    if (!staged) {
      throw new Error(`No changes detected in projectPath: ${resolvedProjectPath}`);
    }
    runGit(`commit -m "${commitMessage.replace(/"/g, '\\"')}"`, resolvedProjectPath);

    try {
      runGit('remote remove origin', resolvedProjectPath);
    } catch {
      logger.debug('[github] no existing origin to remove');
    }

    runGit(`remote add origin "${remoteUrl}"`, resolvedProjectPath);
    runGit(`push -u origin ${branch} --force`, resolvedProjectPath);

    logger.info(`[github:real] push completed: ${branchUrl}`);
    return { repoUrl, branch, branchUrl, intellijUrl };
  } catch (error) {
    const stdout = error?.stdout ? String(error.stdout).trim() : '';
    const stderr = error?.stderr ? String(error.stderr).trim() : '';
    if (stdout) logger.error(`[github] stdout: ${stdout}`);
    if (stderr) logger.error(`[github] stderr: ${stderr}`);
    throw new Error(`Failed to push project to GitHub branch "${branch}": ${error.message}`);
  }
}

/**
 * @param {{ projectPath: string, taskId: string, prompt?: string }} input
 * @returns {Promise<{ repoUrl: string, branch: string, branchUrl: string, intellijUrl: string }>}
 */
export async function pushToGitHub(input) {
  if (USE_MOCK) {
    return mockPushToGitHub(input);
  }
  return realPushToGitHub(input);
}

export default pushToGitHub;
