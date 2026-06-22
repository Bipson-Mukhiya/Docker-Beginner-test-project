// ─── Backend Server ─────────────────────────────────────────────────────────
// Express + Socket.IO + y-socket.io server for real-time collaborative editing.
// Clients connect via WebSocket (Socket.IO) and share Yjs documents through the
// y-socket.io provider. The server relays Yjs update messages between clients.
// No persistence — documents exist only in memory while at least one client
// is connected.
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { YSocketIO } from 'y-socket.io/dist/server'

const app = express()
const httpServer = createServer(app)

// ── Socket.IO server with open CORS (all origins, GET + POST) ────────────
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

// ── Yjs document sync over Socket.IO ─────────────────────────────────────
// y-socket.io creates a room-per-document model. Clients connecting with
// the same room name share a single Yjs document.
const ySocketIO = new YSocketIO(io)
ySocketIO.initialize()

// ── HTTP health endpoints ────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Hello World!', success: true })
})

app.get('/health', (_req, res) => {
  res.status(200).json({ message: 'ok', success: true })
})

// ── Start server ─────────────────────────────────────────────────────────
httpServer.listen(3000, () => {
  console.log('Server is running on port 3000')
})
