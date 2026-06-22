// ─── Vite Configuration ──────────────────────────────────────────────────────
// Uses @vitejs/plugin-react for React Fast Refresh and @tailwindcss/vite for
// Tailwind CSS v4 (no tailwind.config.js or postcss.config.js needed).
// ─────────────────────────────────────────────────────────────────────────────

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
