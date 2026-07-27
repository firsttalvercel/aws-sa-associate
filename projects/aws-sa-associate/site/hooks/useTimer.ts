'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(initialSeconds: number, onExpire?: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [paused, setPaused] = useState(false)
  const [started, setStarted] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  const start = useCallback(() => setStarted(true), [])

  const pause = useCallback(() => setPaused(true), [])

  const resume = useCallback(() => setPaused(false), [])

  const reset = useCallback((seconds?: number) => {
    setSecondsLeft(seconds ?? initialSeconds)
    setPaused(false)
    setStarted(false)
  }, [initialSeconds])

  useEffect(() => {
    if (!started || paused || secondsLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (secondsLeft === 0 && started) onExpireRef.current?.()
      return
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [started, paused, secondsLeft])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const pct = (secondsLeft / initialSeconds) * 100

  return { secondsLeft, formatted, pct, paused, started, start, pause, resume, reset }
}
