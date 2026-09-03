import './App.css'
import { Editor } from '@monaco-editor/react'
import { MonacoBinding } from 'y-monaco'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as Y from 'yjs'
import { SocketIOProvider } from 'y-socket.io'

// ── Main Application Component ──────────────────────────────────────────────
// Manages the entire UI: username prompt → real-time collaborative editor.
// Uses Yjs (CRDT) + y-socket.io + MonacoBinding for live multi-user editing.
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  // Refs to hold editor, provider, and binding instances across renders
  const editorRef = useRef(null)
  const providerRef = useRef(null)
  const bindingRef = useRef(null)

  // Read username from URL ?username= query parameter, or fall back to empty
  const initialUsername =
    new URLSearchParams(window.location.search).get('username') || ''
  const [username, setUsername] = useState(initialUsername)
  const [inputUsername, setInputUsername] = useState(initialUsername)
  const [users, setUsers] = useState([]) // list of connected usernames

  // Stable Yjs document and shared text type (created once via useMemo)
  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText('monaco'), [ydoc])

  // ── Set up Yjs provider + Monaco binding ────────────────────────────────
  const createProvider = () => {
    // Guard: require a username, the editor to be mounted, and no duplicate provider
    if (!username || !editorRef.current || providerRef.current) {
      return
    }

    const provider = new SocketIOProvider("/", "monaco-demo", ydoc, {
      autoConnect: true,
    })
    providerRef.current = provider

    // Broadcast this user's username to all other connected clients
    provider.awareness.setLocalStateField('user', { username })

    // Subscribe to awareness changes (user join/leave/update)
    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values())
      setUsers(states.map((state) => state?.user?.username).filter(Boolean))
    }
    provider.awareness.on('change', updateUsers)
    updateUsers()

    // Bind the Yjs shared text to the Monaco editor model
    // This enables bidirectional sync: editor edits → Yjs → all peers, and vice versa
    bindingRef.current = new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness,
    )

    // Clean up awareness state when the user navigates away
    const handleBeforeUnload = () => {
      providerRef.current?.awareness.setLocalStateField('user', null)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      provider.awareness.off('change', updateUsers)
      provider.awareness.setLocalStateField('user', null)
      provider.destroy?.()
      providerRef.current = null

      if (bindingRef.current?.destroy) {
        bindingRef.current.destroy()
      }
      bindingRef.current = null
    }
  }

  // ── Monaco editor mount callback ────────────────────────────────────────
  // Called once when the Monaco editor instance is fully initialized.
  const handleMount = (editor) => {
    editorRef.current = editor
    createProvider() // Start the Yjs provider now that the editor is ready
  }

  // ── Username join form handler ──────────────────────────────────────────
  // Stores the username in state and updates the URL query parameter.
  const handleJoin = (e) => {
    e.preventDefault()
    const trimmedUsername = inputUsername.trim()
    if (!trimmedUsername) return

    setUsername(trimmedUsername)
    window.history.pushState(
      null,
      null,
      `?username=${encodeURIComponent(trimmedUsername)}`,
    )
  }

  // ── Re-create provider when the username changes ────────────────────────
  // Effect depends on `username` so switching users tears down and re-creates
  // the entire Yjs connection and Monaco binding.
  useEffect(() => {
    createProvider()

    return () => {
      if (providerRef.current) {
        providerRef.current.awareness.setLocalStateField('user', null)
        providerRef.current.destroy?.()
        providerRef.current = null
      }

      if (bindingRef.current?.destroy) {
        bindingRef.current.destroy()
      }
      bindingRef.current = null
    }
  }, [username, ydoc, yText])

  // ── Render: Username prompt vs. Editor UI ──────────────────────────────
  if (!username) {
    return (
      <main className="h-screen w-full bg-gray-950 flex items-center justify-center gap-4 p-4">
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter your username"
            className="p-2 rounded-lg bg-gray-800 text-white"
            name="username"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-blue-50 text-gray-950 font-bold"
          >
            Join
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="h-screen w-full bg-gray-950 flex gap-4 p-4">
      {/* Connected users sidebar */}
      <aside className="h-screen w-1/4 bg-gray-800 rounded-lg p-4">
        <h2 className="text-white text-xl font-bold mb-4">Users</h2>
        <ul className="text-white">
          {users.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </aside>

      {/* Monaco code editor (collaborative, synced via Yjs) */}
      <section className="h-screen w-3/4 bg-gray-700 rounded-lg p-4 overflow-hidden">
        <Editor
          height="100%"
          language="javascript"
          theme="vs-dark"
          defaultValue="// Write your code here"
          onMount={handleMount}
        />
      </section>
    </main>
  )
}

export default App
