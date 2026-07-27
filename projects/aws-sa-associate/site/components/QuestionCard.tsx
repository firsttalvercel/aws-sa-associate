'use client'

import { Flag } from 'lucide-react'
import type { Question, OptionId } from '../lib/types'
import { DomainBadge } from './DomainBadge'
import { OptionButton } from './OptionButton'

interface Props {
  question: Question
  index: number
  total: number
  selected: OptionId[]
  confirmed: boolean
  flagged: boolean
  feedbackMode: boolean
  onSelect: (id: OptionId) => void
  onConfirm: () => void
  onFlag: () => void
  onNext: () => void
  onPrev?: () => void
  showPrev?: boolean
  isLast: boolean
}

export function QuestionCard({
  question, index, total, selected, confirmed, flagged, feedbackMode,
  onSelect, onConfirm, onFlag, onNext, onPrev, showPrev, isLast
}: Props) {
  const revealed = feedbackMode && confirmed
  const multiCount = question.correct.length > 1 ? question.correct.length : null
  const canConfirm = selected.length > 0 && (
    question.type === 'single' || selected.length === question.correct.length
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">
          Question {index + 1} <span className="text-gray-400">/ {total}</span>
        </span>
        <div className="flex items-center gap-2">
          <DomainBadge domain={question.domain} />
          <button
            onClick={onFlag}
            className={`p-1.5 rounded-md transition-colors ${flagged ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
            title="Flag for review"
          >
            <Flag size={16} fill={flagged ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Topics */}
      <div className="flex flex-wrap gap-1">
        {question.topics.map(t => (
          <span key={t} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{t}</span>
        ))}
      </div>

      {/* Stem */}
      <div className="text-gray-900 text-base leading-relaxed font-medium">
        {question.stem}
        {multiCount && (
          <span className="ml-2 text-sm font-semibold text-blue-600">(Select {multiCount === 2 ? 'TWO' : 'THREE'})</span>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {question.options.map(opt => (
          <OptionButton
            key={opt.id}
            id={opt.id}
            text={opt.text}
            selected={selected.includes(opt.id)}
            revealed={revealed}
            isCorrectAnswer={question.correct.includes(opt.id)}
            type={question.type}
            onClick={onSelect}
          />
        ))}
      </div>

      {/* Explanation (feedback mode) */}
      {revealed && (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 space-y-2">
          <p className="font-semibold text-gray-900">Explanation</p>
          <p>{question.explanation}</p>
          {Object.entries(question.distractors).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(question.distractors).map(([k, v]) => (
                <p key={k}><span className="font-medium text-red-600">{k} wrong:</span> {v}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onPrev}
          disabled={!showPrev}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        <div className="flex gap-2">
          {feedbackMode && !confirmed && (
            <button
              onClick={onConfirm}
              disabled={!canConfirm}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              Check Answer
            </button>
          )}
          {(!feedbackMode || confirmed) && (
            <button
              onClick={onNext}
              disabled={!feedbackMode && selected.length === 0}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
