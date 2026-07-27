'use client'

import type { Progress, Session, MistakeEntry, SimResult, SessionQuestion, Domain } from './types'

const KEY = 'aws-practice-progress'

const empty = (): Progress => ({ sessions: [], mistakes: [], simHistory: [] })

export function loadProgress(): Progress {
  if (typeof window === 'undefined') return empty()
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Progress) : empty()
  } catch {
    return empty()
  }
}

function save(p: Progress) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function saveSession(session: Session) {
  const p = loadProgress()
  p.sessions.push(session)
  // update mistakes
  session.questions.forEach((sq: SessionQuestion) => {
    if (!sq.correct) {
      const existing = p.mistakes.find(m => m.questionId === sq.questionId)
      if (existing) {
        existing.attempts++
        existing.wrongCount++
        existing.lastSeenAt = session.completedAt
      } else {
        p.mistakes.push({
          questionId: sq.questionId,
          lastSeenAt: session.completedAt,
          attempts: 1,
          wrongCount: 1,
        })
      }
    } else {
      const existing = p.mistakes.find(m => m.questionId === sq.questionId)
      if (existing) {
        existing.attempts++
        existing.lastSeenAt = session.completedAt
      }
    }
  })
  save(p)
}

export function saveSimResult(result: SimResult) {
  const p = loadProgress()
  p.simHistory.push(result)
  save(p)
}

export function clearProgress() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}

export function getDomainStats(domain: Domain, progress: Progress) {
  const attempted = new Set<string>()
  let correct = 0
  progress.sessions.forEach(s => {
    s.questions.forEach(q => {
      if (!attempted.has(q.questionId)) {
        // check domain from question id prefix
        const d = parseInt(q.questionId[1]) as Domain
        if (d === domain) {
          attempted.add(q.questionId)
          if (q.correct) correct++
        }
      }
    })
  })
  return { attempted: attempted.size, correct }
}

export function getOverallStats(progress: Progress) {
  let attempted = 0
  let correct = 0
  const seen = new Set<string>()
  progress.sessions.forEach(s => {
    s.questions.forEach(q => {
      if (!seen.has(q.questionId)) {
        seen.add(q.questionId)
        attempted++
        if (q.correct) correct++
      }
    })
  })
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
  return { attempted, correct, accuracy }
}

// Maps raw fraction correct (0-1) to Pearson VUE scaled score 100-1000
export function toScaledScore(fraction: number): number {
  return Math.round(100 + fraction * 900)
}
