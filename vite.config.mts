import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// In the built app, only the app's own files may run or load (Content Security
// Policy). Left out while developing, because live reload needs inline scripts.
const contentSecurityPolicy: Plugin = {
  name: 'respawn-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(
      '<head>',
      `<head>\n    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self'">`,
    ),
}

export default defineConfig({
  root: 'frontend',
  base: './', // the built app loads from a file, so paths must be relative
  plugins: [react(), tailwindcss(), contentSecurityPolicy],
  build: {
    outDir: '../dist/frontend',
    emptyOutDir: true,
  },
  server: { port: 5173, strictPort: true },
})
