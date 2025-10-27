'use client'

import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useStreamChat } from '@/hooks/useStreamChat'
import MessageBubble from './MessageBubble'
import { Input, Button, Empty } from 'antd'
import { SendOutlined } from '@ant-design/icons'

const { TextArea } = Input

export default function ChatWindow() {
  const {
    currentConversationId,
    getCurrentConversation,
    createConversation,
    streamingMessageId,
  } = useChatStore()
  const { sendMessage } = useStreamChat()
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentConversation = getCurrentConversation()

  // 检查是否有待发送的问题（来自 Checklist）
  useEffect(() => {
    const pendingQuestion = localStorage.getItem('pendingQuestion')
    if (pendingQuestion) {
      // 清除 localStorage
      localStorage.removeItem('pendingQuestion')
      
      // 设置输入框内容
      setInput(pendingQuestion)
      
      // 延迟自动发送（让用户看到问题）
      setTimeout(() => {
        handleSendPendingQuestion(pendingQuestion)
      }, 500)
    }
  }, [])

  // 自动发送待定问题
  const handleSendPendingQuestion = async (question: string) => {
    if (!question.trim()) return

    let convId = currentConversationId

    // Create new conversation if none exists
    if (!convId) {
      convId = createConversation()
    }

    setInput('')
    setIsSending(true)

    try {
      await sendMessage(convId, question, {
        onComplete: () => {
          setIsSending(false)
        },
        onError: (error) => {
          console.error('Send message error:', error)
          setIsSending(false)
        },
      })
    } catch (error) {
      console.error('Send message error:', error)
      setIsSending(false)
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    let convId = currentConversationId

    // Create new conversation if none exists
    if (!convId) {
      convId = createConversation()
    }

    const message = input.trim()
    setInput('')
    setIsSending(true)

    try {
      await sendMessage(convId, message, {
        onComplete: () => {
          setIsSending(false)
        },
        onError: (error) => {
          console.error('Send message error:', error)
          setIsSending(false)
        },
      })
    } catch (error) {
      console.error('Send message error:', error)
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {!currentConversation || currentConversation.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Empty
              description={
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-semibold text-gray-700">
                    Welcome to ChatTax AI Assistant
                  </h3>
                  <p className="text-gray-500">
                    Start a conversation by typing your tax question below
                  </p>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-6">
            {currentConversation.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4 shadow-lg">
        <div className="mx-auto max-w-4xl">
          <div className="flex gap-2">
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a tax question... (Press Enter to send, Shift+Enter for new line)"
              autoSize={{ minRows: 2, maxRows: 6 }}
              disabled={isSending || !!streamingMessageId}
              className="flex-1"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={isSending || !!streamingMessageId}
              disabled={!input.trim()}
              size="large"
              className="h-auto px-6"
            >
              Send
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            ChatTax AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  )
}
