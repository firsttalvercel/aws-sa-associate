'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { CHEAT_SECTIONS } from '../../data/cheatsheet'
import type { ContentBlock, TableBlock, BulletsBlock, TrapsBlock } from '../../data/cheatsheet'

function TableBlockView({ block }: { block: TableBlock }) {
  return (
    <div>
      {block.title && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{block.title}</h3>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              {block.headers.map((h, i) => (
                <th key={i} className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                {row.map((cell, j) => (
                  <td key={j} className={`py-2 pr-4 text-xs text-gray-700 align-top ${j === 0 ? 'font-medium text-gray-800 whitespace-nowrap' : ''}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BulletsBlockView({ block }: { block: BulletsBlock }) {
  return (
    <div>
      {block.title && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{block.title}</h3>}
      <ul className="space-y-1.5">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TrapsBlockView({ block }: { block: TrapsBlock }) {
  return (
    <div>
      {block.title && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{block.title}</h3>}
      <div className="space-y-3">
        {block.items.map((item, i) => (
          <div key={i} className="text-sm">
            <div className="text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-1">
              <span className="font-medium">Trap: </span>{item.trap}
            </div>
            <div className="text-green-800 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <span className="font-medium">Correct: </span>{item.correct}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Block({ block }: { block: ContentBlock }) {
  if (block.type === 'table') return <TableBlockView block={block} />
  if (block.type === 'bullets') return <BulletsBlockView block={block} />
  if (block.type === 'traps') return <TrapsBlockView block={block} />
  return null
}

export default function CheatSheetPage() {
  const [activeId, setActiveId] = useState(CHEAT_SECTIONS[0].id)
  const active = CHEAT_SECTIONS.find(s => s.id === activeId)!

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cheat Sheet</h1>
        <p className="text-gray-500 text-sm mt-1">All high-value facts, decision tables, and exam traps in one place.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="w-36 flex-shrink-0 space-y-0.5">
          {CHEAT_SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                activeId === s.id
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {s.id === 'traps' && <AlertTriangle size={12} className={activeId === s.id ? 'text-amber-500' : 'text-gray-400'} />}
              {s.title}
              {activeId === s.id && <ChevronRight size={12} className="ml-auto" />}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">{active.title}</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{active.blocks.length} section{active.blocks.length !== 1 ? 's' : ''}</span>
          </div>

          {active.blocks.map((block, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <Block block={block} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
