# Demo Feature Pack

This package contains the standalone GitHub push service used by the backend accept flow.

## Contents

- `github.js`: exports `pushToGitHub({ projectPath, taskId, prompt })`

## Runtime requirements

- `GITHUB_TOKEN`
- `GITHUB_USER`
- `GITHUB_REPO`

This folder is kept as a reusable artifact before merge and does not include temporary integration prompts or step-by-step migration notes.
