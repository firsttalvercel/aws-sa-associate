'use client'

import { Headphones, Clock, BookOpen } from 'lucide-react'

const PODCAST_URL = 'https://github.com/firsttalvercel/aws-sa-associate/releases/download/v1.0-podcast/AWS_SAA-C03_Architectural_Logic_and_Traps.m4a'

const TOPICS = [
  'Exam structure and domain weights',
  'IAM policy evaluation order',
  'KMS encryption types and when to use each',
  'VPC security — Security Groups vs NACLs',
  'Multi-AZ vs Read Replicas',
  'Aurora highlights and Global Database',
  'DR strategies — RTO/RPO comparison',
  'EC2 purchasing options and Savings Plans',
  'S3 storage classes and lifecycle rules',
  'SQS Standard vs FIFO, SNS fan-out, EventBridge',
  'Kinesis shards, EFO, and hot partition fixes',
  'CloudWatch vs CloudTrail vs Config',
  'Top 20 exam traps with correct answers',
  'Key numbers to memorize',
]

export default function PodcastPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Podcast</h1>
        <p className="text-gray-500 text-sm mt-1">AI-generated audio study guide — all four domains, exam traps, and key numbers</p>
      </div>

      {/* Player card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Headphones size={28} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">AWS SAA-C03: Architectural Logic and Traps</div>
              <div className="text-orange-100 text-sm mt-1">NotebookLM Audio Overview</div>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <audio
            controls
            className="w-full"
            preload="metadata"
            src={PODCAST_URL}
          >
            Your browser does not support the audio element.
          </audio>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Clock size={12} /> ~25 min</span>
            <span className="flex items-center gap-1"><BookOpen size={12} /> All 4 domains</span>
          </div>
        </div>
      </div>

      {/* Topics covered */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Topics Covered</h2>
        <ul className="space-y-2">
          {TOPICS.map((t, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-xs font-semibold text-orange-600 mt-0.5">{i + 1}</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
