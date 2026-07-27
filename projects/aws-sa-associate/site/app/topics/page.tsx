import Link from 'next/link'
import { TOPICS, CATEGORIES } from '../../data/topics'
import { BookOpen } from 'lucide-react'

const CATEGORY_ICONS: Record<string, string> = {
  Security: '🔒',
  Networking: '🌐',
  Database: '🗄️',
  Compute: '⚡',
  Storage: '📦',
  Integration: '🔗',
  Monitoring: '📊',
  Cost: '💰',
}

export default function TopicsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Topics & Cheat Sheets</h1>
        <p className="text-gray-500 text-sm mt-1">Key facts, exam traps, comparison tables, and keyword signals per service.</p>
      </div>

      {CATEGORIES.map(cat => {
        const topics = TOPICS.filter(t => t.category === cat)
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{CATEGORY_ICONS[cat] ?? '📋'}</span>
              <h2 className="text-sm font-semibold text-gray-700">{cat}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {topics.map(topic => (
                <Link
                  key={topic.slug}
                  href={`/topics/${topic.slug}`}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">{topic.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{topic.keyFacts.length} facts · {topic.examTraps.length} traps</div>
                    </div>
                    <BookOpen size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors mt-0.5" />
                  </div>
                  {topic.keywordSignals && topic.keywordSignals.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {topic.keywordSignals.slice(0, 3).map(sig => (
                        <span key={sig.keyword} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{sig.service}</span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
