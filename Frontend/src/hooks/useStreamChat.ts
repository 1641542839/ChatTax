'use client'

import { useCallback } from 'react'
import { useChatStore } from '@/store/chatStore'

interface StreamChatOptions {
  onChunk?: (chunk: string) => void
  onComplete?: () => void
  onError?: (error: Error) => void
}

export function useStreamChat() {
  const { addMessage, appendToMessage, setMessageStatus, setMessageStreaming } = useChatStore()

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
          status: 'thinking',
        })

        setMessageStreaming(conversationId, assistantMessageId, true)

        // Show "Thinking..." status
        setMessageStatus(conversationId, assistantMessageId, 'thinking')

        // Connect directly to backend to avoid buffering
        const response = await fetch('http://localhost:8000/api/chat/stream', {
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

        // Read the stream with proper buffering
        let buffer = ''
        let chunkCount = 0
        let hasStartedGenerating = false
        
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            console.log(`Stream complete. Total chunks received: ${chunkCount}`)
            setMessageStatus(conversationId, assistantMessageId, 'done')
            break
          }

          // Decode chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk
          
          // Process complete lines from buffer
          const lines = buffer.split('\n')
          
          // Keep the last incomplete line in buffer
          buffer = lines.pop() || ''
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'chunk') {
                  // Switch to "Generating..." status on first chunk
                  if (!hasStartedGenerating) {
                    setMessageStatus(conversationId, assistantMessageId, 'generating')
                    hasStartedGenerating = true
                  }
                  
                  chunkCount++
                  console.log(`Chunk ${chunkCount}:`, data.content.substring(0, 30))
                  
                  // Use requestAnimationFrame to ensure immediate rendering
                  requestAnimationFrame(() => {
                    appendToMessage(
                      conversationId,
                      assistantMessageId,
                      data.content
                    )
                    options?.onChunk?.(data.content)
                  })
                } else if (data.type === 'done') {
                  console.log('Stream done event received')
                  setMessageStatus(conversationId, assistantMessageId, 'done')
                  setMessageStreaming(conversationId, assistantMessageId, false)
                  options?.onComplete?.()
                } else if (data.type === 'error') {
                  console.error('Stream error:', data.message)
                  setMessageStatus(conversationId, assistantMessageId, 'done')
                  setMessageStreaming(conversationId, assistantMessageId, false)
                  options?.onError?.(new Error(data.message))
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', line, e)
              }
            }
          }
        }
        
        // Process any remaining data in buffer
        if (buffer.startsWith('data: ')) {
          try {
            const data = JSON.parse(buffer.slice(6))
            if (data.type === 'chunk') {
              appendToMessage(conversationId, assistantMessageId, data.content)
            }
          } catch (e) {
            console.error('Failed to parse final SSE data:', e)
          }
        }
      } catch (error) {
        console.error('Stream chat error:', error)
        options?.onError?.(
          error instanceof Error ? error : new Error('Unknown error')
        )
      }
    },
    [addMessage, appendToMessage, setMessageStatus, setMessageStreaming]
  )

  return { sendMessage }
}
