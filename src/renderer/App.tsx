import React, { useEffect, useState } from 'react'
import DurationSlider from './components/DurationSlider'
import HotkeyBinder from './components/HotkeyBinder'
import StatusBar from './components/StatusBar'

type Status = 'idle' | 'saving' | 'done'

export default function App() {
  const [duration, setDuration] = useState(30)
  const [hotkey, setHotkey] = useState('F9')
  const [status, setStatus] = useState<Status>('idle')
  const [lastClip, setLastClip] = useState<string | null>(null)
  const [recentClips, setRecentClips] = useState<string[]>([])

  useEffect(() => {
    ;(window as any).clipcut.getConfig()
      .then((cfg: any) => {
        setDuration(cfg.clipDuration)
        setHotkey(cfg.hotkey)
      })

    ;(window as any).clipcut.onClipSaved(
      (file: string) => {
        setStatus('done')
        setLastClip(file.split('\\').pop() ?? file)
        setRecentClips(prev =>
          [file, ...prev].slice(0, 3)
        )
        setTimeout(() => setStatus('idle'), 4000)
      }
    )
  }, [])

  function handleDurationChange(v: number) {
    setDuration(v)
    ;(window as any).clipcut
      .setConfig({ clipDuration: v })
  }

  return (
    <>
      <div className="title-bar">
        <h1>ClipCut</h1>
        <button
          className="close-btn"
          onClick={() => window.close()}
        >×</button>
      </div>

      <DurationSlider
        value={duration}
        onChange={handleDurationChange}
      />

      <HotkeyBinder
        value={hotkey}
        onChange={setHotkey}
      />

      <StatusBar
        status={status}
        lastClip={lastClip}
        recentClips={recentClips}
        onOpenFolder={() =>
          (window as any).clipcut.openClipsFolder()
        }
      />
    </>
  )
}
