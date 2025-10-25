'use client'

import { useState } from 'react'
import {
  Card,
  Input,
  Button,
  Typography,
  Space,
  Avatar,
  Divider,
  Empty,
} from 'antd'
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  ClearOutlined,
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Thank you for your question about "${input}". I'm here to help you with tax-related queries. This is a demo response. In production, this would connect to an AI API to provide accurate tax information.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setLoading(false)
    }, 1000)
  }

  const handleClear = () => {
    setMessages([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Card className="shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Title level={2} className="mb-2">
                💬 AI Tax Assistant
              </Title>
              <Paragraph className="text-gray-600">
                Ask me anything about taxes, deductions, and regulations
              </Paragraph>
            </div>
            {messages.length > 0 && (
              <Button
                icon={<ClearOutlined />}
                onClick={handleClear}
                danger
                type="text"
              >
                Clear Chat
              </Button>
            )}
          </div>

          <Divider />

          {/* Messages Area */}
          <div className="mb-6 h-[500px] overflow-y-auto rounded-lg bg-gray-50 p-4">
            {messages.length === 0 ? (
              <Empty
                description="No messages yet. Start a conversation!"
                className="mt-32"
              />
            ) : (
              <Space direction="vertical" size="large" className="w-full">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex max-w-[80%] gap-3 ${
                        message.role === 'user'
                          ? 'flex-row-reverse'
                          : 'flex-row'
                      }`}
                    >
                      <Avatar
                        icon={
                          message.role === 'user' ? (
                            <UserOutlined />
                          ) : (
                            <RobotOutlined />
                          )
                        }
                        className={
                          message.role === 'user'
                            ? 'bg-primary-500'
                            : 'bg-green-500'
                        }
                      />
                      <div
                        className={`rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-primary-500 text-white'
                            : 'bg-white'
                        }`}
                      >
                        <Text
                          className={
                            message.role === 'user'
                              ? 'text-white'
                              : 'text-gray-800'
                          }
                        >
                          {message.content}
                        </Text>
                        <div className="mt-2">
                          <Text
                            type="secondary"
                            className={`text-xs ${
                              message.role === 'user'
                                ? 'text-blue-100'
                                : 'text-gray-400'
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString()}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3">
                      <Avatar
                        icon={<RobotOutlined />}
                        className="bg-green-500"
                      />
                      <div className="rounded-lg bg-white p-4">
                        <Text className="text-gray-800">Typing...</Text>
                      </div>
                    </div>
                  </div>
                )}
              </Space>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Type your tax question here... (Press Enter to send, Shift+Enter for new line)"
              autoSize={{ minRows: 2, maxRows: 4 }}
              className="flex-1"
              disabled={loading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
              size="large"
              className="h-auto"
            >
              Send
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
