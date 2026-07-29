'use client'

import type { OptionId } from '../lib/types'

interface Props {
  id: OptionId
  text: string
  selected: boolean
  correct?: boolean
  revealed: boolean
  isCorrectAnswer: boolean
  type: 'single' | 'multi'
  onClick: (id: OptionId) => void
  disabled?: boolean
}

export function OptionButton({ id, text, selected, revealed, isCorrectAnswer, type, onClick, disabled }: Props) {
  let rowClass = 'w-full text-left px-4 py-3.5 rounded-lg border transition-all duration-150 flex items-start gap-3.5 text-sm leading-relaxed'
  let letterClass = 'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors mt-0.5'

  if (revealed) {
    if (isCorrectAnswer) {
      rowClass += ' border-green-400 bg-green-50 text-green-900'
      letterClass += ' bg-green-500 text-white'
    } else if (selected) {
      rowClass += ' border-red-300 bg-red-50 text-red-900'
      letterClass += ' bg-red-400 text-white'
    } else {
      rowClass += ' border-gray-200 bg-white text-gray-400'
      letterClass += ' bg-gray-100 text-gray-400'
    }
    rowClass += ' cursor-default'
  } else if (selected) {
    rowClass += ' border-blue-500 bg-blue-50 text-blue-900 cursor-default'
    letterClass += ' bg-blue-500 text-white'
  } else {
    rowClass += ' border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer'
    letterClass += ' bg-gray-100 text-gray-600'
  }

  if (disabled) rowClass += ' cursor-default'

  return (
    <button className={rowClass} onClick={() => !disabled && !revealed && onClick(id)}>
      <span className={letterClass}>{id}</span>
      <span className="flex-1 pt-0.5">{text}</span>
    </button>
  )
}
