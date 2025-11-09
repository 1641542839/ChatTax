/**
 * SessionChatWindow Component
 * 
 * Enhanced chat window with session management, multi-turn conversation,
 * intent classification, and smart checklist generation.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Input, Button, Empty, Badge, Tag, Spin } from 'antd';
import { SendOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useSessionContext } from '@/contexts/SessionContext';
import SmartGenerateButton from './SmartGenerateButton';
import { IntentType, type SessionMessage } from '@/types/session';

const { TextArea } = Input;

interface MessageBubbleProps {
  message: SessionMessage;
  intent?: IntentType;
}

function SessionMessageBubble({ message, intent }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const getIntentTag = () => {
    if (!intent || message.role !== 'user') return null;

    const intentConfig = {
      [IntentType.EXPLAIN_ITEM]: { color: 'blue', label: '📖 Explain' },
      [IntentType.NEW_INFO]: { color: 'green', label: '✨ New Info' },
      [IntentType.UPDATE_REQUEST]: { color: 'orange', label: '🔄 Update' },
      [IntentType.GENERAL]: { color: 'default', label: '💬 General' },
    };

    const config = intentConfig[intent];
    if (!config) return null;

    return <Tag color={config.color} className="text-xs">{config.label}</Tag>;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-white border border-gray-200 text-gray-800'
        }`}
      >
        {getIntentTag()}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div
          className={`mt-1 text-xs ${
            isUser ? 'text-blue-100' : 'text-gray-400'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

export default function SessionChatWindow() {
  const {
    session,
    messages,
    loading,
    error,
    completionPercentage,
    extractedIdentity,
    createSession,
    sendMessage,
  } = useSessionContext();

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [currentIntent, setCurrentIntent] = useState<IntentType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create session on mount if none exists
  useEffect(() => {
    if (!session && !loading) {
      createSession();
    }
  }, [session, loading, createSession]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Check for pending question from checklist
  useEffect(() => {
    const pendingQuestion = localStorage.getItem('pendingQuestion');
    if (pendingQuestion) {
      localStorage.removeItem('pendingQuestion');
      setInput(pendingQuestion);
      
      // Auto-send after a brief delay
      setTimeout(() => {
        handleSend(pendingQuestion);
      }, 500);
    }
  }, []);

  const handleSend = async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content || isSending) return;

    setInput('');
    setIsSending(true);
    setStreamingMessage('');
    setCurrentIntent(null);

    try {
      // Send via streaming API with session support
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
                setCurrentIntent(event.intent.intent);
              }
            } else if (event.type === 'done') {
              // Message complete, update session via context
              await sendMessage(content);
              setStreamingMessage('');
            } else if (event.type === 'error') {
              throw new Error(event.error);
            }
          } catch (e) {
            console.error('Parse SSE error:', e);
          }
        }
      }
    } catch (err) {
      console.error('Send message error:', err);
      setStreamingMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <InfoCircleOutlined className="text-red-500 text-5xl mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Session Error</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-blue-50 to-indigo-50 relative">
      {/* Info Bar - Show completion status */}
      {session && extractedIdentity && (
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge
              status={completionPercentage >= 60 ? 'success' : 'processing'}
              text={
                <span className="text-sm text-gray-600">
                  Tax Info Collected: <strong>{completionPercentage}%</strong>
                </span>
              }
            />
            {extractedIdentity.filing_status && (
              <Tag color="blue">{extractedIdentity.filing_status}</Tag>
            )}
            {extractedIdentity.state && (
              <Tag color="green">{extractedIdentity.state}</Tag>
            )}
          </div>
          {completionPercentage >= 60 && (
            <SmartGenerateButton variant="inline" />
          )}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Spin size="large" tip="Loading session..." />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Empty
              description={
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-semibold text-gray-700">
                    Welcome to ChatTax AI Assistant
                  </h3>
                  <p className="text-gray-500">
                    Start by telling me about your tax situation, and I'll help you
                    generate a personalized tax checklist.
                  </p>
                  <div className="mt-4 text-left inline-block">
                    <p className="text-sm text-gray-600 mb-2">Try asking:</p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• "I'm married filing jointly with 2 kids"</li>
                      <li>• "I have freelance income and own rental property"</li>
                      <li>• "What documents do I need for investment income?"</li>
                    </ul>
                  </div>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4">
            {messages.map((message, index) => (
              <SessionMessageBubble
                key={`${message.timestamp}-${index}`}
                message={message}
              />
            ))}
            {streamingMessage && (
              <SessionMessageBubble
                message={{
                  role: 'assistant',
                  content: streamingMessage,
                  timestamp: new Date().toISOString(),
                }}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4 shadow-lg">
        <div className="mx-auto max-w-4xl">
          <div className="flex gap-2">
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me about your tax situation... (Press Enter to send, Shift+Enter for new line)"
              autoSize={{ minRows: 2, maxRows: 6 }}
              disabled={isSending || loading}
              className="flex-1"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSend()}
              loading={isSending}
              disabled={!input.trim() || loading}
              size="large"
              className="h-auto px-6"
            >
              Send
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            ChatTax AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>

      {/* Floating Generate Button */}
      <SmartGenerateButton variant="floating" />
    </div>
  );
}
