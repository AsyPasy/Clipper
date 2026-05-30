import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

export interface Config {
  clipDuration: number
  hotkey: string
  outputPath: string
  codec: string
  audioCapture: boolean
  startWithWindows: boolean
}

const defaults: Config = {
  clipDuration: 30,
  hotkey: 'F9',
  outputPath: path.join(
    app.getPath('home'), 'Videos', 'ClipCut'
  ),
  codec: 'h264',
  audioCapture: true,
  startWithWindows: false
}

function getConfigPath(): string {
  const dir = app.getPath('appData')
  return path.join(dir, 'ClipCut', 'config.json')
}

export function loadConfig(): Config {
  const p = getConfigPath()
  if (!fs.existsSync(p)) return { ...defaults }
  try {
    const raw = fs.readFileSync(p, 'utf-8')
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

export function saveConfig(cfg: Config): void {
  const p = getConfigPath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(cfg, null, 2))
}

export function updateConfig(
  partial: Partial<Config>
): Config {
  const current = loadConfig()
  const updated = { ...current, ...partial }
  saveConfig(updated)
  return updated
}