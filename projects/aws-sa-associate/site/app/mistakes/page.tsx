'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useProgress } from '../../hooks/useProgress'
import { ALL_QUESTIONS } from '../../data/questions'
import { DomainBadge } from '../../components/DomainBadge'
import { clearProgress } from '../../lib/storage'
import type { OptionId } from '../../lib/types'

export default function MistakesPage() {
  const { progress, addSession } = useProgress()
  const router = useRouter()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const mistakeDetails = progress.mistakes
    .map(m => ({
      ...m,
      question: ALL_QUESTIONS.find(q => q.id === m.questionId),
    }))
    .filter(m => m.question)
    .sort((a, b) => b.wrongCount - a.wrongCount)

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const reDrill = () => {
    const ids = mistakeDetails.map(m => m.questionId)
    const params = new URLSearchParams({
      domain: 'all',
      count: String(Math.min(ids.length, 20)),
      timed: 'false',
      feedback: 'true',
      mode: 'mistakes',
    })
    router.push(`/quiz/session?${params}`)
  }

  if (mistakeDetails.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mistakes</h1>
          <p className="text-gray-500 text-sm mt-1">Wrong answers logged across all sessions.</p>
        </div>
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <AlertTriangle size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No mistakes logged yet.</p>
          <p className="text-gray-400 text-xs mt-1">Complete a quick test or sim exam to start tracking.</p>
          <Link href="/quiz" className="mt-4 inline-block text-blue-600 hover:underline text-sm">Start a Quick Test</Link>
        </div>
      </div>
    )
  }

  // Group by topic
  const byTopic: Record<string, typeof mistakeDetails> = {}
  mistakeDetails.forEach(m => {
    const key = m.question!.topics[0] ?? 'Other'
    if (!byTopic[key]) byTopic[key] = []
    byTopic[key].push(m)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mistakes</h1>
          <p className="text-gray-500 text-sm mt-1">{mistakeDetails.length} questions to review</p>
        </div>
        <button
          onClick={reDrill}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
        >
          <RefreshCw size={14} />
          Re-drill all
        </button>
      </div>

      {/* By topic */}
      {Object.entries(byTopic).map(([topicKey, items]) => (
        <div key={topicKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">{topicKey}</span>
            <span className="text-xs text-gray-400">{items.length} question{items.length > 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map(m => {
              const q = m.question!
              const isOpen = expanded.has(q.id)
              return (
                <div key={q.id}>
                  <button
                    onClick={() => toggle(q.id)}
                    className="w-full text-left px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <DomainBadge domain={q.domain} />
                        <span className="text-xs text-red-600 font-medium">{m.wrongCount}x wrong</span>
                        <span className="text-xs text-gray-400">{m.attempts} attempts</span>
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-2">{q.stem}</p>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-gray-400 mt-1 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-400 mt-1 flex-shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 space-y-2 border-t border-gray-100 pt-3 bg-gray-50">
                      <div className="space-y-1.5">
                        {q.options.map(opt => (
                          <div
                            key={opt.id}
                            className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${q.correct.includes(opt.id) ? 'bg-green-50 border border-green-200 text-green-900' : 'text-gray-600'}`}
                          >
                            <span className="font-bold flex-shrink-0">{opt.id}.</span>
                            <span>{opt.text}</span>
                            {q.correct.includes(opt.id) && <span className="ml-auto text-xs text-green-700 font-semibold flex-shrink-0">CORRECT</span>}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-700">
                        <span className="font-semibold">Why: </span>{q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
