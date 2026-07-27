'use client'

import { Pause, Play, Clock } from 'lucide-react'
import { useTimer } from '../hooks/useTimer'

interface Props {
  totalSeconds: number
  paused: boolean
  onPause: () => void
  onResume: () => void
  formatted: string
  pct: number
}

export function TimerBar({ totalSeconds, paused, onPause, onResume, formatted, pct }: Props) {
  const isLow = pct < 20
  const isCritical = pct < 10

  return (
    <div className="flex items-center gap-3">
      <Clock size={16} className={isCritical ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-gray-500'} />
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-mono text-sm font-semibold w-12 text-right ${isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-700'}`}>
        {formatted}
      </span>
      <button
        onClick={paused ? onResume : onPause}
        className="p-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
        title={paused ? 'Resume' : 'Pause'}
      >
        {paused ? <Play size={14} /> : <Pause size={14} />}
      </button>
    </div>
  )
}
