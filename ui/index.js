const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#0e0e0e',
        show: false
    })

    win.loadFile('index.html')
    
    win.once('ready-to-show', () => {
        win.show()
    })
}

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('run-python', async (event, command, args) => {
    return new Promise((resolve, reject) => {
        const process = spawn('python3', [
            path.join(__dirname, '..', 'snapshot.py'),
            command,
            ...args
        ])
        let output = ''
        process.stdout.on('data', (data) => { output += data.toString() })
        process.on('close', () => resolve(output.trim()))
    })
})

ipcMain.handle('get-config', () => {
    const configPath = path.join(__dirname, '..', 'config.json')
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  })

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})