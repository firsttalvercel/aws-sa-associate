import type { Question, Domain } from '../../lib/types'
import { seedQuestions } from './seed'
import { iam_questions } from './iam'
import { kms_questions } from './kms'
import { waf_shield_cognito_questions } from './waf-shield-cognito'
import { vpc_security_questions } from './vpc-security'
import { secrets_cloudtrail_questions } from './secrets-cloudtrail'
import { ec2_compute_questions } from './ec2-compute'
import { ec2_autoscaling_questions } from './ec2-autoscaling'
import { elb_questions } from './elb'
import { rds_aurora_questions } from './rds-aurora'
import { s3_resilience_questions } from './s3-resilience'
import { sqs_sns_eventbridge_questions } from './sqs-sns-eventbridge'
import { route53_cloudfront_questions } from './route53-cloudfront'
import { dr_strategies_questions } from './dr-strategies'
import { storage_performance_questions } from './storage-performance'
import { database_performance_questions } from './database-performance'
import { network_performance_questions } from './network-performance'
import { serverless_containers_questions } from './serverless-containers'
import { analytics_streaming_questions } from './analytics-streaming'
import { ec2_pricing_questions } from './ec2-pricing'
import { storage_cost_questions } from './storage-cost'
import { database_cost_questions } from './database-cost'
import { network_cost_questions } from './network-cost'
import { cost_tools_questions } from './cost-tools'

export const ALL_QUESTIONS: Question[] = [
  ...seedQuestions,
  ...iam_questions,
  ...kms_questions,
  ...waf_shield_cognito_questions,
  ...vpc_security_questions,
  ...secrets_cloudtrail_questions,
  ...ec2_compute_questions,
  ...ec2_autoscaling_questions,
  ...elb_questions,
  ...rds_aurora_questions,
  ...s3_resilience_questions,
  ...sqs_sns_eventbridge_questions,
  ...route53_cloudfront_questions,
  ...dr_strategies_questions,
  ...storage_performance_questions,
  ...database_performance_questions,
  ...network_performance_questions,
  ...serverless_containers_questions,
  ...analytics_streaming_questions,
  ...ec2_pricing_questions,
  ...storage_cost_questions,
  ...database_cost_questions,
  ...network_cost_questions,
  ...cost_tools_questions,
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
