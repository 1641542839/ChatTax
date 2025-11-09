'use client'

import { useEffect } from 'react'
import { useChecklistStore } from '@/store/checklistStore'
import { SessionProvider } from '@/contexts/SessionContext'
import SessionListSidebar from '@/components/chat/SessionListSidebar'
import SessionChatWindow from '@/components/chat/SessionChatWindow'
import ChecklistProgressWidget from '@/components/chat/ChecklistProgressWidget'

export default function ChatPage() {
  const { loadUserChecklistsFromAPI } = useChecklistStore()

  // Load user checklist on page load (fail silently)
  useEffect(() => {
    loadUserChecklistsFromAPI(1).catch(() => {
      // Silent failure, doesn't affect chat functionality
    })
  }, [loadUserChecklistsFromAPI])

  return (
    <SessionProvider autoLoad={true}>
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Session List & Checklist Widget */}
        <div className="w-80 border-r flex flex-col">
          {/* Checklist Progress Widget */}
          <div className="p-4 border-b bg-gray-50">
            <ChecklistProgressWidget />
          </div>

          {/* Session List Sidebar */}
          <div className="flex-1 overflow-hidden">
            <SessionListSidebar />
          </div>
        </div>

        {/* Right Panel - Chat Window */}
        <div className="flex-1">
          <SessionChatWindow />
        </div>
      </div>
    </SessionProvider>
  )
}
