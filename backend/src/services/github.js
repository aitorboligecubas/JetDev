import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

import { logger } from '../utils/logger.js';

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

/**
 * @param {{ projectPath: string, taskId: string, prompt?: string }} input
 * @returns {Promise<{ repoUrl: string, branch: string, branchUrl: string }>}
 */
export async function pushToGitHub({ projectPath, taskId, prompt }) {
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
  const maskedToken =
    githubToken.length > 8
      ? `${githubToken.slice(0, 4)}...${githubToken.slice(-4)}`
      : '***';
  const maskedRemoteUrl = `https://x-access-token:${maskedToken}@github.com/${githubUser}/${githubRepo}.git`;

  try {
    logger.info(`[github] preparing project at ${resolvedProjectPath}`);
    logger.info(`[github] using remote ${maskedRemoteUrl}`);

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

    logger.info(`[github] push completed: ${branchUrl}`);
    return { repoUrl, branch, branchUrl };
  } catch (error) {
    const stdout = error?.stdout ? String(error.stdout).trim() : '';
    const stderr = error?.stderr ? String(error.stderr).trim() : '';
    if (stdout) logger.error(`[github] stdout: ${stdout}`);
    if (stderr) logger.error(`[github] stderr: ${stderr}`);
    throw new Error(`Failed to push project to GitHub branch "${branch}": ${error.message}`);
  }
}

export default pushToGitHub;
