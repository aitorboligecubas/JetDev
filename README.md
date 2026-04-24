# ☁️ JetDev — A New Screen Inside YouTrack Mobile

> A new tab integrated into the **JetBrains YouTrack mobile app** that lets any user describe an idea in plain language, generates the full project with **Junie AI**, deploys it on **AWS**, and pushes it to **GitHub** — all without leaving YouTrack.

---

## 🧠 The Problem

YouTrack is where developers manage their work — but when it's time to actually *build* something, they have to leave the app, set up a local environment, install dependencies, configure cloud services, and create repos manually.

**JetDev closes that gap.** From the same app where you track your issues, you can now spin up a fully working project in the cloud with a single description.

---

## 💡 What It Does

1. **Open** the new "JetDev" tab inside YouTrack mobile
2. **Describe** what you want to build in plain language (guided conversation)
3. **Junie AI** generates the full scaffolded project — all compute happens in the cloud, zero local resources used
4. **AWS** deploys the app remotely and streams a live visual preview back to the mobile screen
5. **You review** the running result directly inside the app — no install, no local server, just a visual preview rendered on-device
6. **Accept or Discard** the result:
   - *New project* → Accept creates the GitHub repo + initial commit / Discard destroys the environment with no trace
   - *Existing project* → Accept commits only the new changes to the existing repo / Discard rolls back to the previous state, nothing is overwritten

---

## 📱 UI Approach — Inside YouTrack Mobile

The interface replicates YouTrack's existing mobile design language [web:53][web:56]:

- **Navigation**: Follows YouTrack's left-hand vertical panel pattern, adapted for mobile bottom tab bar
- **New tab added**: A "☁️ Dev" tab appears alongside Issues, Boards, and Articles
- **Design fidelity**: Colors, typography, card components, and interaction patterns mirror the current YouTrack 2025/2026 design system
- **New screen flow**:

```
[ YouTrack Bottom Nav ]
Issues | Boards | Articles | ☁️ Dev  ← NEW TAB

──────────────────────────────────────
☁️ JetDev

"What do you want to build?"

┌─────────────────────────────────────┐
│  💬 Guided conversation             │
│  "A REST API for restaurant         │
│   reservations with auth"           │
└─────────────────────────────────────┘

[ 🚀 Generate & Deploy ]

──────────────────────────────────────
PROGRESS (real-time)

🧠 Understanding your idea...        ✅
⚙️  Junie generating project...      ✅
☁️  Deploying to AWS...              ⏳
🐙 Pushing to GitHub...              ○

──────────────────────────────────────
RESULT — Live Preview (rendered in-app, no local resources)

┌─────────────────────────────────────┐
│  🌐 Preview running on AWS          │
│  [ App rendered here as WebView ]   │
│                                     │
│  Stack: Node.js + Express + PgSQL   │
│  📋 Next steps: Add payment, DB     │
└─────────────────────────────────────┘

  [ ✅ Accept & Push to GitHub ]
  [ ❌ Discard & Destroy Environment ]
```

---

## 🏗️ Architecture

```
📱 YouTrack Mobile App
   └── NEW "Dev" Tab (mimics YouTrack UI)
            │
            │  POST /create (prompt)
            ▼
   ⚙️  Backend Server (Node.js + Express)
            │
            ├──▶ OpenAI API
            │    └── Refines and structures the user's prompt
            │
            ├──▶ Junie CLI (headless mode)
            │    └── junie --auth=$KEY "[structured prompt]"
            │        Generates full scaffolded project files
            │
            ├──▶ AWS (EC2 / Elastic Beanstalk)
            │    └── Provisions environment + deploys the app
            │
            └──▶ GitHub API (Octokit)
                 └── Creates repo → commits code → pushes
            │
            │  WebSocket stream (real-time progress to mobile)
            ▼
   📱 YouTrack Mobile — "JetDev" Tab
      🌐 Live WebView preview (app running on AWS, streamed to screen)
      📋 AI-generated next steps roadmap

      User decision:
      ✅ Accept → GitHub repo created + code pushed
      ❌ Discard → AWS environment destroyed, nothing saved
```

---

## 👥 Team & Responsibilities

| Person | Role | Scope |
|--------|------|-------|
| **Aitor** | Frontend / Mobile UI | New "Dev" tab screen inside YouTrack mobile, mirrors existing YouTrack design system, real-time progress UI |
| **Iván** | Backend | Node.js + Express server, WebSocket streaming, orchestration between all services |
| **Toni** | Generation + Deploy | Junie CLI headless wrapper, AWS deployment pipeline, returns live URL |
| **Arnau** | Cloud + GitHub | GitHub API integration (repo creation + push), AWS connection, CI/CD wiring |

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile UI | React Native (mimics YouTrack mobile design) |
| Real-time | WebSocket via Socket.io |
| Backend | Node.js + Express |
| AI Generation | **Junie CLI — JetBrains (headless mode)** |
| NLP Onboarding | OpenAI API (provided by JetBrains challenge) |
| Cloud Execution | AWS EC2 / Elastic Beanstalk |
| Version Control | GitHub API (Octokit) |
| Backend Deploy | Railway / Render (free tier) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- React Native environment set up
- Junie CLI installed:
  ```bash
  curl -fsSL https://junie.jetbrains.com/install.sh | bash
  ```
