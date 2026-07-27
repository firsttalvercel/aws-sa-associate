'use client'

import { useState, useCallback, useRef } from 'react'
import type { Question, OptionId, SessionQuestion, Domain } from '../lib/types'
import { toScaledScore } from '../lib/storage'

export type QuizState = 'idle' | 'active' | 'review' | 'done'

export function useQuiz(questions: Question[]) {
  const [state, setState] = useState<QuizState>('idle')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<OptionId[]>([])
  const [confirmed, setConfirmed] = useState(false)
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [answers, setAnswers] = useState<SessionQuestion[]>([])
  const startTimeRef = useRef<number>(Date.now())
  const qStartTimeRef = useRef<number>(Date.now())

  const current = questions[currentIndex]

  const start = useCallback(() => {
    setState('active')
    startTimeRef.current = Date.now()
    qStartTimeRef.current = Date.now()
  }, [])

  const select = useCallback((id: OptionId) => {
    if (confirmed) return
    if (current?.type === 'single') {
      setSelected([id])
    } else {
      setSelected(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      )
    }
  }, [confirmed, current])

  const confirm = useCallback(() => {
    if (!current || selected.length === 0) return
    setConfirmed(true)
  }, [current, selected])

  const toggleFlag = useCallback(() => {
    setFlagged(prev => {
      const next = new Set(prev)
      next.has(currentIndex) ? next.delete(currentIndex) : next.add(currentIndex)
      return next
    })
  }, [currentIndex])

  const next = useCallback((feedbackMode: boolean) => {
    if (!current) return
    const isCorrect = (
      selected.length === current.correct.length &&
      current.correct.every(c => selected.includes(c))
    )
    const sq: SessionQuestion = {
      questionId: current.id,
      selected,
      correct: isCorrect,
      flagged: flagged.has(currentIndex),
      timeSpentMs: Date.now() - qStartTimeRef.current,
    }
    setAnswers(prev => [...prev, sq])

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
      setSelected([])
      setConfirmed(feedbackMode ? false : false)
      setConfirmed(false)
      qStartTimeRef.current = Date.now()
    } else {
      setState('done')
    }
  }, [current, selected, flagged, currentIndex, questions.length])

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index)
    setSelected([])
    setConfirmed(false)
    qStartTimeRef.current = Date.now()
  }, [])

  const correctCount = answers.filter(a => a.correct).length
  const scaledScore = toScaledScore(answers.length > 0 ? correctCount / answers.length : 0)
  const passed = scaledScore >= 720
  const durationMs = Date.now() - startTimeRef.current

  const domainBreakdown = ([1, 2, 3, 4] as Domain[]).reduce((acc, d) => {
    const dqs = questions.filter(q => q.domain === d)
    const dAnswers = answers.filter(a => {
      const q = questions.find(q => q.id === a.questionId)
      return q?.domain === d
    })
    acc[d] = { total: dqs.length, correct: dAnswers.filter(a => a.correct).length }
    return acc
  }, {} as Record<Domain, { total: number; correct: number }>)

  return {
    state, current, currentIndex, selected, confirmed, flagged, answers,
    correctCount, scaledScore, passed, durationMs, domainBreakdown,
    start, select, confirm, toggleFlag, next, goTo, setState,
    progress: questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0,
  }
}
