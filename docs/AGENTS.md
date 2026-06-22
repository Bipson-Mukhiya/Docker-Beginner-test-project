# docker-beginner-aws-project

Real-time collaborative code editor. Frontend: React 19 + Vite 8 + Tailwind v4 + Monaco Editor. Backend: Express + Socket.IO + Yjs (CRDT).

## Structure

| Directory | Role | Dev command | Port |
|-----------|------|-------------|------|
| `Backend/` | Express + Socket.IO + y-socket.io server | `npm run dev` (nodemon) | 3000 |
| `Frontend/` | React SPA with Monaco Editor, Yjs sync | `npm run dev` (vite) | Vite default (5173) |

Both packages use ESM (`"type": "module"`).

## Quick start

```sh
# Terminal 1 - Backend
cd Backend && npm install && npm run dev

# Terminal 2 - Frontend
cd Frontend && npm install && npm run dev
```

Open `http://localhost:5173/?username=yourname` in a browser.

## Commands

**Backend** (`Backend/package.json`):
- `npm run dev` — nodemon auto-restart
- `npm start` — plain node
- `npm test` — stub (always fails)

**Frontend** (`Frontend/package.json`):
- `npm run dev` — vite dev server
- `npm run build` — vite build
- `npm run lint` — ESLint (js/jsx files, ignores dist)
- `npm run preview` — vite preview (serve built output)

## Architecture

- **Backend** (`Backend/server.js`): Express HTTP health endpoints (`/`, `/health`) + Socket.IO with y-socket.io for Yjs document broadcast. CORS open to all origins.
- **Frontend** (`Frontend/src/app/App.jsx`): Main component renders a username prompt or the editor UI. Sets up a `Y.Doc` synced via `SocketIOProvider` → `http://localhost:3000`. Uses `y-monaco` `MonacoBinding` to bind Yjs text to Monaco editor. User awareness (connected users list) from `provider.awareness`.
- No tests, no Dockerfile, no docker-compose, no CI. The project name is aspirational — there is no AWS or Docker config.

## Framework quirks

- **Tailwind v4**: configured via the Vite plugin (`@tailwindcss/vite` in `vite.config.js`), no `tailwind.config.js` or `postcss.config.js`.
- **Vite 8 beta**: pinned via `overrides` in `Frontend/package.json`.
- No TypeScript — plain JSX.
- Frontend hardcodes `http://localhost:3000` for the backend Socket.IO connection.
- Monaco Editor loaded from CDN by `@monaco-editor/react`; no bundle inclusion.
