// Starts the app (like Application.java in Spring Boot): registers the
// controllers, then opens the window.
import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import { registerAppController } from './controllers/appController'

// Set by scripts/dev.mjs while developing; absent in a normal build.
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    backgroundColor: '#0e0e0e',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // page and preload can't touch each other's variables
      nodeIntegration: false, // page gets no Node.js
      sandbox: true,          // page runs with the browser's own restrictions
    },
  })

  // Links to websites open in the real browser, never inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (DEV_SERVER_URL) {
    void win.loadURL(DEV_SERVER_URL)
  } else {
    void win.loadFile(path.join(__dirname, '..', 'frontend', 'index.html'))
  }
  win.once('ready-to-show', () => win.show())
}

app.whenReady().then(() => {
  registerAppController()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
