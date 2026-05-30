import * as path from 'path'
import { app } from 'electron'

const KEY_CODES: Record<string, number> = {
  'F1': 0x70, 'F2': 0x71, 'F3': 0x72, 'F4': 0x73,
  'F5': 0x74, 'F6': 0x75, 'F7': 0x76, 'F8': 0x77,
  'F9': 0x78, 'F10': 0x79, 'F11': 0x7A, 'F12': 0x7B,
  'Home': 0x24, 'End': 0x23, 'Insert': 0x2D,
  'Delete': 0x2E, 'PageUp': 0x21, 'PageDown': 0x22,
  'Pause': 0x13, 'ScrollLock': 0x91,
}

function getAddonPath(): string {
  return app.isPackaged
    ? path.join(
        process.resourcesPath,
        'hotkey_hook.node'
      )
    : path.join(
        __dirname,
        '../../resources/hotkey_hook.node'
      )
}

let addon: any = null

function loadAddon(): any {
  if (!addon) addon = require(getAddonPath())
  return addon
}

export function registerHotkey(
  keyName: string,
  callback: () => void
): void {
  const code = KEY_CODES[keyName] ?? 0x78
  loadAddon().registerHotkey(code, callback)
}

export function unregisterHotkey(): void {
  if (addon) addon.unregisterHotkey()
}