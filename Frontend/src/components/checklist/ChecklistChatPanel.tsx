/**
 * ChecklistChatPanel Component
 * 
 * Floating chat panel that can be integrated into checklist detail page.
 * Allows users to ask questions about checklist items and get smart updates.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Drawer, Badge, Tooltip, message, Tag } from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  CloseOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useSessionContext } from '@/contexts/SessionContext';
import { IntentType, type SessionMessage } from '@/types/session';

const { TextArea } = Input;

interface ChecklistChatPanelProps {
  /** Checklist ID for context */
  checklistId: string;
  /** Whether to show as floating button or embedded panel */
  mode?: 'floating' | 'embedded';
  /** Callback when checklist should be regenerated */
  onRegenerateRequest?: () => void;
}

/**
 * Floating Chat Panel for Checklist Page
 * 
 * Provides contextual help and smart checklist updates.
 * 
 * @example
 * ```tsx
 * // Floating mode (default)
 * <ChecklistChatPanel 
 *   checklistId={checklistId}
 *   onRegenerateRequest={() => refetchChecklist()}
 * />
 * 
 * // Embedded mode
 * <ChecklistChatPanel 
 *   checklistId={checklistId}
 *   mode="embedded"
 * />
 * ```
 */
export default function ChecklistChatPanel({
  checklistId,
  mode = 'floating',
  onRegenerateRequest,
}: ChecklistChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [lastIntent, setLastIntent] = useState<IntentType | null>(null);
  const [shouldRegenerate, setShouldRegenerate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    session,
    messages,
    createSession,
    sendMessage,
    linkChecklist,
  } = useSessionContext();

  // Initialize session and link to checklist (only when necessary)
  useEffect(() => {
    if (!session) {
      console.log('[ChecklistChatPanel] No session, creating new one');
      createSession().then((newSession) => {
        if (newSession) {
          linkChecklist(checklistId);
        }
      });
    } else if (!session.checklist_id || session.checklist_id !== checklistId) {
      console.log('[ChecklistChatPanel] Linking existing session to checklist');
      linkChecklist(checklistId);
    }
  // Only re-run when session or checklistId changes, not when functions change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.session_id, checklistId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const content = input.trim();
    setInput('');
    setIsSending(true);
    setStreamingMessage('');
    setLastIntent(null);
    setShouldRegenerate(false);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: content,
          session_id: session?.session_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);

            if (event.type === 'chunk') {
              setStreamingMessage((prev) => prev + event.content);
            } else if (event.type === 'metadata') {
              if (event.intent) {
                setLastIntent(event.intent.intent);
                setShouldRegenerate(event.should_regenerate || false);
              }
            } else if (event.type === 'done') {
              await sendMessage(content);
              setStreamingMessage('');
              
              // Show regenerate prompt if needed
              if (shouldRegenerate && onRegenerateRequest) {
                message.info({
                  content: (
                    <div>
                      <p>New information detected. Would you like to update your checklist?</p>
                      <Button
                        type="primary"
                        size="small"
                        onClick={onRegenerateRequest}
                        className="mt-2"
                      >
                        Update Checklist
                      </Button>
                    </div>
                  ),
                  duration: 10,
                });
              }
            }
          } catch (e) {
            console.error('Parse SSE error:', e);
          }
        }
      }
    } catch (err) {
      console.error('Send message error:', err);
      message.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getIntentTag = (intent: IntentType) => {
    const intentConfig = {
      [IntentType.EXPLAIN_ITEM]: { color: 'blue', icon: <QuestionCircleOutlined />, label: 'Explaining' },
      [IntentType.NEW_INFO]: { color: 'green', icon: <BulbOutlined />, label: 'New Info' },
      [IntentType.UPDATE_REQUEST]: { color: 'orange', icon: <BulbOutlined />, label: 'Update Request' },
      [IntentType.GENERAL]: { color: 'default', icon: <MessageOutlined />, label: 'General' },
    };

    const config = intentConfig[intent];
    return (
      <Tag color={config.color} icon={config.icon} className="text-xs">
        {config.label}
      </Tag>
    );
  };

  const renderMessage = (msg: SessionMessage, index: number) => {
    const isUser = msg.role === 'user';
    return (
      <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
        <div
          className={`max-w-[80%] rounded-lg px-3 py-2 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
          <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {new Date(msg.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  const chatContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <MessageOutlined className="text-xl" />
            <div>
              <h3 className="font-semibold">Ask About This Checklist</h3>
              <p className="text-xs text-blue-100">Get help or request updates</p>
            </div>
          </div>
          {mode === 'floating' && (
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-white hover:bg-white/20"
            />
          )}
        </div>
        {lastIntent && (
          <div className="mt-2">
            {getIntentTag(lastIntent)}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageOutlined className="text-4xl mb-2" />
            <p className="text-sm">Ask me anything about your tax checklist!</p>
            <div className="mt-4 text-xs text-left space-y-2">
              <p className="font-semibold">Try asking:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>"What does W-2 form mean?"</li>
                <li>"I also have rental income, can you update?"</li>
                <li>"Do I need to file quarterly taxes?"</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => renderMessage(msg, idx))}
            {streamingMessage && (
              <div className="flex justify-start mb-3">
                <div className="max-w-[80%] rounded-lg px-3 py-2 bg-gray-100 text-gray-800">
                  <div className="text-sm whitespace-pre-wrap">{streamingMessage}</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question about your checklist..."
            autoSize={{ minRows: 1, maxRows: 3 }}
            disabled={isSending}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={isSending}
            disabled={!input.trim()}
          />
        </div>
      </div>
    </div>
  );

  if (mode === 'embedded') {
    return <Card className="h-full" bodyStyle={{ padding: 0, height: '100%' }}>{chatContent}</Card>;
  }

  // Floating mode
  return (
    <>
      <Tooltip title="Ask about this checklist" placement="left">
        <Badge count={messages.length} offset={[-5, 5]}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<MessageOutlined />}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 w-14 h-14 shadow-2xl hover:shadow-3xl transition-all"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
            }}
          />
        </Badge>
      </Tooltip>

      <Drawer
        title={null}
        placement="right"
        onClose={() => setIsOpen(false)}
        open={isOpen}
        width={400}
        bodyStyle={{ padding: 0 }}
        headerStyle={{ display: 'none' }}
      >
        {chatContent}
      </Drawer>
    </>
  );
}
