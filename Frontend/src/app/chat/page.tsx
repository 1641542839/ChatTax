'use client'

import { useEffect } from 'react'
import { SessionProvider } from '@/contexts/SessionContext'
import SessionListSidebar from '@/components/chat/SessionListSidebar'
import SessionChatWindow from '@/components/chat/SessionChatWindow'
import TaxInfoCollectionWidget from '@/components/chat/TaxInfoCollectionWidget'

export default function ChatPage() {
  // Debug: Track page mount/unmount
  useEffect(() => {
    console.log('[ChatPage] Component mounted');
    return () => {
      console.log('[ChatPage] Component unmounting');
    };
  }, []);

  return (
    <SessionProvider autoLoad={false}>
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Session List & Tax Info Collection Widget */}
        <div className="w-80 border-r flex flex-col">
          {/* Tax Info Collection Widget */}
          <div className="p-4 border-b bg-gray-50">
            <TaxInfoCollectionWidget />
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
