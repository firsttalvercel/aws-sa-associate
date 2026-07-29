'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Monitor, Play, Pause, Flag, ChevronLeft, ChevronRight } from 'lucide-react'
import { sampleSimExam } from '../../data/questions'
import { useQuiz } from '../../hooks/useQuiz'
import { useTimer } from '../../hooks/useTimer'
import { useProgress } from '../../hooks/useProgress'
import { QuestionCard } from '../../components/QuestionCard'
import { TimerBar } from '../../components/Timer'
import { ResultsSummary } from '../../components/ResultsSummary'
import type { Question, SimResult, Domain } from '../../lib/types'

type SimPhase = 'intro' | 'active' | 'done'

const TOTAL_SECONDS = 130 * 60

export default function SimExam() {
  const [phase, setPhase] = useState<SimPhase>('intro')
  const [questions, setQuestions] = useState<Question[]>([])
  const [feedbackMode, setFeedbackMode] = useState(false)
  const { addSimResult } = useProgress()
  const savedRef = useRef(false)

  const quiz = useQuiz(questions)
  const timer = useTimer(TOTAL_SECONDS, () => quiz.setState('done'))

  const startExam = () => {
    const qs = sampleSimExam(65)
    setQuestions(qs)
    setPhase('active')
  }

  useEffect(() => {
    if (phase === 'active' && questions.length > 0) {
      quiz.start()
      timer.start()
    }
  }, [phase, questions.length])

  useEffect(() => {
    if (quiz.state === 'done' && phase === 'active' && !savedRef.current) {
      savedRef.current = true
      setPhase('done')
      const result: SimResult = {
        id: `sim-${Date.now()}`,
        completedAt: Date.now(),
        totalQuestions: questions.length,
        correct: quiz.correctCount,
        scaledScore: quiz.scaledScore,
        passed: quiz.passed,
        domainBreakdown: quiz.domainBreakdown,
        durationMs: quiz.durationMs,
      }
      addSimResult(result)
    }
  }, [quiz.state])

  if (phase === 'intro') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Simulation Exam</h1>
          <p className="text-gray-500 text-sm mt-1">Full SAA-C03 simulation · domain-weighted random questions</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Questions', '65 (domain-weighted)'],
              ['Time limit', '130 minutes'],
              ['Passing score', '720 / 1000'],
              ['Question format', 'Multiple choice + response'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-900">{v}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <button
              onClick={() => setFeedbackMode(!feedbackMode)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border-2 text-sm transition-all ${feedbackMode ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${feedbackMode ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                {feedbackMode && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-700">Immediate feedback (relaxed mode)</div>
                <div className="text-xs text-gray-500">Show explanation after each answer · off = real exam feel</div>
              </div>
            </button>
          </div>

          <button
            onClick={startExam}
            className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <Monitor size={16} />
            Start Simulation Exam
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-1">
          <p className="font-semibold">Exam tips</p>
          <p>• Flag questions you are unsure about and revisit before submitting</p>
          <p>• The timer can be paused — this is relaxed mode</p>
          <p>• Questions are randomly sampled by domain weight each time</p>
          <p>• Your score is mapped to the 100-1000 Pearson VUE scale</p>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Exam Complete</h1>
        <ResultsSummary
          correct={quiz.correctCount}
          total={questions.length}
          scaledScore={quiz.scaledScore}
          passed={quiz.passed}
          domainBreakdown={quiz.domainBreakdown}
          durationMs={quiz.durationMs}
          mode="sim"
        />

        {/* Per-question review */}
        <details className="bg-white rounded-xl border border-gray-200">
          <summary className="px-5 py-4 text-sm font-semibold text-gray-700 cursor-pointer select-none">
            Review All Questions ({questions.length})
          </summary>
          <div className="px-5 pb-5 space-y-3">
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
                  <p className="text-gray-700 text-xs leading-relaxed">{q.stem.slice(0, 130)}{q.stem.length > 130 ? '…' : ''}</p>
                  {!ans.correct && <p className="text-xs text-gray-600 mt-1 italic">{q.explanation}</p>}
                </div>
              )
            })}
          </div>
        </details>

        <div className="flex gap-3">
          <button onClick={() => { savedRef.current = false; setPhase('intro'); setQuestions([]) }} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Retake</button>
          <Link href="/" className="flex-1 py-2.5 text-center bg-orange-500 rounded-lg text-sm font-medium text-white hover:bg-orange-600 transition-colors">Dashboard</Link>
        </div>
      </div>
    )
  }

  const q = quiz.current
  if (!q) return null

  return (
    <div className="space-y-3">
      {/* Exam header bar */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Monitor size={15} className="text-orange-500" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Sim Exam</span>
        </div>
        <div className="flex-1">
          <TimerBar
            totalSeconds={TOTAL_SECONDS}
            paused={timer.paused}
            onPause={timer.pause}
            onResume={timer.resume}
            formatted={timer.formatted}
            pct={timer.pct}
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {quiz.flagged.size > 0 && <span className="text-amber-600 font-medium">{quiz.flagged.size} flagged</span>}
          <span className="font-semibold text-gray-700">{quiz.currentIndex + 1}<span className="font-normal text-gray-400">/{questions.length}</span></span>
        </div>
      </div>

      {/* Progress strip */}
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${quiz.progress}%` }} />
      </div>

      {/* Question */}
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

      {/* Question navigator */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">Jump to question</p>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((_, i) => {
            const ans = quiz.answers[i]
            const isFlagged = quiz.flagged.has(i)
            const isCurrent = i === quiz.currentIndex
            return (
              <button
                key={i}
                onClick={() => quiz.goTo(i)}
                className={`w-7 h-7 text-xs rounded font-medium transition-colors ${
                  isCurrent ? 'bg-orange-500 text-white' :
                  isFlagged ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                  ans ? 'bg-gray-200 text-gray-600' :
                  'bg-white border border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
