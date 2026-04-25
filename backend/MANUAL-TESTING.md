# Manual testing guide — JetDev backend

Three obligatory scenarios:

1. **Happy path** — full pipeline ends in `deployed`.
2. **Validation 400** — bad input returns clean errors without touching the pipeline.
3. **Pipeline failure** — generator/github error → task ends in `error`.

All examples assume the server is running:

```bash
cd backend
npm start
```

You should see something like:

```
[backend] [info] JetDev backend listening on http://0.0.0.0:3001
```

---

## Quickest path: live watcher

The fastest way to see everything working at once. Creates a task and watches it
to completion with a live progress bar:

```bash
npm run watch:task -- --prompt "Build a gym landing page with prices and bookings"
```

Force a generator failure:

```bash
npm run watch:task -- --prompt "__force_generator_error__ pls fail"
```

Force a github failure:

```bash
npm run watch:task -- --prompt "__force_github_error__ ok"
```

You can also watch an existing task by id:

```bash
npm run watch:task -- task-abc1234567
```

---

## Scenario 1 — Happy path

### PowerShell (Windows)

```powershell
$body = '{"prompt":"Build a gym landing page","projectId":"demo"}'
$create = Invoke-RestMethod -Uri http://localhost:3001/generate -Method Post -ContentType 'application/json' -Body $body
$create | ConvertTo-Json
$taskId = $create.taskId

# poll until deployed
do {
  Start-Sleep -Seconds 1
  $task = Invoke-RestMethod -Uri "http://localhost:3001/task/$taskId" -Method Get
  Write-Host "status: $($task.status)"
} while ($task.status -ne 'deployed' -and $task.status -ne 'error')

$task | ConvertTo-Json -Depth 5
```

### bash / curl

```bash
TASK_ID=$(curl -s -X POST http://localhost:3001/generate \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Build a gym landing page","projectId":"demo"}' \
  | jq -r .taskId)
echo "taskId=$TASK_ID"

while :; do
  STATUS=$(curl -s http://localhost:3001/task/$TASK_ID | jq -r .status)
  echo "status: $STATUS"
  [[ "$STATUS" == "deployed" || "$STATUS" == "error" ]] && break
  sleep 1
done

curl -s http://localhost:3001/task/$TASK_ID | jq .
```

### Postman

1. **POST** `http://localhost:3001/generate`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     { "prompt": "Build a gym landing page", "projectId": "demo" }
     ```
   - Expected: `202 Accepted`, body `{ "taskId": "task-...", "status": "queued" }`.
2. **GET** `http://localhost:3001/task/{{taskId}}` — repeat every 1–2 s.
3. Expected final body:
   ```json
   {
     "id": "task-...",
     "status": "deployed",
     "logs": ["Understanding request", "Generating code", "Building project",
              "Deploying preview", "Pushing to GitHub", "Done"],
     "previewUrl": "https://preview.example.com/task-...",
     "repoUrl": "https://github.com/jetdev-demo/task-...",
     "branch": "ai/task-...",
     "intellijUrl": "jetbrains://idea/checkout/git?...",
     "error": null,
     ...
   }
   ```

### Pass criteria

- [ ] `POST /generate` returns 202 in < 500 ms.
- [ ] Polling sees: `queued → generating → building → deploying → pushing → deployed`.
- [ ] Final task has `previewUrl`, `repoUrl`, `branch`, `intellijUrl`, `error: null`.
- [ ] `logs` contains the 6 official messages in order.

---

## Scenario 2 — Validation 400

Cover all the input edge cases without touching the pipeline.

### PowerShell

```powershell
$cases = @(
  @{ name = 'missing prompt';    body = '{}' },
  @{ name = 'empty prompt';      body = '{"prompt":""}' },
  @{ name = 'numeric projectId'; body = '{"prompt":"x","projectId":123}' },
  @{ name = 'invalid JSON';      body = '{not json' },
  @{ name = 'huge prompt';       body = ('{"prompt":"' + ('x' * 5000) + '"}') }
)
foreach ($c in $cases) {
  try {
    Invoke-RestMethod -Uri http://localhost:3001/generate -Method Post -ContentType 'application/json' -Body $c.body | Out-Null
    Write-Host "$($c.name): UNEXPECTED 2xx"
  } catch {
    Write-Host "$($c.name): $($_.Exception.Response.StatusCode.value__)"
  }
}
```

### bash / curl

```bash
for case in '{}' '{"prompt":""}' '{"prompt":"x","projectId":123}' '{not json' "$(printf '{"prompt":"%s"}' "$(printf 'x%.0s' {1..5000})")"; do
  echo -n "case: $case -> "
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3001/generate \
    -H 'Content-Type: application/json' -d "$case"
done
```

### Pass criteria

- [ ] Each request above returns **400**.
- [ ] Body of the response is a JSON `{ "error": "..." }` with a clear message.
- [ ] No task is created (verify with `GET /tasks` — count does not grow).

---

## Scenario 3 — Pipeline failure

Two failure modes. Both end with `status: "error"` and a populated `error`
field. The HTTP request still returns 202 — the failure is reported via
polling, not synchronously.

### Force generator failure

```powershell
$body = '{"prompt":"__force_generator_error__ please fail","projectId":"demo"}'
$create = Invoke-RestMethod -Uri http://localhost:3001/generate -Method Post -ContentType 'application/json' -Body $body
$taskId = $create.taskId
Start-Sleep -Seconds 3
Invoke-RestMethod -Uri "http://localhost:3001/task/$taskId" | ConvertTo-Json -Depth 5
```

Expected output (essential fields):

```json
{
  "status": "error",
  "previewUrl": null,
  "repoUrl": null,
  "branch": null,
  "error": "Mock generator failure (forced by prompt keyword)",
  "logs": ["Understanding request", "Generating code", "Error: Mock generator failure ..."]
}
```

### Force GitHub failure

```powershell
$body = '{"prompt":"__force_github_error__ ok","projectId":"demo"}'
$create = Invoke-RestMethod -Uri http://localhost:3001/generate -Method Post -ContentType 'application/json' -Body $body
$taskId = $create.taskId
Start-Sleep -Seconds 5
Invoke-RestMethod -Uri "http://localhost:3001/task/$taskId" | ConvertTo-Json -Depth 5
```

Expected:

- `status`: `"error"`
- `previewUrl`: filled (it failed AFTER deploy)
- `repoUrl` / `branch`: `null`
- `error`: `"Mock github failure ..."`

### Pass criteria

- [ ] Generator failure → `error` status, all URLs `null`, error in logs.
- [ ] GitHub failure → `error` status, `previewUrl` populated, `repoUrl`/`branch` `null`.
- [ ] In both cases, the initial `POST /generate` still returned `202` immediately.

---

## Health check

Always-on sanity check, useful before a demo:

```bash
curl -s http://localhost:3001/health | jq .
```

Expected: `{ "ok": true, "service": "jetdev-backend", ... }`.

---

## Listing all tasks (debug)

```bash
curl -s http://localhost:3001/tasks | jq .
```

Returns `{ "tasks": [...] }` sorted by `createdAt` desc.

---

## Cleaning up

```bash
curl -s -X DELETE http://localhost:3001/task/<taskId> -i
```

Returns `204 No Content`. Hitting it again returns `404`.

---

## Automated checks (recommended before pushing)

Run all four smoke suites:

```bash
# Offline (no server needed):
npm run test:offline

# Online (requires server at $SMOKE_BASE_URL or http://localhost:3001):
npm run test:online
```

Counts to expect: 30 + 21 + 13 + 26 = **90/90 ok** total.
