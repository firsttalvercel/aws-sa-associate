import type { Question, Domain } from '../../lib/types'
import { seedQuestions } from './seed'

// Generated question files will be imported here as they are created
// import { iam_questions } from './iam'
// import { kms_questions } from './kms'
// ... etc

export const ALL_QUESTIONS: Question[] = [
  ...seedQuestions,
  // generated batches will be spread here
]

export function getQuestionsByDomain(domain: Domain): Question[] {
  return ALL_QUESTIONS.filter(q => q.domain === domain)
}

export function getQuestionsByTopic(topic: string): Question[] {
  return ALL_QUESTIONS.filter(q => q.topics.map(t => t.toLowerCase()).includes(topic.toLowerCase()))
}

export function sampleQuestions(
  count: number,
  domain?: Domain | 'all',
  excludeIds?: Set<string>
): Question[] {
  let pool = domain && domain !== 'all'
    ? ALL_QUESTIONS.filter(q => q.domain === domain)
    : [...ALL_QUESTIONS]

  if (excludeIds?.size) {
    pool = pool.filter(q => !excludeIds.has(q.id))
  }

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }

  return pool.slice(0, Math.min(count, pool.length))
}

// Sample by domain weights for simulation exam
// Domain 1: 30%, Domain 2: 26%, Domain 3: 24%, Domain 4: 20%
export function sampleSimExam(total = 65): Question[] {
  const counts: Record<Domain, number> = {
    1: Math.round(total * 0.30), // ~20
    2: Math.round(total * 0.26), // ~17
    3: Math.round(total * 0.24), // ~16
    4: total - Math.round(total * 0.30) - Math.round(total * 0.26) - Math.round(total * 0.24), // ~12
  }

  const questions: Question[] = []
  ;([1, 2, 3, 4] as Domain[]).forEach(d => {
    questions.push(...sampleQuestions(counts[d], d))
  })

  // Final shuffle so domains aren't grouped
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]]
  }

  return questions
}

export function getPoolStats() {
  const stats: Record<Domain, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  ALL_QUESTIONS.forEach(q => stats[q.domain]++)
  return {
    total: ALL_QUESTIONS.length,
    byDomain: stats,
  }
}
