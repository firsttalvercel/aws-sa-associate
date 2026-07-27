'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadProgress, saveSession, saveSimResult } from '../lib/storage'
import type { Progress, Session, SimResult } from '../lib/types'

export function useProgress() {
  const [progress, setProgress] = useState<Progress>({ sessions: [], mistakes: [], simHistory: [] })

  useEffect(() => {
    setProgress(loadProgress())
  }, [])

  const addSession = useCallback((session: Session) => {
    saveSession(session)
    setProgress(loadProgress())
  }, [])

  const addSimResult = useCallback((result: SimResult) => {
    saveSimResult(result)
    setProgress(loadProgress())
  }, [])

  return { progress, addSession, addSimResult }
}
