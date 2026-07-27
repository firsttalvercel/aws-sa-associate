'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Clock, CheckSquare } from 'lucide-react'
import type { Domain } from '../../lib/types'
import { domainLabel } from '../../components/DomainBadge'
import { getPoolStats } from '../../data/questions'

type DomainFilter = Domain | 'all'

export default function QuizConfig() {
  const router = useRouter()
  const [domain, setDomain] = useState<DomainFilter>('all')
  const [count, setCount] = useState(10)
  const [timed, setTimed] = useState(false)
  const [feedback, setFeedback] = useState(true)
  const pool = getPoolStats()

  const domainOptions: { value: DomainFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All Domains', count: pool.total },
    { value: 1, label: `D1: ${domainLabel(1)}`, count: pool.byDomain[1] },
    { value: 2, label: `D2: ${domainLabel(2)}`, count: pool.byDomain[2] },
    { value: 3, label: `D3: ${domainLabel(3)}`, count: pool.byDomain[3] },
    { value: 4, label: `D4: ${domainLabel(4)}`, count: pool.byDomain[4] },
  ]

  const startQuiz = () => {
    const params = new URLSearchParams({
      domain: String(domain),
      count: String(count),
      timed: String(timed),
      feedback: String(feedback),
    })
    router.push(`/quiz/session?${params}`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quick Test</h1>
        <p className="text-gray-500 text-sm mt-1">Customize your session and start immediately.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Domain */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Domain</label>
          <div className="grid grid-cols-2 gap-2">
            {domainOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDomain(opt.value)}
                className={`px-4 py-3 rounded-lg border-2 text-sm text-left transition-all ${domain === opt.value ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{opt.count} questions</div>
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Number of Questions</label>
          <div className="flex gap-2">
            {[5, 10, 15, 20, 30].map(n => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${count === n ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Options</label>
          <button
            onClick={() => setTimed(!timed)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border-2 text-sm transition-all ${timed ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <Clock size={16} className={timed ? 'text-blue-600' : 'text-gray-400'} />
            <div className="text-left">
              <div className={`font-medium ${timed ? 'text-blue-900' : 'text-gray-700'}`}>Timed mode</div>
              <div className="text-xs text-gray-500">~2 minutes per question</div>
            </div>
            <div className={`ml-auto w-4 h-4 rounded border-2 flex items-center justify-center ${timed ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
              {timed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
          </button>
          <button
            onClick={() => setFeedback(!feedback)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border-2 text-sm transition-all ${feedback ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <CheckSquare size={16} className={feedback ? 'text-blue-600' : 'text-gray-400'} />
            <div className="text-left">
              <div className={`font-medium ${feedback ? 'text-blue-900' : 'text-gray-700'}`}>Immediate feedback</div>
              <div className="text-xs text-gray-500">Show explanation after each answer</div>
            </div>
            <div className={`ml-auto w-4 h-4 rounded border-2 flex items-center justify-center ${feedback ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
              {feedback && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
          </button>
        </div>

        <button
          onClick={startQuiz}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Zap size={16} />
          Start {count} Questions
        </button>
      </div>
    </div>
  )
}
