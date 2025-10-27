'use client'

import { useEffect } from 'react'
import { useChecklistStore } from '@/store/checklistStore'
import ConversationHistory from '@/components/chat/ConversationHistory'
import ChatWindow from '@/components/chat/ChatWindow'
import ChecklistProgressWidget from '@/components/chat/ChecklistProgressWidget'

export default function ChatPage() {
  const { loadUserChecklistsFromAPI } = useChecklistStore()

  // 页面加载时尝试加载用户清单（静默失败）
  useEffect(() => {
    loadUserChecklistsFromAPI(1).catch(() => {
      // 静默失败，不影响聊天功能
    })
  }, [loadUserChecklistsFromAPI])

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left Panel - Conversation History & Checklist Widget */}
      <div className="w-80 border-r flex flex-col">
        {/* Checklist Progress Widget */}
        <div className="p-4 border-b bg-gray-50">
          <ChecklistProgressWidget />
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-hidden">
          <ConversationHistory />
        </div>
      </div>

      {/* Right Panel - Chat Window */}
      <div className="flex-1">
        <ChatWindow />
      </div>
    </div>
  )
}
