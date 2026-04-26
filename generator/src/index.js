// =============================================================================
// generator/src/index.js — JetDev Project Generator
//
// CONTRACT (for Iván's backend):
//
//   const { generateProject } = require("../generator/src/index.js");
//   const result = await generateProject({ prompt, taskId });
//   // result = { projectPath: "/abs/path", previewUrl: "http://..." }
//
// PIPELINE:
//   1. Clone template → output/<taskId>/
//   2. OpenAI enhances prompt into detailed instruction
//   3. Junie CLI applies changes (Fallback to OpenAI Code Gen if Junie fails!)
//   4. npm install + npm run build
//   5. Serve dist/ on a random port
//   6. Return { projectPath, previewUrl }
//
// If ANYTHING fails completely → throw new Error("clear message")
// =============================================================================

const fs = require("fs");
const path = require("path");
const http = require("http");
const net = require("net");
const os = require("node:os");
const crypto = require("node:crypto");
const { execSync, spawnSync } = require("child_process");

// Load .env from generator folder
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const OpenAI = require("openai");

// ─── Config ─────────────────────────────────────────────────────────────────
const TEMPLATE_DIR = path.join(__dirname, "..", "templates", "base");
const OUTPUT_DIR = path.join(__dirname, "..", "output");

// Track running preview servers for cleanup
const _previews = new Map();

// =============================================================================
// STEP 1 — Clone template to output/<taskId>/
// =============================================================================

function cloneTemplate(taskId) {
  const dest = path.join(OUTPUT_DIR, taskId);

  if (!fs.existsSync(TEMPLATE_DIR)) {
    throw new Error(`Template not found at ${TEMPLATE_DIR}`);
  }

  // Clean if already exists
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }

  copyDirSync(TEMPLATE_DIR, dest);
  return dest;
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDirSync(s, d) : fs.copyFileSync(s, d);
  }
}

// =============================================================================
// File tree helpers — used to expose the generated project to the frontend
// =============================================================================

const SCAN_IGNORE = new Set(["node_modules", "dist", ".git", ".vite", ".cache"]);

/**
 * Walks `root` (excluding build/install artifacts) and returns a Map keyed by
 * the posix-style relative path with the md5 hash of every file.
 */
function hashProjectTree(root) {
  /** @type {Map<string, string>} */
  const out = new Map();

  function walk(current) {
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SCAN_IGNORE.has(entry.name)) continue;
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.isFile()) {
        const rel = path.relative(root, abs).split(path.sep).join("/");
        try {
          const buf = fs.readFileSync(abs);
          out.set(rel, crypto.createHash("md5").update(buf).digest("hex"));
        } catch {
          // skip unreadable files
        }
      }
    }
  }

  walk(root);
  return out;
}

/**
 * Compares the current state of `projectPath` against `baselineHashes` (taken
 * right after cloning the template) and returns a flat list of files with
 * `created` (new file or no template counterpart) or `modified` (existed in
 * template but content changed).
 *
 * The frontend converts this flat list into a folder tree.
 */
function diffProjectFiles(projectPath, baselineHashes) {
  const current = hashProjectTree(projectPath);
  /** @type {{ path: string, status: 'created' | 'modified' }[]} */
  const out = [];
  for (const [rel, hash] of current) {
    const prev = baselineHashes.get(rel);
    if (prev === undefined) {
      out.push({ path: rel, status: "created" });
    } else if (prev !== hash) {
      out.push({ path: rel, status: "modified" });
    } else {
      out.push({ path: rel, status: "created" });
    }
  }
  out.sort((a, b) => a.path.localeCompare(b.path));
  return out;
}

// =============================================================================
// STEP 2 — Enhance prompt with OpenAI
// =============================================================================

const ENHANCE_SYSTEM = `You are a prompt engineer. The user gives you a short idea. You turn it into a detailed, structured instruction for an AI coding agent that will modify a React/Vite project.

Your output must tell the coding agent EXACTLY what to build:
- Specific sections/pages and their content
- Color palette (hex codes), typography (Google Fonts)
- Layout structure, responsive behavior
- Hover effects, animations, interactions
- Specific text content (headings, paragraphs, buttons)

Rules:
- Always request a dark-themed, visually polished design
- Be specific and opinionated — don't say "choose a nice color", say "#6c5ce7"
- The agent can ONLY modify src/App.jsx and src/App.css
- Only React + CSS allowed (no external libraries)
- Keep under 1500 chars
- Output ONLY the instruction, no preamble`;

