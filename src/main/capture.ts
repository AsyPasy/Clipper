import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

let ffmpegProcess: child_process.ChildProcess | null = null
const SEGMENT_DURATION = 5
const MAX_SEGMENTS = 24

function getFfmpegPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe')
    : path.join(__dirname, '../../resources/ffmpeg/ffmpeg.exe')
}

function getTempDir(): string {
  const dir = path.join(app.getPath('temp'), 'ClipCut')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function detectGpuEncoder(): string {
  const encoders = [
    'h264_nvenc',
    'h264_amf',
    'h264_qsv',
    'libx264'
  ]
  for (const enc of encoders) {
    try {
      const result = child_process.execSync(
        `\"${getFfmpegPath()}\" -encoders 2>&1`,
        { encoding: 'utf8' }
      )
      if (result.includes(enc)) return enc
    } catch {}
  }
  return 'libx264'
}

export function startCapture(
  audioEnabled: boolean
): void {
  if (ffmpegProcess) return

  const tempDir = getTempDir()
  const segPattern = path.join(tempDir, 'seg%03d.ts')
  const encoder = detectGpuEncoder()

  const args = [
    '-f', 'gdigrab',
    '-framerate', '60',
    '-video_size', '1920x1080',
    '-i', 'desktop',
    ...(audioEnabled ? [
      '-f', 'dshow',
      '-i', 'audio=virtual-audio-capturer'
    ] : []),
    '-vcodec', encoder,
    '-preset', encoder === 'libx264' ? 'fast' : 'p4',
    '-b:v', '8M',
    '-acodec', 'aac',
    '-b:a', '192k',
    '-f', 'segment',
    '-segment_time', String(SEGMENT_DURATION),
    '-segment_wrap', String(MAX_SEGMENTS),
    '-reset_timestamps', '1',
    segPattern
  ]

  ffmpegProcess = child_process.spawn(
    getFfmpegPath(), args,
    { stdio: 'ignore', detached: false }
  )
}

export function stopCapture(): void {
  if (ffmpegProcess) {
    ffmpegProcess.kill('SIGTERM')
    ffmpegProcess = null
  }
}

export async function saveClip(
  durationSeconds: number,
  outputDir: string
): Promise<string> {
  const tempDir = getTempDir()
  const ffmpeg = getFfmpegPath()

  const files = fs.readdirSync(tempDir)
    .filter(f => f.endsWith('.ts'))
    .map(f => ({
      name: f,
      time: fs.statSync(
        path.join(tempDir, f)
      ).mtimeMs
    }))
    .sort((a, b) => b.time - a.time)

  const segmentsNeeded = Math.ceil(
    durationSeconds / SEGMENT_DURATION
  ) + 1
  const selected = files
    .slice(0, segmentsNeeded)
    .reverse()

  const listPath = path.join(tempDir, 'concat.txt')
  const listContent = selected
    .map(f => `file '${path.join(tempDir, f.name)}'`)
    .join('\n')
  fs.writeFileSync(listPath, listContent)

  fs.mkdirSync(outputDir, { recursive: true })
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19)
  const outFile = path.join(
    outputDir,
    `ClipCut_${timestamp}.mp4`
  )

  await new Promise<void>((resolve, reject) => {
    const proc = child_process.spawn(ffmpeg, [
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-sseof', String(-durationSeconds),
      '-vcodec', 'copy',
      '-acodec', 'copy',
      outFile
    ])
    proc.on('close', code => {
      code === 0 ? resolve() : reject(
        new Error(`ffmpeg exited with code ${code}`)
      )
    })
  })

  return outFile
}