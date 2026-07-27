import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTopicBySlug, TOPICS } from '../../../data/topics'
import { ChevronRight, AlertTriangle, Zap } from 'lucide-react'

export function generateStaticParams() {
  return TOPICS.map(t => ({ slug: t.slug }))
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const topic = getTopicBySlug(slug)
  if (!topic) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <Link href="/topics" className="hover:text-gray-600">Topics</Link>
          <ChevronRight size={12} />
          <span className="text-gray-600">{topic.title}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{topic.title}</h1>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{topic.category}</span>
      </div>

      {/* Quick Quiz CTA */}
      <Link
        href={`/scenarios?topic=${topic.slug}`}
        className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 hover:bg-blue-100 transition-colors"
      >
        <Zap size={16} className="text-blue-600" />
        <span className="text-sm font-medium text-blue-800">Practice questions on {topic.title}</span>
        <ChevronRight size={14} className="text-blue-400 ml-auto" />
      </Link>

      {/* Key Facts */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Key Facts</h2>
        <ul className="space-y-2">
          {topic.keyFacts.map((fact, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
              {fact}
            </li>
          ))}
        </ul>
      </div>

      {/* Exam Traps */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-amber-500" />
          <h2 className="text-sm font-semibold text-gray-700">Exam Traps</h2>
        </div>
        <div className="space-y-3">
          {topic.examTraps.map((trap, i) => (
            <div key={i} className="text-sm">
              <div className="text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-1">
                <span className="font-medium">Trap: </span>{trap.trap}
              </div>
              <div className="text-green-800 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                <span className="font-medium">Correct: </span>{trap.correct}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparisons */}
      {topic.comparisons?.map((comp, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{comp.title}</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 w-32">Feature</th>
                {comp.headers.slice(1).map((h, j) => (
                  <th key={j} className="text-left py-2 pr-4 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comp.rows.map((row, j) => (
                <tr key={j} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-4 text-xs font-medium text-gray-600 w-32">{row.label}</td>
                  {row.values.map((v, k) => (
                    <td key={k} className="py-2 pr-4 text-xs text-gray-700">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Keyword Signals */}
      {topic.keywordSignals && topic.keywordSignals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Keyword Signals</h2>
          <div className="space-y-2">
            {topic.keywordSignals.map((sig, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-gray-600 italic flex-1">"{sig.keyword}"</span>
                <ChevronRight size={12} className="text-gray-400" />
                <span className="font-semibold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded">{sig.service}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
