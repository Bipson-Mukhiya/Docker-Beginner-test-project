// ─── Application Entry Point ─────────────────────────────────────────────────
// React 19 StrictMode is enabled, which double-invokes effects in development
// (useEffect runs twice). This is intentional and only happens in dev mode.
// ─────────────────────────────────────────────────────────────────────────────

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
