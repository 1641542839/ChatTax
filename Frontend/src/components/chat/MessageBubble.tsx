'use client'

import { Message } from '@/store/chatStore'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import { Avatar } from 'antd'
import ReactMarkdown from 'react-markdown'

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <Avatar
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        className={`flex-shrink-0 ${isUser ? 'bg-primary-500' : 'bg-green-500'}`}
        size="large"
      />

      {/* Message Content */}
      <div
        className={`max-w-[70%] rounded-lg p-4 ${
          isUser
            ? 'bg-primary-500 text-white'
            : 'bg-white text-gray-800 shadow-sm'
        }`}
      >
        <div
          className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}
        >
          {isUser ? (
            <p className="m-0 whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>

        {/* Streaming indicator */}
        {message.isStreaming && (
          <div className="mt-2 flex items-center gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500" />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-primary-500"
              style={{ animationDelay: '0.1s' }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-primary-500"
              style={{ animationDelay: '0.2s' }}
            />
          </div>
        )}

        {/* Timestamp */}
        <p
          className={`mt-2 text-xs ${isUser ? 'text-blue-100' : 'text-gray-400'}`}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
