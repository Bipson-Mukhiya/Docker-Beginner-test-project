import "./App.css"
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useEffect, useMemo, useRef, useState } from "react"
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"

function App() {
  const editorRef = useRef(null)
  const providerRef = useRef(null)
  const bindingRef = useRef(null)

  const initialUsername = new URLSearchParams(window.location.search).get("username") || ""
  const [username, setUsername] = useState(initialUsername)
  const [inputUsername, setInputUsername] = useState(initialUsername)
  const [users, setUsers] = useState([])

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])

  const createProvider = () => {
    if (!username || !editorRef.current || providerRef.current) {
      return
    }

    const provider = new SocketIOProvider("http://localhost:3000", "monaco-demo", ydoc, {
      autoConnect: true,
    })
    providerRef.current = provider

    provider.awareness.setLocalStateField("user", { username })

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values())
      setUsers(states.map((state) => state?.user?.username).filter(Boolean))
    }

    provider.awareness.on("change", updateUsers)
    updateUsers()

    bindingRef.current = new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    )

    const handleBeforeUnload = () => {
      providerRef.current?.awareness.setLocalStateField("user", null)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      provider.awareness.off("change", updateUsers)
      provider.awareness.setLocalStateField("user", null)
      provider.destroy?.()
      providerRef.current = null

      if (bindingRef.current?.destroy) {
        bindingRef.current.destroy()
      }
      bindingRef.current = null
    }
  }

  const handleMount = (editor) => {
    editorRef.current = editor
    createProvider()
  }

  const handleJoin = (e) => {
    e.preventDefault()
    const trimmedUsername = inputUsername.trim()
    if (!trimmedUsername) {
      return
    }

    setUsername(trimmedUsername)
    window.history.pushState(null, null, `?username=${encodeURIComponent(trimmedUsername)}`)
  }

  useEffect(() => {
    createProvider()

    return () => {
      if (providerRef.current) {
        providerRef.current.awareness.setLocalStateField("user", null)
        providerRef.current.destroy?.()
        providerRef.current = null
      }

      if (bindingRef.current?.destroy) {
        bindingRef.current.destroy()
        bindingRef.current = null
      }
    }
  }, [username, ydoc, yText])

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
          <button type="submit" className="p-2 rounded-lg bg-blue-50 text-gray-950 font-bold">
            Join
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="h-screen w-full bg-gray-950 flex gap-4 p-4">
      <aside className="h-screen w-1/4 bg-gray-800 rounded-lg p-4">
        <h2 className="text-white text-xl font-bold mb-4">Users</h2>
        <ul className="text-white">
          {users.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </aside>
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
