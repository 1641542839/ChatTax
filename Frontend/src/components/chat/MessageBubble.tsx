'use client'

import { Message } from '@/store/chatStore'
import { useChatStore } from '@/store/chatStore'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import { Avatar, Divider, Space, Typography } from 'antd'
import ReactMarkdown from 'react-markdown'
import GenerateChecklistButton from './GenerateChecklistButton'

const { Text } = Typography

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const { getCurrentConversation } = useChatStore()
  const currentConversation = getCurrentConversation()
  
  // Status messages
  const getStatusMessage = () => {
    if (!message.isStreaming) return null
    
    switch (message.status) {
      case 'thinking':
        return 'Thinking...'
      case 'retrieving':
        return 'Retrieving information...'
      case 'generating':
        return 'Generating answer...'
      default:
        return null
    }
  }
  
  const statusMessage = getStatusMessage()

  // Check if should show "Generate Checklist" suggestion
  const shouldShowChecklistSuggestion = () => {
    if (isUser || message.isStreaming) return false
    
    const keywords = [
      'prepare',
      'preparation',
      'materials',
      'documents',
      'files',
      'need',
      'checklist',
      'steps',
      'process',
      'how to',
      'tax return',
      'what do I need',
      'what should I',
      '准备',
      '材料',
      '文件',
      '文档',
      '需要',
      '清单',
      '步骤',
      '流程',
      '如何报税',
      '报税准备',
    ]
    
    return keywords.some((keyword) => message.content.toLowerCase().includes(keyword.toLowerCase()))
  }

  return (
    <div className={`flex gap-4 mb-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <Avatar
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        className={`flex-shrink-0 ${isUser ? 'bg-primary-500' : 'bg-green-500'}`}
        size="large"
      />

      {/* Message Content */}
      <div className={`flex-1 max-w-none ${isUser ? 'text-right' : 'text-left'}`}>
        <div
          className={`inline-block text-left ${
            isUser ? 'text-gray-700' : 'text-gray-800'
          }`}
        >
          <div
            className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate'}`}
          >
          {isUser ? (
            <p className="m-0 whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                // Links - blue and underlined
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  />
                ),
                // Paragraphs - proper spacing
                p: ({ node, ...props }) => (
                  <p {...props} className="mb-4 leading-relaxed" />
                ),
                // Headings
                h1: ({ node, ...props }) => (
                  <h1 {...props} className="text-xl font-bold mb-3 mt-4" />
                ),
                h2: ({ node, ...props }) => (
                  <h2 {...props} className="text-lg font-bold mb-2 mt-3" />
                ),
                h3: ({ node, ...props }) => (
                  <h3 {...props} className="text-base font-semibold mb-2 mt-3" />
                ),
                h4: ({ node, ...props }) => (
                  <h4 {...props} className="text-sm font-semibold mb-2 mt-2" />
                ),
                // Lists - better spacing and alignment
                ul: ({ node, ...props }) => (
                  <ul {...props} className="list-disc ml-6 mb-4 space-y-2" />
                ),
                ol: ({ node, ...props }) => (
                  <ol {...props} className="list-decimal ml-6 mb-4 space-y-3" />
                ),
                li: ({ node, children, ...props }) => (
                  <li {...props} className="pl-2 leading-relaxed">
                    {children}
                  </li>
                ),
                // Horizontal rule
                hr: ({ node, ...props }) => (
                  <hr {...props} className="my-4 border-gray-300" />
                ),
                // Strong/Bold text
                strong: ({ node, ...props }) => (
                  <strong {...props} className="font-semibold" />
                ),
                // Emphasis/Italic text
                em: ({ node, ...props }) => (
                  <em {...props} className="italic text-gray-600" />
                ),
                // Code blocks
                code: ({ node, className, children, ...props }) => {
                  const isInline = !className
                  return isInline ? (
                    <code
                      {...props}
                      className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono"
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      {...props}
                      className="block bg-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto"
                    >
                      {children}
                    </code>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
          </div>

          {/* Status indicator below message content */}
          {message.isStreaming && (
            <div className="mt-3 flex items-center gap-2">
              {/* Status text first */}
              {statusMessage && (
                <span className="text-sm text-gray-500 italic">
                  {statusMessage.replace('...', '')}
                </span>
              )}
              {/* Animated dots */}
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                  style={{ animationDelay: '0.1s' }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          )}

          {/* Timestamp */}
          <p className="mt-2 text-xs text-gray-400">
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>

          {/* AI Suggestions - Generate Checklist */}
          {!isUser && shouldShowChecklistSuggestion() && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  💡 <strong>Smart Suggestion</strong>
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Based on your question, I can generate a personalized task checklist to help you better prepare your tax return
                </Text>
                {currentConversation && (
                  <GenerateChecklistButton messages={currentConversation.messages} />
                )}
              </Space>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
