'use client'

import { useState, useRef, useEffect } from 'react'
import { BotMessageSquare, Send, X, ChevronDown, Loader2 } from 'lucide-react'
import type { Question } from '../lib/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  'Why not the other options?',
  'Compare the services involved',
  'Give me a similar question',
  'Explain the key concept',
]

interface Props {
  question: Question
}

export function AskArchitect({ question }: Props) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset conversation when question changes
  useEffect(() => {
    setHistory([])
    setInput('')
  }, [question.id])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const send = async (text: string) => {
    if (!text.trim() || streaming) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    setHistory(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setHistory(prev => [...prev, assistantMsg])

    try {
      const res = await fetch('/api/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userQuestion: text.trim(),
          history: history.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `API error ${res.status}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setHistory(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: accumulated }
          return updated
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setHistory(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: `Error: ${msg}` }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="mt-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 border border-violet-200 text-violet-700 rounded-xl text-sm font-semibold hover:bg-violet-100 transition-colors w-full justify-center"
        >
          <BotMessageSquare size={15} />
          Ask the Architect
        </button>
      ) : (
        <div className="border border-violet-200 rounded-xl overflow-hidden bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-violet-600 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BotMessageSquare size={14} />
              Ask the Architect
            </div>
            <button onClick={() => setOpen(false)} className="text-violet-200 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {history.length === 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center pt-2">Ask anything about this question or the services involved.</p>
                <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                  {QUICK_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="text-xs px-2.5 py-1 bg-white border border-violet-200 text-violet-700 rounded-full hover:bg-violet-50 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              history.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] text-sm rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                  }`}>
                    {msg.content}
                    {msg.role === 'assistant' && msg.content === '' && (
                      <Loader2 size={12} className="animate-spin text-gray-400" />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts after first message */}
          {history.length > 0 && !streaming && (
            <div className="flex gap-1.5 px-3 py-2 border-t border-gray-100 flex-wrap bg-gray-50">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-xs px-2 py-0.5 bg-white border border-violet-200 text-violet-600 rounded-full hover:bg-violet-50 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 px-3 py-2.5 border-t border-gray-200 bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder="Ask anything…"
              disabled={streaming}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              className="p-2 bg-violet-600 text-white rounded-lg disabled:opacity-40 hover:bg-violet-700 transition-colors"
            >
              {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
