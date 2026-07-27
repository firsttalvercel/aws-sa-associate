'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { ALL_QUESTIONS } from '../../data/questions'
import { DomainBadge } from '../../components/DomainBadge'
import { OptionButton } from '../../components/OptionButton'
import { useProgress } from '../../hooks/useProgress'
import type { Domain, Question, OptionId } from '../../lib/types'

function ScenarioCard({ question, attemptedIds }: { question: Question; attemptedIds: Set<string> }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<OptionId[]>([])
  const [revealed, setRevealed] = useState(false)
  const attempted = attemptedIds.has(question.id)

  const toggle = (id: OptionId) => {
    if (revealed) return
    if (question.type === 'single') {
      setSelected([id])
    } else {
      setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }
  }

  const check = () => setRevealed(true)
  const isCorrect = revealed && selected.length === question.correct.length && question.correct.every(c => selected.includes(c))

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all ${attempted ? 'border-gray-200' : 'border-gray-200'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-start gap-3"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <DomainBadge domain={question.domain} />
            {question.topics.slice(0, 3).map(t => (
              <span key={t} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{t}</span>
            ))}
            {question.type === 'multi' && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Multi-select</span>
            )}
          </div>
          <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">{question.stem}</p>
        </div>
        <div className="flex-shrink-0 mt-1">
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
          <div className="space-y-2">
            {question.options.map(opt => (
              <OptionButton
                key={opt.id}
                id={opt.id}
                text={opt.text}
                selected={selected.includes(opt.id)}
                revealed={revealed}
                isCorrectAnswer={question.correct.includes(opt.id)}
                type={question.type}
                onClick={toggle}
              />
            ))}
          </div>

          {!revealed ? (
            <button
              onClick={check}
              disabled={selected.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              Check Answer
            </button>
          ) : (
            <div className={`p-4 rounded-lg border text-sm ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`font-semibold mb-1 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isCorrect ? 'Correct!' : `Incorrect — Answer: ${question.correct.join(', ')}`}
              </p>
              <p className="text-gray-700">{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ScenariosInner() {
  const searchParams = useSearchParams()
  const topicFilter = searchParams.get('topic') ?? ''
  const { progress } = useProgress()

  const [domain, setDomain] = useState<Domain | 'all'>('all')
  const [type, setType] = useState<'all' | 'single' | 'multi'>('all')
  const [topic, setTopic] = useState(topicFilter)

  const attemptedIds = useMemo(() => {
    const ids = new Set<string>()
    progress.sessions.forEach(s => s.questions.forEach(q => ids.add(q.questionId)))
    return ids
  }, [progress])

  const allTopics = useMemo(() => {
    const topics = new Set<string>()
    ALL_QUESTIONS.forEach(q => q.topics.forEach(t => topics.add(t)))
    return [...topics].sort()
  }, [])

  const filtered = useMemo(() => {
    return ALL_QUESTIONS.filter(q => {
      if (domain !== 'all' && q.domain !== domain) return false
      if (type !== 'all' && q.type !== type) return false
      if (topic && !q.topics.map(t => t.toLowerCase()).some(t => t.includes(topic.toLowerCase()))) return false
      return true
    })
  }, [domain, type, topic])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scenarios</h1>
        <p className="text-gray-500 text-sm mt-1">Browse and drill questions by domain, service, or type.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter size={14} />
          Filters
          <span className="ml-auto text-xs text-gray-400 font-normal">{filtered.length} questions</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {/* Domain */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Domain</label>
            <select
              value={domain}
              onChange={e => setDomain(e.target.value as Domain | 'all')}
              className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700"
            >
              <option value="all">All domains</option>
              <option value={1}>D1: Secure</option>
              <option value={2}>D2: Resilient</option>
              <option value={3}>D3: High-Performing</option>
              <option value={4}>D4: Cost-Optimized</option>
            </select>
          </div>
          {/* Type */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as 'all' | 'single' | 'multi')}
              className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700"
            >
              <option value="all">All types</option>
              <option value="single">Single answer</option>
              <option value="multi">Multi-select</option>
            </select>
          </div>
          {/* Topic */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Topic</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. S3, IAM, RDS"
              className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">No questions match your filters.</div>
        ) : (
          filtered.map(q => (
            <ScenarioCard key={q.id} question={q} attemptedIds={attemptedIds} />
          ))
        )}
      </div>
    </div>
  )
}

export default function ScenariosPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 text-sm">Loading…</div>}>
      <ScenariosInner />
    </Suspense>
  )
}
