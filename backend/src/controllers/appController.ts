// Controller layer (like a Spring @RestController): receives IPC messages,
// checks the input, and calls a service. No real work happens here.
import { IPC } from '../../../shared/ipc'
import { getAppInfo, ping } from '../services/appService'
import { handle, requireString } from './handle'

export function registerAppController(): void {
  handle(IPC.appInfo, () => getAppInfo())
  handle(IPC.appPing, (message: unknown) => ping(requireString(message, 'Message', 200)))
}
