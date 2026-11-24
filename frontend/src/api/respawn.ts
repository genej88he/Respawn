// The frontend's only way to reach the backend (like an axios client in a web app).
// window.respawn is put there by backend/src/preload.ts.
import type { RespawnApi } from '../../../shared/ipc'

declare global {
  interface Window {
    respawn: RespawnApi
  }
}

export const respawn: RespawnApi = window.respawn
