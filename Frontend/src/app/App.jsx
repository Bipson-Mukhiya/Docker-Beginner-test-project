import "./App.css"
import { Editor } from "@monaco-editor/react"
import {MonacoBinding} from "y-monaco"
import {useRef, useMemo} from "react"
import * as Y from 'yjs'
import {SocketIOProvider} from "y-socket.io"

function App() {

  const editorRef = useRef(null)

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])


  const handleMount = (editor) => {
    editorRef.current = editor
    
      const provider = new SocketIOProvider("http://localhost:3000", "monaco-demo", ydoc,{autoConnect: true})

      const monacoBinding = new MonacoBinding(yText,
    editorRef.current.getModel(),
    new Set([editorRef.current]),
    provider.awareness
  )
  }

 

  return ( 
    <main className="h-screen w-full bg-gray-950 flex gap-4 p-4">
    <aside className="h-screen w-1/4 bg-gray-800 rounded-lg p-4"> 
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