async function enhancePrompt(userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set in .env");

  const openai = new OpenAI({ apiKey });

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: ENHANCE_SYSTEM },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const enhanced = res.choices[0].message.content.trim();
  if (!enhanced) throw new Error("OpenAI returned empty enhancement");
  return enhanced;
}

// =============================================================================
// STEP 2B — Generate project metadata (name, stack, README)
// =============================================================================

const META_SYSTEM = `You receive a user's product idea. Return ONLY a valid JSON object with these fields:
{
  "name": "short, human-friendly project name (max 4 words, Title Case)",
  "stack": "very short tech stack label that fits on a pill, e.g. 'React + Vite' (always React + Vite for now, but you may add a domain hint, e.g. 'React + Vite · Dashboard')",
  "readme": "complete README.md content in GitHub Markdown"
}

Rules for the README:
- Start with a level-1 heading using the project name.
- Include sections: Overview, Features, Tech Stack, Getting Started, Project Structure.
- Mention that this project was generated by JetDev (a JetBrains hackathon project) using Junie + OpenAI.
- Tech stack section MUST list React 18, Vite 5, plain CSS.
- Getting Started section MUST show: \`npm install\`, \`npm run dev\`, \`npm run build\`.
- Keep the README under 1500 chars total.
- Tone: professional, concise, no emojis except a single one in the title.
- Do NOT include code blocks for App.jsx / App.css.
- Output ONLY the JSON object, no preamble.`;

function fallbackMetadata(userPrompt) {
  const trimmed = String(userPrompt || "").replace(/\s+/g, " ").trim();
  const words = trimmed.split(" ").slice(0, 4).filter(Boolean);
  const name = words.length
    ? words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")
    : "Generated Project";
  return {
    name,
    stack: "React + Vite",
    readme: `# ${name}\n\n## Overview\n\n${trimmed || "An app generated by JetDev."}\n\n## Tech Stack\n\n- React 18\n- Vite 5\n- Plain CSS\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nProduction build:\n\n\`\`\`bash\nnpm run build\n\`\`\`\n\n## Notes\n\nGenerated by JetDev (JetBrains hackathon project) using Junie + OpenAI.\n`,
  };
}

