import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Simulated LLM streaming response
// In production, replace this with actual LLM API calls (OpenAI, Anthropic, etc.)
async function* simulateLLMStream(prompt: string) {
  const responses = [
    'Thank you for your tax question. ',
    "I'll help you understand this topic. ",
    '\n\n',
    'Based on current tax regulations, ',
    'there are several important points to consider:\n\n',
    '1. **Deductions**: ',
    'You may be eligible for various tax deductions depending on your situation.\n\n',
    '2. **Credits**: ',
    'Tax credits can directly reduce your tax liability.\n\n',
    '3. **Filing Status**: ',
    'Your filing status significantly impacts your tax calculations.\n\n',
    'For specific advice regarding your question about "',
    prompt.slice(0, 50),
    '", I recommend consulting with a tax professional for personalized guidance.',
  ]

  for (const chunk of responses) {
    yield chunk
    // Simulate network delay
    await new Promise((resolve) =>
      setTimeout(resolve, 50 + Math.random() * 100)
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return new Response('Invalid message', { status: 400 })
    }

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial connection message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`)
          )

          // Stream the LLM response
          for await (const chunk of simulateLLMStream(message)) {
            const data = {
              type: 'chunk',
              content: chunk,
            }
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            )
          }

          // Send completion message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          )

          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message: 'Stream error' })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
