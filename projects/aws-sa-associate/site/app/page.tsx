'use client'

import Link from 'next/link'
import { Zap, Monitor, BookOpen, List, AlertTriangle, TrendingUp, FileText } from 'lucide-react'
import { useProgress } from '../hooks/useProgress'
import { getOverallStats, getDomainStats } from '../lib/storage'
import { domainLabel, DOMAIN_BG } from '../components/DomainBadge'
import { getPoolStats } from '../data/questions'
import type { Domain } from '../lib/types'

const DOMAIN_WEIGHTS: Record<Domain, number> = { 1: 30, 2: 26, 3: 24, 4: 20 }

export default function Dashboard() {
  const { progress } = useProgress()
  const overall = getOverallStats(progress)
  const pool = getPoolStats()

  const domainStats = ([1, 2, 3, 4] as Domain[]).map(d => ({
    domain: d,
    label: domainLabel(d),
    weight: DOMAIN_WEIGHTS[d],
    poolCount: pool.byDomain[d],
    ...getDomainStats(d, progress),
  }))

  const lastSim = progress.simHistory[progress.simHistory.length - 1]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">AWS Certified Solutions Architect Associate (SAA-C03)</p>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-gray-900">{overall.attempted}</div>
          <div className="text-sm text-gray-500 mt-1">Questions attempted</div>
          <div className="text-xs text-gray-400 mt-0.5">of {pool.total} in pool</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-gray-900">{overall.accuracy}%</div>
          <div className="text-sm text-gray-500 mt-1">Accuracy</div>
          <div className="text-xs text-gray-400 mt-0.5">{overall.correct} correct</div>
        </div>
        <div className={`rounded-xl border p-5 ${lastSim ? (lastSim.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-white border-gray-200'}`}>
          <div className="text-3xl font-bold text-gray-900">{lastSim ? lastSim.scaledScore : '—'}</div>
          <div className="text-sm text-gray-500 mt-1">Last sim score</div>
          <div className="text-xs mt-0.5">
            {lastSim ? (lastSim.passed ? <span className="text-green-600 font-medium">PASS</span> : <span className="text-red-500 font-medium">FAIL</span>) : <span className="text-gray-400">No sim yet</span>}
          </div>
        </div>
      </div>

      {/* Domain breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Domain Progress</h2>
        {domainStats.map(({ domain, label, weight, poolCount, attempted, correct }) => {
          const pct = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
          return (
            <div key={domain}>
              <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                <span className="font-medium">D{domain}: {label} <span className="text-gray-400 font-normal">({weight}%)</span></span>
                <span>{attempted > 0 ? `${pct}% · ${correct}/${attempted}` : `0 / ${poolCount} attempted`}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${DOMAIN_BG[domain as Domain]} transition-all`}
                  style={{ width: attempted > 0 ? `${pct}%` : '0%' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Start Practicing</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/quiz" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                <Zap size={16} className="text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <span className="font-semibold text-gray-900">Quick Test</span>
            </div>
            <p className="text-sm text-gray-500">Pick domain, count, and go. Immediate feedback mode available.</p>
          </Link>
          <Link href="/sim" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-orange-300 hover:shadow-sm transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <Monitor size={16} className="text-orange-600 group-hover:text-white transition-colors" />
              </div>
              <span className="font-semibold text-gray-900">Sim Exam</span>
            </div>
            <p className="text-sm text-gray-500">65 questions · 130 min · domain-weighted. Real exam feel.</p>
          </Link>
          <Link href="/topics" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 hover:shadow-sm transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-colors">
                <BookOpen size={16} className="text-green-600 group-hover:text-white transition-colors" />
              </div>
              <span className="font-semibold text-gray-900">Topics</span>
            </div>
            <p className="text-sm text-gray-500">Cheat sheets, exam traps, comparison tables per service.</p>
          </Link>
          <Link href="/scenarios" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-sm transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                <List size={16} className="text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <span className="font-semibold text-gray-900">Scenarios</span>
            </div>
            <p className="text-sm text-gray-500">Browse and filter questions by domain, service, or topic.</p>
          </Link>
          <Link href="/cheatsheet" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                <FileText size={16} className="text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <span className="font-semibold text-gray-900">Cheat Sheet</span>
            </div>
            <p className="text-sm text-gray-500">All domains, service comparisons, decision tables, exam traps, and key numbers in one place.</p>
          </Link>
        </div>
      </div>

      {/* Mistakes shortcut */}
      {progress.mistakes.length > 0 && (
        <Link href="/mistakes" className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-600" />
            <div>
              <div className="text-sm font-semibold text-amber-900">{progress.mistakes.length} questions to review</div>
              <div className="text-xs text-amber-700">Re-drill your wrong answers</div>
            </div>
          </div>
          <TrendingUp size={16} className="text-amber-500" />
        </Link>
      )}
    </div>
  )
}