async function generateMetadata(userPrompt, enhancedPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbackMetadata(userPrompt);

  try {
    const openai = new OpenAI({ apiKey });
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: META_SYSTEM },
        {
          role: "user",
          content: `Original idea: ${userPrompt}\n\nDetailed plan: ${enhancedPrompt}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(res.choices[0].message.content);
    if (!parsed?.name || !parsed?.stack || !parsed?.readme) {
      return fallbackMetadata(userPrompt);
    }
    return {
      name: String(parsed.name).slice(0, 60),
      stack: String(parsed.stack).slice(0, 40),
      readme: String(parsed.readme),
    };
  } catch (e) {
    console.log(`   ⚠ Metadata generation failed: ${e?.message || e}`);
    return fallbackMetadata(userPrompt);
  }
}

function writeReadme(projectPath, readme) {
  fs.writeFileSync(path.join(projectPath, "README.md"), readme, "utf-8");
}

// =============================================================================
// STEP 3A — Run Junie CLI to generate code
// =============================================================================

const JUNIE_CLI_JS = path.join(
  __dirname,
  "..",
  "node_modules",
  "@jetbrains",
  "junie-cli",
  "bin",
  "index.js"
);

/** En Windows el instalador oficial pone `junie.bat` aquí; el paquete npm solo busca `junie` sin extensión y falla. */
const JUNIE_WIN_SHIM = path.join(os.homedir(), ".local", "bin", "junie.bat");

/**
 * Modo "headless" (sin TTY): `stdio: "inherit"` conecta stdin al terminal y Junie abre la UI
 * interactiva. Usamos `stdin: ignore` + `CI=1` + tarea y proyecto vía env (ver documentación
 * JetBrains: JUNIE_TASK, JUNIE_PROJECT, JUNIE_API_KEY).
 *
 * @see https://junie.jetbrains.com/docs/environment-variables.html
 */
function buildJunieEnv(apiKey, projectPath, enhancedPrompt) {
  return {
    ...process.env,
    JUNIE_API_KEY: apiKey,
    JUNIE_PROJECT: projectPath,
    JUNIE_TASK: enhancedPrompt,
    CI: "1",
  };
}

/**
 * - Windows: `cmd /c call junie.bat` sin argumentos (tarea en env), sin `shell: true` en el .bat.
 * - macOS/Linux: shim `~/.local/bin/junie` o `node` + paquete npm, mismo env, argv vacío.
 */
function runJunie(enhancedPrompt, projectPath) {
  const apiKey = process.env.JUNIE_API_KEY;
  if (!apiKey) return false;

  const userJunieShim = path.join(os.homedir(), ".local", "bin", "junie");
  const env = buildJunieEnv(apiKey, projectPath, enhancedPrompt);

  const childOpts = {
    cwd: projectPath,
    /** stdin ignorado = no TTY → una sola tarea, sin menú "What shall we build" */
    stdio: ["ignore", "inherit", "inherit"],
    timeout: 180000,
    env,
  };

  if (!fs.existsSync(JUNIE_CLI_JS)) {
    console.log(`   ⚠ No está instalado @jetbrains/junie-cli: ${JUNIE_CLI_JS}`);
    console.log("   → Ejecuta: cd generator && npm install");
    return false;
  }

  let result;

  try {
    if (process.platform === "win32" && fs.existsSync(JUNIE_WIN_SHIM)) {
      console.log("   → Junie CLI (headless, tarea vía JUNIE_TASK en env) — junie.bat…");
      result = spawnSync("cmd.exe", ["/c", "call", JUNIE_WIN_SHIM], {
        ...childOpts,
        windowsHide: true,
      });
    } else if (fs.existsSync(userJunieShim)) {
      console.log("   → Junie CLI (headless, tarea vía JUNIE_TASK) — shim ~/.local/bin/junie…");
      result = spawnSync(userJunieShim, [], {
        ...childOpts,
        windowsHide: true,
      });
    } else {
      console.log("   → Junie CLI (headless) — node + @jetbrains/junie-cli…");
      result = spawnSync(process.execPath, [JUNIE_CLI_JS], {
        ...childOpts,
        windowsHide: true,
      });
    }

    if (result.error) {
      console.log(`   ⚠ Error interno ejecutando Junie: ${result.error.message}`);
      if (process.platform === "win32") {
        console.log(
          "   ℹ En Windows, instala el binario de Junie con el script oficial (PowerShell) desde:\n" +
            "     https://www.jetbrains.com/help/junie/junie-cli.html"
        );
      }
      return false;
    }

    if (result.status !== 0) {
      console.log(`   ⚠ Junie abortado con código ${result.status}`);
      if (process.platform === "win32") {
        console.log(
          "   ℹ Si ves \"Shim not found\": ejecuta en PowerShell el instalador de JetBrains para Junie CLI, " +
            "luego comprueba que exista un ejecutable bajo %USERPROFILE%\\.local\\bin"
        );
      }
      return false;
    }

    const appJsx = fs.readFileSync(path.join(projectPath, "src", "App.jsx"), "utf-8");
    if (appJsx.includes("JetDev Template")) {
      return false; // Junie fingió éxito pero no editó código
    }

    return true; // Éxito completo de Junie
  } catch (e) {
    console.log(`   ⚠ Excepción en runJunie: ${e && e.message ? e.message : e}`);
    return false;
  }
}

// =============================================================================
// STEP 3B — Fallback Autónomo: OpenAI Backend (100% IA real, 0% hardcoded)
// =============================================================================

const CODEGEN_SYSTEM = `You generate React/Vite code. Return ONLY a valid JSON object with two fields:
{
  "appJsx": "complete code for src/App.jsx",
  "appCss": "complete code for src/App.css"
}

Rules:
- No external libraries, only React + CSS
- Modern dark design with CSS variables
- Google Fonts via @import in CSS
- Responsive with media queries, Smooth transitions
- NO markdown, NO explanations — ONLY the valid JSON object`;

async function generateCodeWithOpenAI(enhancedPrompt, projectPath) {
  const apiKey = process.env.OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey });

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: CODEGEN_SYSTEM },
      { role: "user", content: enhancedPrompt },
    ],
    temperature: 0.7,
    max_tokens: 8000,
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(res.choices[0].message.content);
  if (!parsed.appJsx || !parsed.appCss) {
    throw new Error("OpenAI failed to parse final code objects.");
  }

  // Escribir los resultados en tiempo real sobre el proyecto del usuario
  fs.writeFileSync(path.join(projectPath, "src", "App.jsx"), parsed.appJsx, "utf-8");
  fs.writeFileSync(path.join(projectPath, "src", "App.css"), parsed.appCss, "utf-8");
}

// =============================================================================
// STEP 4 — Build project (npm install + npm run build)
// =============================================================================

function buildProject(projectPath) {
  try {
    execSync("npm install", { cwd: projectPath, stdio: "pipe", timeout: 120000 });
    execSync("npm run build", { cwd: projectPath, stdio: "pipe", timeout: 60000 });
  } catch (e) {
    throw new Error(`Build failed: ${(e.stderr || e.message).toString().slice(0, 300)}`);
  }
}

// =============================================================================
// STEP 5 — Deploy preview (static server on random port)
// =============================================================================

function getLanIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

function getRandomPort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

async function deployPreview(projectPath, taskId) {
  const distPath = path.join(projectPath, "dist");
  if (!fs.existsSync(distPath)) throw new Error("Build missing.");

  const port = await getRandomPort();
  const handler = require("serve-handler");
  const server = http.createServer((req, res) => handler(req, res, { public: distPath }));

  return new Promise((resolve, reject) => {
    server.listen(port, "0.0.0.0", () => {
      _previews.set(taskId, server);
      resolve(`http://${getLanIP()}:${port}`);
    });
    server.on("error", (err) => reject(new Error(`Server failed: ${err.message}`)));
  });
}

