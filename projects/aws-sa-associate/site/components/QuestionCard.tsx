'use client'

import { Flag, CheckCircle2, XCircle } from 'lucide-react'
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
  const answeredCorrectly = revealed && selected.every(s => question.correct.includes(s)) && selected.length === question.correct.length

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Question</span>
          <span className="text-sm font-bold text-gray-700">{index + 1}</span>
          <span className="text-xs text-gray-400">/ {total}</span>
        </div>
        <div className="flex items-center gap-2">
          <DomainBadge domain={question.domain} />
          <button
            onClick={onFlag}
            className={`p-1.5 rounded-md transition-colors ${flagged ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50'}`}
            title="Flag for review"
          >
            <Flag size={15} fill={flagged ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Stem */}
      <div className="text-gray-900 text-[15px] leading-relaxed">
        {question.stem}
        {multiCount && (
          <span className="ml-2 inline-block text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
            Select {multiCount === 2 ? 'TWO' : 'THREE'}
          </span>
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
        <div className="rounded-xl border overflow-hidden text-sm">
          {/* Result banner */}
          <div className={`flex items-center gap-2 px-4 py-3 font-semibold ${answeredCorrectly ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {answeredCorrectly
              ? <><CheckCircle2 size={16} /> Correct</>
              : <><XCircle size={16} /> Incorrect — correct answer: {question.correct.join(', ')}</>
            }
          </div>
          {/* Explanation body */}
          <div className="bg-gray-50 px-4 py-4 space-y-3 text-gray-700 border-t border-gray-200">
            <p className="leading-relaxed">{question.explanation}</p>
            {Object.entries(question.distractors).length > 0 && (
              <div className="pt-2 border-t border-gray-200 space-y-1.5">
                {Object.entries(question.distractors).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => (
                  <p key={k} className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">{k}:</span> {v}
                  </p>
                ))}
              </div>
            )}
            {/* Topics revealed after answer */}
            <div className="pt-2 border-t border-gray-200 flex flex-wrap gap-1">
              {question.topics.map(t => (
                <span key={t} className="text-xs px-2 py-0.5 bg-white border border-gray-200 text-gray-500 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onPrev}
          disabled={!showPrev}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        <div className="flex gap-2">
          {feedbackMode && !confirmed && (
            <button
              onClick={onConfirm}
              disabled={!canConfirm}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              Confirm
            </button>
          )}
          {(!feedbackMode || confirmed) && (
            <button
              onClick={onNext}
              disabled={!feedbackMode && selected.length === 0}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              {isLast ? 'Finish' : 'Next →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
