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
  let base = 'w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-150 flex items-start gap-3 text-sm leading-relaxed'

  if (revealed) {
    if (isCorrectAnswer) {
      base += ' border-green-500 bg-green-50 text-green-900'
    } else if (selected && !isCorrectAnswer) {
      base += ' border-red-400 bg-red-50 text-red-900'
    } else {
      base += ' border-gray-200 bg-white text-gray-400'
    }
  } else if (selected) {
    base += ' border-blue-500 bg-blue-50 text-blue-900'
  } else {
    base += ' border-gray-200 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
  }

  if (disabled || revealed) base += ' cursor-default'

  const indicator = type === 'single' ? (
    <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${selected && !revealed ? 'border-blue-500 bg-blue-500' : revealed && isCorrectAnswer ? 'border-green-500 bg-green-500' : 'border-gray-400'}`}>
      {(selected || (revealed && isCorrectAnswer)) && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
    </span>
  ) : (
    <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${selected && !revealed ? 'border-blue-500 bg-blue-500' : revealed && isCorrectAnswer ? 'border-green-500 bg-green-500' : 'border-gray-400'}`}>
      {(selected || (revealed && isCorrectAnswer)) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
    </span>
  )

  return (
    <button className={base} onClick={() => !disabled && !revealed && onClick(id)}>
      <span className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-600 mt-0.5">{id}</span>
      {indicator}
      <span className="flex-1">{text}</span>
    </button>
  )
}