// =============================================================================
// MAIN — generateProject({ prompt, taskId })
// =============================================================================

/**
 * Generates a project from a prompt and deploys a preview.
 */
async function generateProject({ prompt, taskId }) {
  if (!prompt || !taskId) throw new Error("prompt & taskId required");
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set in generator/.env");

  console.log(`\n☁️  JetDev Generator — Task: ${taskId}`);
  console.log(`📝 Prompt: "${prompt}"\n`);

  // 1: Clonar plantilla
  console.log("📁 [1/5] Cloning template...");
  const projectPath = cloneTemplate(taskId);
  console.log(`   ✅ Cloned to ${projectPath}`);

  // Baseline hashes right after cloning, used later to detect AI-modified files.
  const baselineHashes = hashProjectTree(projectPath);

  // 2: OpenAI mejora el prompt
  console.log("\n🧠 [2/5] Enhancing prompt with OpenAI...");
  const enhancedPrompt = await enhancePrompt(prompt);
  console.log("   ✅ Prompt enhanced");

  // 2B: Project metadata (name, stack, README) — runs in parallel with codegen
  const metadataPromise = generateMetadata(prompt, enhancedPrompt);

  // 3: IA Generation (Junie → fallback a OpenAI Backend)
  console.log("\n🤖 [3/5] Generating code with AI in the Cloud...");
  let codeSource = "Junie";
  
  if (!runJunie(enhancedPrompt, projectPath)) {
    console.log("   ⚠ Junie CLI not available in this OS environment.");
    console.log("   → Seamlessly passing generation task to OpenAI Cloud (100% AI, non-hardcoded)...");
    await generateCodeWithOpenAI(enhancedPrompt, projectPath);
    codeSource = "OpenAI Cloud Generator";
  }
  console.log(`   ✅ Original AI code successfully applied to project (${codeSource})`);

  // 3B: Wait for metadata, then write README.md to project root.
  const metadata = await metadataPromise;
  writeReadme(projectPath, metadata.readme);
  console.log(`   ✅ README written (project: "${metadata.name}", stack: "${metadata.stack}")`);

  // 4: Build
  console.log("\n📦 [4/5] Building project...");
  buildProject(projectPath);
  console.log("   ✅ Build successful");

  // 5: Deploy
  console.log("\n🌐 [5/5] Deploying preview...");
  const previewUrl = await deployPreview(projectPath, taskId);
  console.log(`   ✅ Preview live at ${previewUrl}`);

  // 5B: Snapshot final file tree with created/modified status (excludes node_modules + dist)
  const files = diffProjectFiles(projectPath, baselineHashes);
  const modifiedCount = files.filter((f) => f.status === "modified").length;
  console.log(`   ✅ File tree captured (${files.length} files, ${modifiedCount} modified)`);

  console.log("\n══════════════════════════════════════════════════");
  console.log(`  ✅ DONE — Task ${taskId}`);
  console.log(`  📂 projectPath: ${projectPath}`);
  console.log(`  🌐 previewUrl:  ${previewUrl}`);
  console.log(`  🏷  name:        ${metadata.name}`);
  console.log(`  🧱 stack:       ${metadata.stack}`);
  console.log("══════════════════════════════════════════════════\n");

  return {
    projectPath,
    previewUrl,
    name: metadata.name,
    stack: metadata.stack,
    files,
  };
}

function stopPreview(taskId) {
  const server = _previews.get(taskId);
  if (server) {
    server.close();
    _previews.delete(taskId);
  }
}

function stopAllPreviews() {
  for (const [id, server] of _previews) {
    server.close();
  }
  _previews.clear();
}

process.on("SIGINT", () => { stopAllPreviews(); process.exit(0); });
process.on("SIGTERM", () => { stopAllPreviews(); process.exit(0); });

module.exports = { generateProject, stopPreview, stopAllPreviews };
