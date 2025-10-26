import { create } from 'zustand'
import { nanoid } from 'nanoid'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface ChatState {
  conversations: Conversation[]
  currentConversationId: string | null
  streamingMessageId: string | null

  // Actions
  createConversation: () => string
  setCurrentConversation: (id: string) => void
  addMessage: (conversationId: string, message: Omit<Message, 'id'>) => string
  updateMessage: (
    conversationId: string,
    messageId: string,
    content: string
  ) => void
  appendToMessage: (
    conversationId: string,
    messageId: string,
    chunk: string
  ) => void
  setMessageStreaming: (
    conversationId: string,
    messageId: string,
    isStreaming: boolean
  ) => void
  deleteConversation: (id: string) => void
  clearCurrentConversation: () => void
  getCurrentConversation: () => Conversation | null
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  streamingMessageId: null,

  createConversation: () => {
    const newConversation: Conversation = {
      id: nanoid(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      currentConversationId: newConversation.id,
    }))

    return newConversation.id
  },

  setCurrentConversation: (id: string) => {
    set({ currentConversationId: id })
  },

  addMessage: (conversationId: string, message: Omit<Message, 'id'>) => {
    const messageId = nanoid()
    const newMessage: Message = {
      ...message,
      id: messageId,
    }

    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          const updatedMessages = [...conv.messages, newMessage]
          const title =
            conv.messages.length === 0 && message.role === 'user'
              ? message.content.slice(0, 50) +
                (message.content.length > 50 ? '...' : '')
              : conv.title

          return {
            ...conv,
            messages: updatedMessages,
            title,
            updatedAt: new Date(),
          }
        }
        return conv
      }),
    }))

    return messageId
  },

  updateMessage: (
    conversationId: string,
    messageId: string,
    content: string
  ) => {
    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: conv.messages.map((msg) =>
              msg.id === messageId ? { ...msg, content } : msg
            ),
            updatedAt: new Date(),
          }
        }
        return conv
      }),
    }))
  },

  appendToMessage: (
    conversationId: string,
    messageId: string,
    chunk: string
  ) => {
    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: conv.messages.map((msg) =>
              msg.id === messageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            ),
            updatedAt: new Date(),
          }
        }
        return conv
      }),
    }))
  },

  setMessageStreaming: (
    conversationId: string,
    messageId: string,
    isStreaming: boolean
  ) => {
    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: conv.messages.map((msg) =>
              msg.id === messageId ? { ...msg, isStreaming } : msg
            ),
          }
        }
        return conv
      }),
      streamingMessageId: isStreaming ? messageId : null,
    }))
  },

  deleteConversation: (id: string) => {
    set((state) => {
      const newConversations = state.conversations.filter(
        (conv) => conv.id !== id
      )
      const newCurrentId =
        state.currentConversationId === id
          ? newConversations[0]?.id || null
          : state.currentConversationId

      return {
        conversations: newConversations,
        currentConversationId: newCurrentId,
      }
    })
  },

  clearCurrentConversation: () => {
    set({ currentConversationId: null })
  },

  getCurrentConversation: () => {
    const state = get()
    return (
      state.conversations.find(
        (conv) => conv.id === state.currentConversationId
      ) || null
    )
  },
}))
