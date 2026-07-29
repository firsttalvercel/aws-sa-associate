import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
})

export async function POST(req: NextRequest) {
  const { question, userQuestion, history } = await req.json()

  const systemPrompt = `You are an expert AWS Solutions Architect helping a student prepare for the SAA-C03 exam.

The student is reviewing this practice question:

QUESTION: ${question.stem}

OPTIONS:
${question.options.map((o: { id: string; text: string }) => `${o.id}. ${o.text}`).join('\n')}

CORRECT ANSWER: ${question.correct.join(', ')}

EXPLANATION: ${question.explanation}

DISTRACTOR NOTES:
${Object.entries(question.distractors).map(([k, v]) => `${k}: ${v}`).join('\n')}

Your role:
- Answer questions about this question, the services involved, and related AWS concepts
- Be concise but precise — the student is in exam prep mode, not a lecture
- When comparing services, use short tables if it helps
- If asked for a diagram, describe the architecture in a structured text format (boxes and arrows style)
- If asked for a similar question, generate one in the exact same format: scenario + constraint keyword, four options, and state the correct answer with a brief explanation
- Always ground answers in what matters for the SAA-C03 exam`

  const messages = [
    ...(history || []),
    { role: 'user' as const, content: userQuestion },
  ]

  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
