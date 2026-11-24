// `npm run dev`: one command for development.
//   1. Starts Vite, which serves the frontend and live-reloads it on save.
//   2. Rebuilds the backend whenever a backend/ or shared/ file changes.
//   3. Starts Electron, and restarts it after each backend rebuild.
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createServer } from 'vite'
import { watchBackend } from './build-backend.mjs'

const require = createRequire(import.meta.url)
const electronPath = require('electron') // the electron package exports its binary path

const vite = await createServer({ configFile: 'vite.config.mts' })
await vite.listen()
const url = vite.resolvedUrls.local[0]
console.log(`[dev] frontend at ${url}`)

let electron = null
let restarting = false

function startElectron() {
  electron = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    env: { ...process.env, VITE_DEV_SERVER_URL: url },
  })
  electron.on('exit', () => {
    if (restarting) return
    // The window was closed by the user: stop everything.
    void shutdown()
  })
}

function restartElectron() {
  if (!electron) return startElectron()
  restarting = true
  electron.once('exit', () => { restarting = false; startElectron() })
  electron.kill()
}

const backend = await watchBackend(restartElectron)
await backend.watch()

async function shutdown() {
  await backend.dispose()
  await vite.close()
  process.exit(0)
}
process.on('SIGINT', () => { if (electron) electron.kill(); void shutdown() })