- AWS account + credentials configured
- GitHub personal access token (`repo` scope)
- OpenAI API key (provided by HackUPC JetBrains challenge)

### Environment Variables

Create a `.env` in `/backend`:

```env
JUNIE_API_KEY=your_junie_key
OPENAI_API_KEY=your_openai_key
GITHUB_TOKEN=your_github_token
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=eu-west-1
PORT=3001
```

### Run the Backend

```bash
cd backend
npm install
npm run dev
```

### Run the Mobile App

```bash
cd mobile
npm install
npx react-native run-android   # or run-ios
```

---

## 📡 API Endpoints

### `POST /create`

**Request:**
```json
{
  "prompt": "I want a REST API for a restaurant reservation system with authentication"
}
```

**WebSocket stream (real-time):**
```
🧠 Understanding your idea...
⚙️  Junie is generating your project...
☁️  Deploying to AWS...
🐙 Pushing to GitHub...
✅ Done!
```

**Final payload (after generation & deploy):**
```json
{
  "status": "preview_ready",
  "previewUrl": "https://my-app.amazonaws.com",
  "jobId": "abc-123",
  "stack": "Node.js + Express + PostgreSQL",
  "nextSteps": [
    "Add payment integration",
    "Set up email notifications",
    "Configure custom domain"
  ]
}
```

> The mobile app renders `previewUrl` in a **WebView** — the user sees the running app without any local compute. All processing is on AWS.

**On user action:**

`POST /accept/:jobId`
- **New project** → Creates a new GitHub repo + initial commit + push
- **Existing project** → Commits only the new changes on top of the existing repo

`POST /discard/:jobId`
- **New project** → Destroys the AWS environment, nothing is saved
- **Existing project** → Discards the new changes, repo stays as it was before, environment rolls back

### `GET /status/:jobId`
Returns the current status of a running generation job.

---

## 🎯 JetBrains Challenge Alignment

This project directly addresses the **"Help the Developer"** challenge by JetBrains:

| Judging Criterion | How JetDev addresses it |
|---|---|
| **Implementation & PoC** | Full live demo: describe in YouTrack → live app URL in ~2 min |
| **Innovation & Creativity** | YouTrack has never had a "build from here" capability — this is a new category |
| **UX & Interface** | Native YouTrack design language, zero learning curve for existing users |
| **Technical Features** | Junie CLI headless + WebSocket streaming + AWS + GitHub automation |

**JetBrains tools used:**
- **Junie** — core AI code generation engine (headless/programmatic CLI mode)
- **YouTrack** — host app, design system cloned for the new screen
- **OpenAI API** — provided by JetBrains for the challenge, used for NLP onboarding

---

## 📂 Project Structure

```
jetdev/
├── mobile/                      # React Native app (YouTrack UI clone + new Dev tab)
│   ├── src/
│   │   ├── screens/
│   │   │   ├── IssuesScreen.js      # Existing YouTrack screens (cloned UI)
│   │   │   ├── BoardsScreen.js
│   │   │   └── JetDevScreen.js    # ← NEW SCREEN (our feature)
│   │   ├── components/
│   │   │   ├── ProgressTracker.js   # Real-time generation progress
│   │   │   ├── ResultCard.js        # Live URL + GitHub link display
│   │   │   └── GuidedInput.js       # Conversational onboarding
│   │   └── navigation/
│   │       └── BottomTabNavigator.js  # Adds "Dev" tab to YouTrack nav
│   └── package.json
│
├── backend/                     # Node.js orchestration server
│   ├── src/
│   │   ├── index.js             # Express + Socket.io setup
│   │   ├── junie.js             # Junie CLI headless wrapper
│   │   ├── deploy.js            # AWS deployment logic
│   │   └── github.js            # GitHub API integration
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## 🔮 Future Roadmap

- [ ] Link generated projects directly to YouTrack issues
- [ ] Auto-create YouTrack tasks from Junie's generated roadmap
- [ ] Persistent cloud workspaces per YouTrack project
- [ ] Team collaboration on shared cloud environments
- [ ] Voice input for project description

---

## 🏆 Built at HackUPC 2026

**Team:** Aitor · Iván · Toni · Arnau  
**Challenge:** JetBrains — Help the Developer  
**Event:** HackUPC 2026, Campus Nord UPC, Barcelona

---

*Powered by Junie 🤖 · Integrated into YouTrack 📋 · Built with ❤️ in 36 hours*
