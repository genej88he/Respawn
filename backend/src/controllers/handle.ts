// Shared plumbing for every controller.
//
// `handle` registers one IPC action. It runs the handler and always sends back
// an IpcResult: { ok: true, data } on success, { ok: false, error } on failure.
// So an error in any service reaches the screen as a readable message instead
// of being lost (the problem the old run-python handler had).
import { ipcMain } from 'electron'
import type { IpcResult } from '../../../shared/ipc'

/** An error whose message is safe and useful to show the user. */
export class UserError extends Error {}

export function handle<Args extends unknown[], T>(
  channel: string,
  handler: (...args: Args) => T | Promise<T>,
): void {
  ipcMain.handle(channel, async (_event, ...args: unknown[]): Promise<IpcResult<T>> => {
    try {
      return { ok: true, data: await handler(...(args as Args)) }
    } catch (err) {
      console.error(`[ipc] ${channel} failed:`, err)
      const message = err instanceof UserError ? err.message : 'Something went wrong. Details are in the app log.'
      return { ok: false, error: message }
    }
  })
}

/** Input from the screen is untrusted: check it before a service sees it. */
export function requireString(value: unknown, name: string, maxLength = 1000): string {
  if (typeof value !== 'string') throw new UserError(`${name} must be text.`)
  if (value.length > maxLength) throw new UserError(`${name} is too long (max ${maxLength} characters).`)
  return value
}
