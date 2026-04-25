const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function runGit(command, cwd) {
  console.log(`[git] ${command}`);
  return execSync(command, {
    cwd,
    env: {
      ...process.env,
      // Prevent git from opening interactive credential prompts.
      GIT_TERMINAL_PROMPT: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  }).trim();
}

function trimPrompt(prompt, maxLength = 80) {
  const clean = String(prompt || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3)}...`;
}

async function pushToGitHub({ projectPath, taskId, prompt }) {
  const resolvedProjectPath = path.resolve(projectPath);
  const githubToken = process.env.GITHUB_TOKEN;
  const githubUser = process.env.GITHUB_USER;
  const githubRepo = process.env.GITHUB_REPO;

  if (!projectPath || !taskId) {
    throw new Error("Missing required params: projectPath and taskId are required.");
  }

  if (!githubToken || !githubUser || !githubRepo) {
    throw new Error(
      "Missing .env vars. Required: GITHUB_TOKEN, GITHUB_USER, GITHUB_REPO."
    );
  }

  if (!fs.existsSync(resolvedProjectPath)) {
    throw new Error(`projectPath does not exist: ${resolvedProjectPath}`);
  }

  const branch = "main";
  const trimmedPrompt = trimPrompt(prompt).replace(/"/g, "'");
  const commitMessage = trimmedPrompt
    ? `Apply AI request: ${trimmedPrompt}`
    : "Apply AI generated changes";
  const encodedToken = encodeURIComponent(githubToken);
  const remoteUrl = `https://x-access-token:${encodedToken}@github.com/${githubUser}/${githubRepo}.git`;
  const repoUrl = `https://github.com/${githubUser}/${githubRepo}`;
  const branchUrl = `${repoUrl}/tree/main`;
  const maskedToken =
    githubToken.length > 8
      ? `${githubToken.slice(0, 4)}...${githubToken.slice(-4)}`
      : "***";
  const maskedRemoteUrl = `https://x-access-token:${maskedToken}@github.com/${githubUser}/${githubRepo}.git`;

  try {
    console.log(`[github] Preparing project at: ${resolvedProjectPath}`);
    console.log(`[github] Working directory: ${resolvedProjectPath}`);
    console.log(`[github] Using remote URL: ${maskedRemoteUrl}`);

    runGit("git init", resolvedProjectPath);

    // Keep this repo self-contained so commit works even on fresh machines.
    runGit('git config user.name "AI Hackathon Bot"', resolvedProjectPath);
    runGit(
      'git config user.email "ai-hackathon-bot@users.noreply.github.com"',
      resolvedProjectPath
    );

    runGit("git checkout -B main", resolvedProjectPath);
    runGit("git add .", resolvedProjectPath);
    runGit(
      `git commit --allow-empty -m "${commitMessage.replace(/"/g, '\\"')}"`,
      resolvedProjectPath
    );

    // Remove origin if it already exists to avoid conflicts.
    try {
      runGit("git remote remove origin", resolvedProjectPath);
    } catch (removeErr) {
      console.log("[github] No existing origin to remove.");
    }

    runGit(`git remote add origin "${remoteUrl}"`, resolvedProjectPath);
    const remoteInfo = runGit("git remote -v", resolvedProjectPath);
    // Hide token in logs, but still show actual remotes configured.
    console.log(
      "[github] git remote -v:\n" +
        remoteInfo.split(githubToken).join(maskedToken)
    );
    runGit("git push -u origin main --force", resolvedProjectPath);

    console.log(`[github] Push completed: ${branchUrl}`);

    return {
      repoUrl,
      branch: "main",
      branchUrl,
    };
  } catch (error) {
    const stderr = error && error.stderr ? String(error.stderr) : "";
    const stdout = error && error.stdout ? String(error.stdout) : "";
    console.error("[github] pushToGitHub failed.");
    if (stdout.trim()) console.error("[github] stdout:", stdout.trim());
    if (stderr.trim()) console.error("[github] stderr:", stderr.trim());
    throw new Error(
      `Failed to push project to GitHub branch "main": ${error.message}`
    );
  }
}

module.exports = {
  pushToGitHub,
};
