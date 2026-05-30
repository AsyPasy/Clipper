import { ipcMain, shell } from 'electron'
import { loadConfig, updateConfig } from './config'
import { saveClip } from './capture'
import { registerHotkey } from './hotkey'

let onClipSaved: ((filePath: string) => void) | null = null

export function setClipSavedCallback(
  cb: (filePath: string) => void
): void {
  onClipSaved = cb
}

export function registerIpcHandlers(): void {

  ipcMain.handle('get-config', () => {
    return loadConfig()
  })

  ipcMain.handle('set-config', (_, partial) => {
    return updateConfig(partial)
  })

  ipcMain.handle('open-clips-folder', () => {
    const cfg = loadConfig()
    shell.openPath(cfg.outputPath)
  })

  ipcMain.handle('save-clip-now', async () => {
    const cfg = loadConfig()
    try {
      const file = await saveClip(
        cfg.clipDuration,
        cfg.outputPath
      )
      if (onClipSaved) onClipSaved(file)
      return { success: true, file }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('rebind-hotkey', (_, keyName: string) => {
    const cfg = updateConfig({ hotkey: keyName })
    registerHotkey(keyName, () => {
      ipcMain.emit('trigger-clip')
    })
    return cfg
  })
}
