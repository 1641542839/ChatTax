/**
 * SessionListSidebar Component
 * 
 * Displays list of user's chat sessions with ability to switch between them,
 * create new sessions, and delete old sessions.
 */

'use client';

import { useState, useEffect } from 'react';
import { List, Button, Empty, Spin, Modal, message, Tooltip, Badge } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useSessionList } from '@/hooks/useSession';
import { useSessionContext } from '@/contexts/SessionContext';
import { sessionStorage } from '@/services/sessionService';
import type { SessionListItem } from '@/types/session';

interface SessionListSidebarProps {
  /** CSS class name */
  className?: string;
}

/**
 * Session List Sidebar Component
 * 
 * Shows all user sessions with metadata and allows switching between them.
 * 
 * @example
 * ```tsx
 * <div className="flex">
 *   <SessionListSidebar className="w-80 border-r" />
 *   <SessionChatWindow />
 * </div>
 * ```
 */
export default function SessionListSidebar({ className = '' }: SessionListSidebarProps) {
  const { sessions, loading, loadSessions, deleteSession } = useSessionList();
  const { session: currentSession, createSession, loadSession, clearSession } = useSessionContext();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for session creation and update events from chat window
  useEffect(() => {
    const handleSessionCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[SessionListSidebar] Session created event received:', customEvent.detail);
      loadSessions(); // Refresh list when new session is created
    };

    const handleSessionUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[SessionListSidebar] Session updated event received:', customEvent.detail);
      loadSessions(); // Refresh list when session is updated (title/time changed)
    };

    window.addEventListener('sessionCreated', handleSessionCreated);
    window.addEventListener('sessionUpdated', handleSessionUpdated);
    return () => {
      window.removeEventListener('sessionCreated', handleSessionCreated);
      window.removeEventListener('sessionUpdated', handleSessionUpdated);
    };
  }, [loadSessions]);

  const handleCreateNew = async () => {
    console.log('handleCreateNew clicked - creating session manually');
    try {
      const newSession = await createSession();
      console.log('New session created:', newSession?.session_id);
      message.success('New session created');
      loadSessions(); // Refresh list
    } catch (error) {
      console.error('Failed to create session:', error);
      message.error('Failed to create session');
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    if (currentSession?.session_id === sessionId) return;

    try {
      await loadSession(sessionId);
    } catch (error) {
      message.error('Failed to load session');
    }
  };

  const handleDeleteClick = (sessionId: string) => {
    console.log('[SessionListSidebar] Delete button clicked for:', sessionId);
    console.log('[SessionListSidebar] Current sessions count:', sessions.length);
    setSessionToDelete(sessionId);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    
    console.log('[SessionListSidebar] User confirmed deletion, starting...');
    setDeletingId(sessionToDelete);
    
    try {
      console.log('[SessionListSidebar] Calling deleteSession API...');
      await deleteSession(sessionToDelete);
      console.log('[SessionListSidebar] Delete API completed successfully');
      
      message.success('Session deleted successfully');
      
      // If deleted session is current, clear it from context
      if (currentSession?.session_id === sessionToDelete) {
        console.log('[SessionListSidebar] Clearing current session from context');
        clearSession();
      }
      
      // Refresh the session list
      console.log('[SessionListSidebar] Reloading sessions...');
      await loadSessions();
      console.log('[SessionListSidebar] Sessions reloaded');
      
      setDeleteModalVisible(false);
      setSessionToDelete(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete session';
      console.error('[SessionListSidebar] Delete error:', error);
      message.error(`Failed to delete: ${errorMsg}`);
    } finally {
      setDeletingId(null);
      console.log('[SessionListSidebar] Delete operation completed');
    }
  };

  const handleCancelDelete = () => {
    console.log('[SessionListSidebar] User cancelled deletion');
    setDeleteModalVisible(false);
    setSessionToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Debug: Log time difference for first render
    if (sessions.length > 0 && sessions[0].updated_at === dateString) {
      // console.log('[SessionListSidebar] Time debug:', {
      //   dateString,
      //   parsedDate: date.toISOString(),
      //   now: now.toISOString(),
      //   diffMs,
      //   diffHours
      // });
    }

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderSessionItem = (item: SessionListItem) => {
    const isActive = currentSession?.session_id === item.session_id;
    const isDeleting = deletingId === item.session_id;  // Compare by session_id, not id

    return (
      <List.Item
        key={item.session_id}  // Use session_id as key for React
        className={`cursor-pointer transition-all hover:bg-blue-50 ${
          isActive ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
        }`}
        onClick={() => handleSelectSession(item.session_id)}
        actions={[
          <Tooltip title="Delete session" key="delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={isDeleting}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(item.session_id);
              }}
            />
          </Tooltip>,
        ]}
      >
        <List.Item.Meta
          avatar={
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <MessageOutlined className="text-blue-600" />
            </div>
          }
          title={
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">
                Session {item.session_id.slice(0, 8)}
              </span>
              {item.checklist_id && (
                <Tooltip title="Checklist generated">
                  <CheckCircleOutlined className="text-green-500" />
                </Tooltip>
              )}
            </div>
          }
          description={
            <div className="space-y-1">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <ClockCircleOutlined />
                {formatDate(item.updated_at)}
              </div>
              <div className="text-xs text-gray-600">
                <Badge count={item.message_count} showZero color="blue" />
                <span className="ml-2">messages</span>
              </div>
              {item.last_message && (
                <div className="text-xs text-gray-500 truncate max-w-[180px]">
                  {item.last_message}
                </div>
              )}
            </div>
          }
        />
      </List.Item>
    );
  };

  return (
    <div className={`flex flex-col bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">Chat Sessions</h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateNew}
            size="small"
          >
            New
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Your conversation history with ChatTax AI
        </p>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <Spin tip="Loading sessions..." />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex items-center justify-center h-40 px-4">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-2">No sessions yet</p>
                  <p className="text-gray-400 text-xs">
                    Create a new session to start chatting
                  </p>
                </div>
              }
            />
          </div>
        ) : (
          <List
            dataSource={sessions}
            renderItem={renderSessionItem}
            size="small"
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} total
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Session"
        open={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true, loading: deletingId !== null }}
      >
        <p>Are you sure you want to delete this conversation?</p>
        <p className="text-gray-500 text-sm mt-2">This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
