const { contextBridge } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

// Path to your Python scripts
const PYTHON_PATH = 'python3'
const SCRIPTS_PATH = path.join(__dirname, '..') 

function runPython(script, args = []) {
    return new Promise((resolve, reject) => {
        const process = spawn(PYTHON_PATH, [
            path.join(SCRIPTS_PATH, script),
            ...args
        ])

        let output = ''
        let error = ''

        process.stdout.on('data', (data) => {
            output += data.toString()
        })

        process.stderr.on('data', (data) => {
            error += data.toString()
        })

        process.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim())
            } else {
                reject(error)
            }
        })
    })
}

// Expose Python functions to the frontend
contextBridge.exposeInMainWorld('respawn', {
    takeSnapshot: (folderPath) => runPython('snapshot.py', ['create', folderPath]),
    restoreSnapshot: (snapshotName, folderPath) => runPython('snapshot.py', ['restore', snapshotName, folderPath]),
    listSnapshots: () => runPython('snapshot.py', ['list']),
    deleteSnapshot: (snapshotName) => runPython('snapshot.py', ['delete', snapshotName])
})