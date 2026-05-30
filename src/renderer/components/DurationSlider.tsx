import React from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
}

export default function DurationSlider(
  { value, onChange }: Props
) {
  return (
    <div className="section">
      <label>Clip duration</label>
      <div className="section-value">
        Save last <strong>{value}s</strong>
      </div>
      <input
        type="range"
        min={5}
        max={120}
        step={5}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        color: '#333',
        fontSize: 10
      }}>
        <span>5s</span>
        <span>30s</span>
        <span>60s</span>
        <span>120s</span>
      </div>
    </div>
  )
}