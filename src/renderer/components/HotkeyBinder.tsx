import React, { useState } from 'react'

interface Props {
  value: string
  onChange: (key: string) => void
}

export default function HotkeyBinder(
  { value, onChange }: Props
) {
  const [listening, setListening] = useState(false)

  function startListening() {
    setListening(true)
    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      const key = e.key
      setListening(false)
      window.removeEventListener('keydown', handler)
      ;(window as any).clipcut
        .rebindHotkey(key)
        .then(() => onChange(key))
    }
    window.addEventListener('keydown', handler)
  }

  return (
    <div className="section">
      <label>Clip hotkey</label>
      <div className="hotkey-row">
        <div className={
          `hotkey-pill ${listening ? 'listening' : ''}`
        }>
          {listening ? '...' : value}
        </div>
        <button
          className="change-btn"
          onClick={startListening}
          disabled={listening}
        >
          {listening ? 'Press a key' : 'Change'}
        </button>
      </div>
    </div>
  )
}