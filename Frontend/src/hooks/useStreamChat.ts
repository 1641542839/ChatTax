'use client'

import { useCallback } from 'react'
import { useChatStore } from '@/store/chatStore'

interface StreamChatOptions {
  onChunk?: (chunk: string) => void
  onComplete?: () => void
  onError?: (error: Error) => void
}

export function useStreamChat() {
  const { addMessage, appendToMessage, setMessageStreaming } = useChatStore()

  const sendMessage = useCallback(
    async (
      conversationId: string,
      userMessage: string,
      options?: StreamChatOptions
    ) => {
      try {
        // Add user message
        addMessage(conversationId, {
          role: 'user',
          content: userMessage,
          timestamp: new Date(),
        })

        // Create assistant message placeholder
        const assistantMessageId = addMessage(conversationId, {
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true,
        })

        setMessageStreaming(conversationId, assistantMessageId, true)

        // Start SSE stream
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: userMessage }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('No response body')
        }

        // Read the stream
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'chunk') {
                appendToMessage(
                  conversationId,
                  assistantMessageId,
                  data.content
                )
                options?.onChunk?.(data.content)
              } else if (data.type === 'done') {
                setMessageStreaming(conversationId, assistantMessageId, false)
                options?.onComplete?.()
              } else if (data.type === 'error') {
                setMessageStreaming(conversationId, assistantMessageId, false)
                options?.onError?.(new Error(data.message))
              }
            }
          }
        }
      } catch (error) {
        console.error('Stream chat error:', error)
        options?.onError?.(
          error instanceof Error ? error : new Error('Unknown error')
        )
      }
    },
    [addMessage, appendToMessage, setMessageStreaming]
  )

  return { sendMessage }
}
