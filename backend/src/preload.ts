// Runs before the screen loads, in a locked-down bridge between the two.
//
// It puts exactly one object on the page, `window.respawn`, with the actions
// listed in shared/ipc.ts. The page gets no Node.js, no file access and no
// raw IPC: only this menu.
import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type IpcResult, type RespawnApi } from '../../shared/ipc'

/** Send one action to the backend; turn an { ok: false } answer back into a thrown Error. */
async function call<T>(channel: string, ...args: unknown[]): Promise<T> {
  const result = (await ipcRenderer.invoke(channel, ...args)) as IpcResult<T>
  if (!result.ok) throw new Error(result.error)
  return result.data
}

const api: RespawnApi = {
  app: {
    info: () => call(IPC.appInfo),
    ping: (message) => call(IPC.appPing, message),
  },
}

contextBridge.exposeInMainWorld('respawn', api)
