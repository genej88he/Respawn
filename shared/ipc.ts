// The contract between frontend/ and backend/.
//
// Every action the screen is allowed to ask the backend for is listed here,
// once. Both sides import these types, so if one side changes a name or a
// field, TypeScript stops the build until the other side matches.

/** Channel names: the "addresses" IPC messages are sent to. */
export const IPC = {
  appInfo: 'app:info',
  appPing: 'app:ping',
} as const

/** What every backend action sends back. Errors travel as data, so they reach the screen. */
export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string }

export interface AppInfo {
  version: string
  platform: string
  electronVersion: string
  nodeVersion: string
  dataFolder: string
}

/**
 * The API the preload script puts on `window.respawn`.
 * This is the screen's whole "menu": nothing else on the computer is reachable.
 */
export interface RespawnApi {
  app: {
    info(): Promise<AppInfo>
    ping(message: string): Promise<string>
  }
}
