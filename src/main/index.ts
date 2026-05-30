import {
  app, BrowserWindow, Tray, Menu, nativeImage, ipcMain
} from 'electron'
import * as path from 'path'
import { loadConfig } from './config'
import { startCapture, stopCapture } from './capture'
import { registerHotkey, unregisterHotkey } from './hotkey'
import { registerIpcHandlers, setClipSavedCallback } from './ipc'
import { saveClip } from './capture'

let win: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  win = new BrowserWindow({
    width: 320,
    height: 420,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(
      path.join(__dirname, '../renderer/index.html')
    )
  }
}

function createTray(): void {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, '../../assets/tray-icon.png')
  )
  tray = new Tray(icon.resize({ width: 16 }))
  tray.setToolTip('ClipCut -- Recording')

  const menu = Menu.buildFromTemplate([
    {
      label: 'Open Panel',
      click: () => {
        if (win) {
          win.show()
          win.focus()
        }
      }
    },
    {
      label: 'Open Clips Folder',
      click: () => {
        const { shell } = require('electron')
        shell.openPath(loadConfig().outputPath)
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ])

  tray.setContextMenu(menu)
  tray.on('click', () => {
    if (win) {
      win.isVisible() ? win.hide() : win.show()
    }
  })
}

app.whenReady().then(() => {
  const cfg = loadConfig()
  createWindow()
  createTray()
  registerIpcHandlers()

  startCapture(cfg.audioCapture)

  registerHotkey(cfg.hotkey, async () => {
    const result = await saveClip(
      cfg.clipDuration,
      cfg.outputPath
    )
    win?.webContents.send('clip-saved', result)
  })

  setClipSavedCallback((file) => {
    win?.webContents.send('clip-saved', file)
  })
})

app.on('before-quit', () => {
  unregisterHotkey()
  stopCapture()
})

app.on('window-all-closed', (e: Event) => {
  e.preventDefault()
})