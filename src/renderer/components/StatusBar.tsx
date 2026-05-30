import React from 'react'

type Status = 'idle' | 'saving' | 'done'

interface Props {
  status: Status
  lastClip: string | null
  recentClips: string[]
  onOpenFolder: () => void
}

export default function StatusBar(
  { status, lastClip, recentClips, onOpenFolder }: Props
) {
  const labels: Record<Status, string> = {
    idle: 'Recording buffer...',
    saving: 'Saving clip...',
    done: lastClip
      ? `Clip saved — ${lastClip}`
      : 'Clip saved'
  }

  return (
    <div className="status-bar">
      <div className="status-line">
        <div className={`dot ${status}`} />
        <span>{labels[status]}</span>
      </div>

      {recentClips.length > 0 && (
        <div className="recent-clips">
          {recentClips.map((c, i) => (
            <div key={i} className="clip-pill"
              title={c}
              onClick={() => {
                ;(window as any).clipcut
                  .openClipsFolder()
              }}>
              {c.split('\\').pop()?.slice(-16)}
            </div>
          ))}
        </div>
      )}

      <button
        className="folder-btn"
        onClick={onOpenFolder}
      >
        Open clips folder →
      </button>
    </div>
  )
}
