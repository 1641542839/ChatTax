'use client'

import ConversationHistory from '@/components/chat/ConversationHistory'
import ChatWindow from '@/components/chat/ChatWindow'

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left Panel - Conversation History */}
      <div className="w-80 border-r">
        <ConversationHistory />
      </div>

      {/* Right Panel - Chat Window */}
      <div className="flex-1">
        <ChatWindow />
      </div>
    </div>
  )
}
