# State Management Architecture

Complete guide to Zustand state management in ChatTax Frontend.

## Overview

ChatTax uses **Zustand 4.x** for global state management - a lightweight alternative to Redux with a simple API and TypeScript support.

### Why Zustand?

- **Simple API**: No boilerplate, just `create()`
- **TypeScript Native**: Full type inference
- **React Hooks**: `useStore()` integration
- **No Provider**: Direct store imports
- **Performance**: Minimal re-renders

---

## Store Structure

```
src/store/
├── authStore.ts        # Authentication & user state
├── chatStore.ts        # Chat messages & streaming
└── checklistStore.ts   # Checklist data & tasks
```

---

## 1. Auth Store (`store/authStore.ts`)

### Store Definition

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginRequest, RegisterRequest } from '@/types/api';
import * as authService from '@/services/auth';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      // Login action
      login: async (credentials) => {
        set({ loading: true });
        try {
          const response = await authService.login(credentials);
          localStorage.setItem('access_token', response.access_token);
          
          // Get user info
          const user = await authService.getCurrentUser();
          
          set({
            user,
            token: response.access_token,
            isAuthenticated: true,
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      // Register action
      register: async (data) => {
        set({ loading: true });
        try {
          await authService.register(data);
          // Auto login after registration
          await get().login({
            email: data.email,
            password: data.password,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      // Logout action
      logout: () => {
        localStorage.removeItem('access_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      // Check authentication
      checkAuth: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const user = await authService.getCurrentUser();
          set({
            user,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          localStorage.removeItem('access_token');
          set({ isAuthenticated: false });
        }
      },

      // Set user
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage', // LocalStorage key
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### Usage in Components

```typescript
'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, loading, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await login(values);
      router.push('/chat');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isAuthenticated) {
    router.push('/chat');
    return null;
  }

  return (
    <Form onFinish={handleLogin}>
      {/* Form fields */}
      <Button type="primary" htmlType="submit" loading={loading}>
        Login
      </Button>
    </Form>
  );
}
```

---

## 2. Chat Store (`store/chatStore.ts`)

### Store Definition

```typescript
import { create } from 'zustand';
import type { Message, QueryRequest } from '@/types/api';
import { queryTax } from '@/services/chat';

interface ChatState {
  // State
  messages: Message[];
  currentStreamMessage: string;
  isStreaming: boolean;
  loading: boolean;

  // Actions
  addMessage: (message: Message) => void;
  updateMessage: (id: string, content: Partial<Message>) => void;
  sendQuery: (question: string) => Promise<void>;
  startStream: (content: string) => void;
  appendStream: (chunk: string) => void;
  endStream: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  currentStreamMessage: '',
  isStreaming: false,
  loading: false,

  // Add message
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  // Update existing message
  updateMessage: (id, content) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...content } : msg
      ),
    }));
  },

  // Send query
  sendQuery: async (question) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: question,
      sender: 'user',
      timestamp: new Date(),
    };
    
    get().addMessage(userMessage);
    
    set({ loading: true });
    try {
      const response = await queryTax({ question, top_k: 5 });
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: response.answer,
        sender: 'ai',
        timestamp: new Date(),
        sources: response.sources,
      };
      
      get().addMessage(aiMessage);
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      set({ loading: false });
    }
  },

  // Streaming
  startStream: (content) => {
    set({ isStreaming: true, currentStreamMessage: content });
  },

  appendStream: (chunk) => {
    set((state) => ({
      currentStreamMessage: state.currentStreamMessage + chunk,
    }));
  },

  endStream: () => {
    const message: Message = {
      id: `ai-${Date.now()}`,
      content: get().currentStreamMessage,
      sender: 'ai',
      timestamp: new Date(),
    };
    
    get().addMessage(message);
    set({ isStreaming: false, currentStreamMessage: '' });
  },

  // Clear all messages
  clearMessages: () => {
    set({ messages: [] });
  },
}));
```

### Usage with Streaming

```typescript
'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';

export default function ChatInterface() {
  const { messages, currentStreamMessage, isStreaming, appendStream, endStream } = useChatStore();

  const handleStream = (question: string) => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat/stream?question=${encodeURIComponent(question)}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'token') {
        appendStream(data.content);
      } else if (data.type === 'end') {
        endStream();
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      endStream();
      eventSource.close();
    };
  };

  return (
    <div>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isStreaming && <MessageBubble content={currentStreamMessage} sender="ai" />}
    </div>
  );
}
```

---

## 3. Checklist Store (`store/checklistStore.ts`)

### Store Definition

```typescript
import { create } from 'zustand';
import type { Checklist, ChecklistItem, IdentityInfo } from '@/types/api';
import { generateChecklist, getChecklistById } from '@/services/checklist';

interface ChecklistState {
  // State
  checklist: Checklist | null;
  tasks: ChecklistItem[];
  loading: boolean;

  // Actions
  generate: (identity: IdentityInfo) => Promise<void>;
  loadChecklist: (id: string) => Promise<void>;
  toggleTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<ChecklistItem>) => void;
  clearChecklist: () => void;
}

export const useChecklistStore = create<ChecklistState>((set, get) => ({
  // Initial state
  checklist: null,
  tasks: [],
  loading: false,

  // Generate new checklist
  generate: async (identity) => {
    set({ loading: true });
    try {
      const checklist = await generateChecklist(identity);
      set({
        checklist,
        tasks: checklist.items,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // Load existing checklist
  loadChecklist: async (id) => {
    set({ loading: true });
    try {
      const checklist = await getChecklistById(id);
      set({
        checklist,
        tasks: checklist.items,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // Toggle task completion
  toggleTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    }));
  },

  // Update task
  updateTask: (taskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    }));
  },

  // Clear checklist
  clearChecklist: () => {
    set({ checklist: null, tasks: [] });
  },
}));
```

### Usage in Components

```typescript
'use client';

import { useEffect } from 'react';
import { useChecklistStore } from '@/store/checklistStore';

export default function ChecklistPage() {
  const { tasks, loading, toggleTask } = useChecklistStore();

  return (
    <div>
      {loading && <p>Loading...</p>}
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={toggleTask}
        />
      ))}
    </div>
  );
}
```

---

## Advanced Patterns

### Computed Values

```typescript
export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  
  // Computed property
  get messageCount() {
    return get().messages.length;
  },
  
  get hasMessages() {
    return get().messages.length > 0;
  },
}));

// Usage
const { messageCount, hasMessages } = useChatStore();
```

### Selectors

```typescript
// Use selector to prevent unnecessary re-renders
const user = useAuthStore((state) => state.user);
const isAuth = useAuthStore((state) => state.isAuthenticated);

// Or multiple values
const { user, isAuthenticated } = useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
}));
```

### Middleware

```typescript
import { devtools, persist } from 'zustand/middleware';

export const useStore = create<State>()(
  devtools(
    persist(
      (set) => ({
        // Store definition
      }),
      { name: 'my-store' }
    )
  )
);
```

---

## Best Practices

1. **Type Everything**: Use TypeScript interfaces for state and actions
2. **Keep Stores Small**: One store per feature/domain
3. **Use Selectors**: Prevent unnecessary re-renders
4. **Async Actions**: Handle errors in actions, not components
5. **Persistence**: Use `persist` middleware for auth/user data
6. **Devtools**: Enable for debugging (development only)

---

## For GitHub Copilot

**State Management**: ChatTax uses Zustand 4 for global state. Three stores: authStore (user/token), chatStore (messages/streaming), checklistStore (tasks). Simple API with `create()` and hooks. TypeScript typed. Persist middleware for auth. No Provider needed.

**Store Patterns**: Actions in store, async operations with try-catch, selectors for performance, computed values with getters.

**Key Stores**:
- `useAuthStore()` - login, register, logout, checkAuth
- `useChatStore()` - addMessage, sendQuery, streaming
- `useChecklistStore()` - generate, loadChecklist, toggleTask

---

**See also**: [Chat State](./chat-state.md) | [Checklist State](./checklist-state.md) | [API State](./api-state.md)
