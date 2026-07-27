'use client'

import { CheckCircle, XCircle, Award } from 'lucide-react'
import type { Domain } from '../lib/types'
import { domainLabel, DOMAIN_BG } from './DomainBadge'

interface DomainResult { total: number; correct: number }

interface Props {
  correct: number
  total: number
  scaledScore: number
  passed: boolean
  domainBreakdown: Record<Domain, DomainResult>
  durationMs: number
  mode: 'quick' | 'sim'
}

export function ResultsSummary({ correct, total, scaledScore, passed, domainBreakdown, durationMs, mode }: Props) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const mins = Math.floor(durationMs / 60000)
  const secs = Math.floor((durationMs % 60000) / 1000)

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div className={`rounded-xl p-6 text-center ${passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex justify-center mb-3">
          {passed
            ? <Award size={40} className="text-green-600" />
            : <XCircle size={40} className="text-red-500" />}
        </div>
        {mode === 'sim' ? (
          <>
            <div className="text-5xl font-bold mb-1" style={{ color: passed ? '#16a34a' : '#dc2626' }}>{scaledScore}</div>
            <div className="text-sm text-gray-500 mb-1">out of 1000 · passing: 720</div>
            <div className={`text-lg font-semibold ${passed ? 'text-green-700' : 'text-red-600'}`}>
              {passed ? 'PASS' : 'FAIL'}
            </div>
          </>
        ) : (
          <>
            <div className="text-5xl font-bold mb-1 text-gray-900">{correct}<span className="text-2xl text-gray-400">/{total}</span></div>
            <div className="text-xl font-semibold text-gray-700">{accuracy}% correct</div>
          </>
        )}
        <div className="text-sm text-gray-500 mt-2">Time: {mins}m {secs}s</div>
      </div>

      {/* Domain breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Domain Breakdown</h3>
        <div className="space-y-3">
          {([1, 2, 3, 4] as Domain[]).map(d => {
            const { total: dt, correct: dc } = domainBreakdown[d]
            if (dt === 0) return null
            const pct = Math.round((dc / dt) * 100)
            return (
              <div key={d}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>D{d}: {domainLabel(d)}</span>
                  <span className="font-medium">{dc}/{dt} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${DOMAIN_BG[d]} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
