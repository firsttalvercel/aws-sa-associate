export type OptionId = 'A' | 'B' | 'C' | 'D' | 'E'
export type Domain = 1 | 2 | 3 | 4

export interface Option {
  id: OptionId
  text: string
}

export interface Question {
  id: string
  domain: Domain
  topics: string[]
  type: 'single' | 'multi'
  stem: string
  options: Option[]
  correct: OptionId[]
  explanation: string
  distractors: Partial<Record<OptionId, string>>
}

export interface Session {
  id: string
  startedAt: number
  completedAt: number
  mode: 'quick' | 'sim'
  domain: Domain | 'all'
  questions: SessionQuestion[]
  durationMs: number
}

export interface SessionQuestion {
  questionId: string
  selected: OptionId[]
  correct: boolean
  flagged: boolean
  timeSpentMs: number
}

export interface MistakeEntry {
  questionId: string
  lastSeenAt: number
  attempts: number
  wrongCount: number
}

export interface SimResult {
  id: string
  completedAt: number
  totalQuestions: number
  correct: number
  scaledScore: number
  passed: boolean
  domainBreakdown: Record<Domain, { total: number; correct: number }>
  durationMs: number
}

export interface Progress {
  sessions: Session[]
  mistakes: MistakeEntry[]
  simHistory: SimResult[]
}

export interface TopicContent {
  slug: string
  title: string
  category: string
  keyFacts: string[]
  examTraps: { trap: string; correct: string }[]
  comparisons?: {
    title: string
    rows: { label: string; values: string[] }[]
    headers: string[]
  }[]
  keywordSignals?: { keyword: string; service: string }[]
  relatedTopics?: string[]
}
