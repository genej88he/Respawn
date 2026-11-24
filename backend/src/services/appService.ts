// Service layer (like a Spring @Service): the actual work, with no IPC details.
import { app } from 'electron'
import type { AppInfo } from '../../../shared/ipc'

export function getAppInfo(): AppInfo {
  return {
    version: app.getVersion(),
    platform: process.platform,
    electronVersion: process.versions.electron ?? 'unknown',
    nodeVersion: process.versions.node,
    dataFolder: app.getPath('userData'),
  }
}

export function ping(message: string): string {
  return `pong: ${message}`
}
