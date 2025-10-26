'use client'

import { useChatStore } from '@/store/chatStore'
import {
  PlusOutlined,
  DeleteOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import { Button, Empty, Popconfirm } from 'antd'

export default function ConversationHistory() {
  const {
    conversations,
    currentConversationId,
    createConversation,
    setCurrentConversation,
    deleteConversation,
  } = useChatStore()

  const handleNewChat = () => {
    createConversation()
  }

  const handleSelectConversation = (id: string) => {
    setCurrentConversation(id)
  }

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteConversation(id)
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleNewChat}
          block
          size="large"
        >
          New Chat
        </Button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <Empty
            description="No conversations yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="mt-8"
          />
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`group cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md ${
                  currentConversationId === conv.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-primary-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <MessageOutlined className="text-primary-500" />
                      <h3 className="truncate text-sm font-medium text-gray-900">
                        {conv.title}
                      </h3>
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {conv.messages.length} messages
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Popconfirm
                    title="Delete conversation?"
                    description="This action cannot be undone."
                    onConfirm={(e) => handleDeleteConversation(e!, conv.id)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
