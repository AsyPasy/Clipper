import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('clipcut', {
  getConfig: () =>
    ipcRenderer.invoke('get-config'),
  setConfig: (partial: object) =>
    ipcRenderer.invoke('set-config', partial),
  openClipsFolder: () =>
    ipcRenderer.invoke('open-clips-folder'),
  saveClipNow: () =>
    ipcRenderer.invoke('save-clip-now'),
  rebindHotkey: (key: string) =>
    ipcRenderer.invoke('rebind-hotkey', key),
  onClipSaved: (cb: (file: string) => void) =>
    ipcRenderer.on('clip-saved', cb)
})
