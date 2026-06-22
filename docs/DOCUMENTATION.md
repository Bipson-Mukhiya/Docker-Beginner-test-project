# Docker Beginner AWS Project — Documentation

> **Note**: This project is named "docker-beginner-aws-project" for aspirational purposes. It currently contains **no Docker, no AWS, and no CI/CD configuration**. It is a real-time collaborative code editor.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Backend](#backend)
   - [Architecture](#backend-architecture)
   - [Endpoints](#endpoints)
   - [Real-Time Sync (Yjs + Socket.IO)](#yjs-sync)
6. [Frontend](#frontend)
   - [Architecture](#frontend-architecture)
   - [Component Tree](#component-tree)
   - [Yjs Integration](#yjs-integration)
   - [Styling](#styling)
7. [Development Workflow](#development-workflow)
8. [Known Quirks](#known-quirks)

---

## Overview <a name="overview"></a>

This project is a **real-time collaborative code editor** similar in spirit to Google Docs but for code. Multiple users can open the same editor URL, see each other's cursors and selections, and edit a shared document simultaneously.

The collaborative editing is powered by [Yjs](https://yjs.dev), a CRDT (Conflict-free Replicated Data Type) library that enables real-time peer-to-peer data synchronization without a central conflict resolution server. A central server is used only to relay messages — all conflict resolution happens client-side.

---

## Tech Stack <a name="tech-stack"></a>

### Backend (`Backend/`)

| Tech | Version | Purpose |
|------|---------|---------|
| Node.js | (runtime) | JavaScript runtime |
| Express | ^5.2.1 | HTTP server and routing |
| Socket.IO | ^4.8.3 | WebSocket transport for real-time communication |
| y-socket.io | ^1.1.3 | Yjs networking provider over Socket.IO |
| nodemon | (dev dep) | Auto-restart on file changes |

### Frontend (`Frontend/`)

| Tech | Version | Purpose |
|------|---------|---------|
| React | ^19.2.0 | UI framework |
| Vite | ^8.0.0-beta.13 | Build tool and dev server |
| Tailwind CSS | ^4.3.0 | Utility-first CSS framework |
| Monaco Editor | (via react lib) | Code editor (VS Code core) |
| Yjs | ^13.6.30 | CRDT library for collaborative editing |
| y-monaco | ^0.1.6 | Bind Yjs text type to Monaco Editor |
| y-socket.io | ^1.1.3 | Yjs networking provider for the client |

---

## Project Structure <a name="project-structure"></a>

```
docker-beginner-aws-project/
├── AGENTS.md                     # AI assistant instructions (moved to docs/)
├── docs/
│   ├── AGENTS.md                 # AI assistant instructions
│   └── DOCUMENTATION.md          # This file
├── Backend/
│   ├── package.json              # Backend dependencies and scripts
│   ├── package-lock.json         # Lockfile
│   ├── server.js                 # Express + Socket.IO + y-socket.io server
│   └── node_modules/             # Dependencies (gitignored)
├── Frontend/
│   ├── .gitignore
│   ├── index.html                # SPA entry point
│   ├── eslint.config.js          # ESLint flat config
│   ├── vite.config.js            # Vite config with React + Tailwind plugins
│   ├── package.json              # Frontend dependencies and scripts
│   ├── package-lock.json         # Lockfile
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── main.jsx              # React entry point
│   │   └── app/
│   │       ├── App.jsx           # Main application component
│   │       └── App.css           # Global styles (used alongside Tailwind)
│   ├── dist/                     # Production build (gitignored)
│   └── node_modules/             # Dependencies (gitignored)
```

---

## Getting Started <a name="getting-started"></a>

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

### Installation

```sh
# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install
```

### Running in Development

The backend and frontend must run **simultaneously** in two separate terminals.

```sh
# Terminal 1 — Backend (port 3000)
cd Backend
npm run dev
```

```sh
# Terminal 2 — Frontend (port 5173 by default)
cd Frontend
npm run dev
```

### Usage

1. Open `http://localhost:5173/?username=YourName` in a browser.
2. The app will ask for a username if one is not provided via the URL.
3. Open the same URL in another browser/tab to see collaborative editing in action.
4. Each user's cursor position and selections are visible to all connected users.
5. A sidebar lists all currently connected users.

### Building for Production

```sh
cd Frontend
npm run build
```

Output goes to `Frontend/dist/`. Serve it with any static file server.

```sh
npm run preview   # Vite's built-in preview server
```

---

## Backend <a name="backend"></a>

### Architecture <a name="backend-architecture"></a>

```
Client (Browser)
    │
    ├──► HTTP (Express) ──► GET /, /health
    │
    └──► WebSocket (Socket.IO)
            │
            └──► y-socket.io (Yjs provider)
                    │
                    └──► Yjs Document Store
```

The backend is deliberately minimal:
- **Express** serves two health-check endpoints.
- **Socket.IO** manages WebSocket connections from clients.
- **y-socket.io** transparently handles Yjs document synchronization over the Socket.IO connection. When a client connects, the server relays Yjs update messages between clients. No persistent storage — documents exist only in memory. When all clients disconnect, the document state is lost.

### Endpoints <a name="endpoints"></a>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Welcome message (`{ message: "Hello World!", success: true }`) |
| GET | `/health` | Health check (`{ message: "ok", success: true }`) |

### Yjs Sync <a name="yjs-sync"></a>

The server uses `YSocketIO` from `y-socket.io/dist/server`:

```js
import { YSocketIO } from 'y-socket.io/dist/server'

const ySocketIO = new YSocketIO(io)
ySocketIO.initialize()
```

This creates a room-per-document model. Clients connecting with the same room name (e.g., `"monaco-demo"`) share a single Yjs document.

---

## Frontend <a name="frontend"></a>

### Architecture <a name="frontend-architecture"></a>

```
main.jsx
  └── App.jsx
        ├── Username Prompt (when no username set)
        └── Editor UI (when username is set)
              ├── Sidebar (connected users list)
              └── Monaco Editor (collaborative code editor)
```

### Component Tree <a name="component-tree"></a>

#### `main.jsx`

The React entry point. Renders `<App />` inside `<StrictMode>` (React 19 dev-mode double-invocation — effects run twice intentionally).

#### `App.jsx`

The single-page application component. It has two modes:

**1. Username Prompt** (rendered when `username === ""`)
- A centered form with a text input and a "Join" button.
- The username is stored in React state and reflected in the URL query parameter `?username=` (via `pushState`).

**2. Editor UI** (rendered when `username` is set)
- **Sidebar** (left, 25% width): Lists all connected users. The list is derived from the Yjs awareness protocol — each client broadcasts their username to all peers.
- **Editor area** (right, 75% width): A Monaco Editor instance configured with a dark theme, JavaScript language mode, and Yjs collaborative binding.

### Yjs Integration <a name="yjs-integration"></a>

The collaboration setup happens in the `createProvider` function and the `useEffect`:

```
Y.Doc ──► yText (Y.Text type, "monaco")
  │
  ├──► SocketIOProvider ──► localhost:3000 (relays Yjs updates)
  │
  └──► MonacoBinding ──► Monaco Editor model (bidirectional sync)
```

**Key flow:**
1. A `Y.Doc` is created with `useMemo` (stable across renders).
2. A text type `yText = ydoc.getText("monaco")` is used as the shared content.
3. `SocketIOProvider` connects to the backend (`http://localhost:3000`) in room `"monaco-demo"`.
4. The provider's `awareness` API sets the local user's username.
5. `MonacoBinding` bridges `yText` and the Monaco editor's model — any change in the editor is translated to Yjs operations and vice versa.
6. Cleanup: On unmount or username change, the provider is destroyed and awareness state is cleared.

**Awareness (Connected Users):**
```js
provider.awareness.getStates()   // Map of all connected clients' states
provider.awareness.setLocalStateField("user", { username })
provider.awareness.on("change", updateUsers)
```

### Styling <a name="styling"></a>

- **Tailwind CSS v4** — configured via the `@tailwindcss/vite` Vite plugin (no `tailwind.config.js` or `postcss.config.js` needed).
- **App.css** — exists for any custom CSS not covered by Tailwind.
- The UI uses a dark color scheme (`bg-gray-950`, `bg-gray-800`, `bg-gray-700`).

---

## Development Workflow <a name="development-workflow"></a>

### Backend

```sh
npm run dev     # Start with nodemon (auto-restart on .js changes)
npm start       # Start without auto-restart
```

### Frontend

```sh
npm run dev      # Vite dev server with HMR
npm run build    # Production build
npm run lint     # ESLint check (flat config, js/jsx files, ignores dist/)
npm run preview  # Preview production build
```

### Linting

ESLint 9 flat config (`eslint.config.js`) with:
- `@eslint/js` recommended rules
- `eslint-plugin-react-hooks` recommended rules
- `eslint-plugin-react-refresh` Vite rules
- Ignores `dist/`
- `no-unused-vars` error with `varsIgnorePattern: '^[A-Z_]'`

---

## Known Quirks <a name="known-quirks"></a>

| Quirk | Details |
|-------|---------|
| **Project name mismatch** | Named "docker-beginner-aws-project" but has no Docker, AWS, or CI setup. |
| **Vite 8 beta** | Pinned via `overrides` in `Frontend/package.json`. May have breaking changes. |
| **Tailwind v4 config** | Uses `@tailwindcss/vite` plugin — no `tailwind.config.js` or `postcss.config.js`. |
| **No TypeScript** | All code is plain JSX/JS. |
| **Hardcoded backend URL** | Frontend connects to `http://localhost:3000` — change in `App.jsx` for other environments. |
| **No persistence** | Yjs document exists only in memory. Restarting the server loses all content. |
| **Monaco via CDN** | `@monaco-editor/react` loads Monaco from CDN, not bundled. Requires internet access. |
| **No tests** | The `npm test` script is a placeholder that always exits with code 1. |
| **React 19 StrictMode** | Effects run twice in development — this is expected React 19 behavior. |
