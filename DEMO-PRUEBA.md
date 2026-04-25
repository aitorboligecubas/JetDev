# Demo de prueba — rama `prueba`

Esta rama integra TODO lo que tenemos hasta ahora:

- **Frontend (Aitor)** → mergeado desde `main` con todas sus mejoras visuales
- **Backend orquestador (Iván)** → API `POST /generate` + `POST /task/:id/accept`
- **Generator real con Junie + OpenAI (Toni)** → en `generator/` (CommonJS, lo carga el backend dinámicamente)
- **Push a GitHub real (Arnau)** → en `backend/src/services/github.js` (modo mock por defecto, real opcional)

Está pensada para que **Aitor desde su Mac** pueda arrancar todo de un tirón y validar el flujo end-to-end.

---

## 0. Pre-requisitos

- Node >= 18 (yo he probado con Node 20)
- npm >= 9
- git
- Para usar el **generador real de Toni**, una API key de OpenAI (la del concurso vale)
- Para usar el **push real de Arnau**, un Personal Access Token de GitHub con scope `repo`

> Si quieres probar sólo el flujo (sin gastar tokens), no hace falta nada de lo anterior — el modo por defecto es 100 % mock.

---

## 1. Clonar y entrar en la rama

```bash
git clone https://github.com/aitorboligecubas/JetDev.git
cd JetDev
git checkout prueba
git pull
```

---

## 2. Configurar variables de entorno

### 2.1 Backend (`backend/.env`)

Copia el ejemplo:

```bash
cp backend/.env.example backend/.env
```

Por defecto queda así (ya funciona con mocks, no toques nada si sólo quieres ver el flujo):

```env
PORT=3001
CORS_ORIGIN=*
USE_MOCK_GENERATOR=true   # mock genera un proyecto fake
USE_MOCK_GITHUB=true      # mock devuelve URLs fake
```

#### Para activar el **generador real (Toni)**:

```env
USE_MOCK_GENERATOR=false
```

… y crea **además** `generator/.env` con tu OpenAI key (ver paso 2.2).

#### Para activar el **push real a GitHub (Arnau)**:

```env
USE_MOCK_GITHUB=false
GITHUB_TOKEN=ghp_tu_personal_access_token
GITHUB_USER=jetdev-demo
GITHUB_REPO=jetdev-demo
```

(Crea antes el repo `jetdev-demo` vacío en tu cuenta de GitHub o usa cualquier otro `GITHUB_USER/GITHUB_REPO` que sea tuyo.)

### 2.2 Generador (`generator/.env`) — sólo si activas Toni real

```bash
cp generator/.env.example generator/.env
```

Edita el archivo y rellena:

```env
OPENAI_API_KEY=sk-proj-...
JUNIE_API_KEY=...   # opcional, sólo si tienes Junie CLI
```

---

## 3. Instalar dependencias

```bash
cd backend && npm install && cd ..
# Sólo si vas a usar Toni real:
cd generator && npm install && cd ..
```

---

## 4. Arrancar el backend

```bash
cd backend
npm start
```

Verás algo como:

```
[backend] [info] JetDev backend listening on http://0.0.0.0:3001
[backend] [info]   - Local:   http://localhost:3001
[backend] [info]   - Network: http://192.168.x.x:3001
```

Apunta la **IP de Network** — desde tu móvil/tablet en la misma WiFi tendrás que llamar a `http://<esa-ip>:3001`.

---

## 5. Probar el flujo end-to-end

### Opción A — automatizado (recomendado primero)

En **otra terminal**:

```bash
cd backend
npm run test:online
```

Salida esperada: `Result: 13 passed, 0 failed` y `Result: 29 passed, 0 failed`.
Esto cubre:
- POST `/generate` con validaciones
- Polling del estado por `/task/:id`
- POST `/task/:id/accept` con push (mock o real según flags)
- Caso de error de generador

### Opción B — manual con curl

```bash
# 1. Lanzar una tarea
curl -X POST http://localhost:3001/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Build a gym landing page with prices"}'

# Respuesta (202): { "taskId": "task-xxxx", "status": "queued" }

# 2. Polling — ir pidiendo el estado hasta que sea "deployed"
curl http://localhost:3001/task/task-xxxx

# 3. Cuando esté en "deployed" → aceptar (push a GitHub)
curl -X POST http://localhost:3001/task/task-xxxx/accept

# Respuesta (200): { ..., "status": "accepted", "repoUrl": "...", "branchUrl": "...", "intellijUrl": "jetbrains://..." }
```

### Opción C — desde el frontend de Aitor

Apunta tu app móvil al backend (`http://<ip-Mac>:3001`) y prueba el flujo desde la UI:
1. Escribir prompt → "Generate"
2. Ver progreso en tiempo real (`generating → building → deploying → deployed`)
3. Pulsar "Accept" → push a GitHub
4. Abrir `intellijUrl` desde el botón "Open in IntelliJ"

---

## 6. Estados del task (de cara al front)

```
queued → generating → building → deploying → deployed
                                                │
                                  [POST /task/:id/accept]
                                                │
                                                ▼
                                            pushing → accepted

                       cualquier paso → error  (si falla algo)
```

Campos de la task que aparecen en la respuesta:

| Campo | Cuándo aparece |
|-------|----------------|
| `previewUrl` | tras `deploying` (URL al preview) |
| `projectPath` | tras `deploying` (ruta local en el server, info debug) |
| `repoUrl` | tras `accepted` (URL al repo de GitHub) |
| `branch` | tras `accepted` (siempre `"main"` por ahora) |
| `branchUrl` | tras `accepted` (URL al branch en github.com) |
| `intellijUrl` | tras `accepted` (deep link `jetbrains://idea/checkout/git?...`) |
| `error` | sólo si algo falla |

---

## 7. Si algo no funciona

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `EADDRINUSE :3001` | Ya hay un Node en ese puerto | `lsof -i :3001` → `kill <pid>` |
| `Pipeline failed: Cannot load real generator` | `USE_MOCK_GENERATOR=false` pero `generator/node_modules` no instalados | `cd generator && npm install` |
| `Pipeline failed: OPENAI_API_KEY missing` | Falta `generator/.env` con la key | Crear `generator/.env` |
| `Failed to push project to GitHub` con 401/403 | Token mal o sin scope `repo` | Regenerar PAT con scope `repo` |
| `previewUrl` apunta a `localhost` y no se ve desde el móvil | Si pasara, fix ya aplicado: usa la IP LAN automáticamente | — |
| El front no recibe respuesta | Mac y móvil en distinta WiFi, o firewall del Mac bloqueando 3001 | Mismo router; permitir Node en firewall |

---

## 8. Cosas que NO están en esta demo (apuntes para después)

- No hay AWS — el preview se sirve en local con `serve-handler` desde el propio Mac. Para que Aitor lo vea desde el móvil sólo hace falta misma WiFi.
- No hay WebSocket — el front hace polling cada ~250ms a `GET /task/:id` (suficiente para la demo).
- No hay flujo de "continuar proyecto existente" — sólo se crea desde cero.
- El push siempre va a `main` con `--force` (es lo que hace Arnau).
