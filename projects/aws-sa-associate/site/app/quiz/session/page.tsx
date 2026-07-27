'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { sampleQuestions } from '../../../data/questions'
import { useQuiz } from '../../../hooks/useQuiz'
import { useTimer } from '../../../hooks/useTimer'
import { useProgress } from '../../../hooks/useProgress'
import { QuestionCard } from '../../../components/QuestionCard'
import { TimerBar } from '../../../components/Timer'
import { ResultsSummary } from '../../../components/ResultsSummary'
import type { Domain, Session } from '../../../lib/types'

function SessionInner() {
  const params = useSearchParams()
  const router = useRouter()
  const { addSession } = useProgress()

  const domain = params.get('domain') as Domain | 'all' ?? 'all'
  const count = parseInt(params.get('count') ?? '10')
  const timed = params.get('timed') === 'true'
  const feedbackMode = params.get('feedback') !== 'false'

  const [questions] = useState(() => sampleQuestions(count, domain === 'all' ? undefined : domain as Domain))
  const quiz = useQuiz(questions)
  const totalSecs = count * 120
  const timer = useTimer(timed ? totalSecs : 0, () => { if (timed) quiz.setState('done') })
  const savedRef = useRef(false)

  useEffect(() => {
    if (questions.length > 0) {
      quiz.start()
      if (timed) timer.start()
    }
  }, [])

  useEffect(() => {
    if (quiz.state === 'done' && !savedRef.current) {
      savedRef.current = true
      const session: Session = {
        id: `session-${Date.now()}`,
        startedAt: Date.now() - quiz.durationMs,
        completedAt: Date.now(),
        mode: 'quick',
        domain,
        questions: quiz.answers,
        durationMs: quiz.durationMs,
      }
      addSession(session)
    }
  }, [quiz.state])

  if (questions.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No questions available for this selection.</p>
        <Link href="/quiz" className="mt-4 inline-block text-blue-600 hover:underline text-sm">Back to config</Link>
      </div>
    )
  }

  if (quiz.state === 'done') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Results</h1>
        <ResultsSummary
          correct={quiz.correctCount}
          total={questions.length}
          scaledScore={quiz.scaledScore}
          passed={quiz.passed}
          domainBreakdown={quiz.domainBreakdown}
          durationMs={quiz.durationMs}
          mode="quick"
        />

        {/* Per-question review */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Question Review</h3>
          {questions.map((q, i) => {
            const ans = quiz.answers[i]
            if (!ans) return null
            return (
              <div key={q.id} className={`p-3 rounded-lg border text-sm ${ans.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className={`font-medium ${ans.correct ? 'text-green-800' : 'text-red-800'}`}>
                    Q{i + 1}: {ans.correct ? 'Correct' : `Wrong — correct: ${q.correct.join(', ')}`}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">You: {ans.selected.join(', ')}</span>
                </div>
                <p className="text-gray-700 text-xs leading-relaxed">{q.stem.slice(0, 120)}{q.stem.length > 120 ? '…' : ''}</p>
                {!ans.correct && <p className="text-xs text-gray-600 mt-1 italic">{q.explanation}</p>}
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          <Link href="/quiz" className="flex-1 py-2.5 text-center border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">New Test</Link>
          <Link href="/" className="flex-1 py-2.5 text-center bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors">Dashboard</Link>
        </div>
      </div>
    )
  }

  const q = quiz.current
  if (!q) return null

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${quiz.progress}%` }} />
        </div>
        <span className="text-xs text-gray-500 flex-shrink-0">{quiz.currentIndex + 1}/{questions.length}</span>
      </div>

      {/* Timer */}
      {timed && (
        <TimerBar
          totalSeconds={totalSecs}
          paused={timer.paused}
          onPause={timer.pause}
          onResume={timer.resume}
          formatted={timer.formatted}
          pct={timer.pct}
        />
      )}

      {/* Flagged indicator */}
      {quiz.flagged.size > 0 && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
          {quiz.flagged.size} question{quiz.flagged.size > 1 ? 's' : ''} flagged for review
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <QuestionCard
          question={q}
          index={quiz.currentIndex}
          total={questions.length}
          selected={quiz.selected}
          confirmed={quiz.confirmed}
          flagged={quiz.flagged.has(quiz.currentIndex)}
          feedbackMode={feedbackMode}
          onSelect={quiz.select}
          onConfirm={quiz.confirm}
          onFlag={quiz.toggleFlag}
          onNext={() => quiz.next(feedbackMode)}
          onPrev={() => quiz.goTo(quiz.currentIndex - 1)}
          showPrev={quiz.currentIndex > 0}
          isLast={quiz.currentIndex === questions.length - 1}
        />
      </div>
    </div>
  )
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 text-sm">Loading…</div>}>
      <SessionInner />
    </Suspense>
  )
}
