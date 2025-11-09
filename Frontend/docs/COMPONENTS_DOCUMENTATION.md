# ChatTax Frontend Components Documentation

## Overview

ChatTax Frontend provides React components for building interactive tax checklist applications with AI-powered chat, session management, and smart information extraction.

**Tech Stack**: Next.js 15, React 18, TypeScript, Ant Design, Zustand

---

## Table of Contents

1. [Session Management](#session-management)
2. [Chat Components](#chat-components)
3. [Checklist Components](#checklist-components)
4. [Hooks](#hooks)
5. [Context Providers](#context-providers)
6. [Error Handling](#error-handling)

---

## Session Management

### SessionProvider

Global context provider for session state management.

**Location**: `src/contexts/SessionContext.tsx`

**Usage**:
```tsx
import { SessionProvider } from '@/contexts/SessionContext';

function App() {
  return (
    <SessionProvider autoLoad={true}>
      <YourApp />
    </SessionProvider>
  );
}
```

**Props**:
- `autoLoad` (boolean): Auto-load last session from localStorage (default: true)
- `children` (ReactNode): Child components

### useSessionContext Hook

Access session state from any component.

**Usage**:
```tsx
import { useSessionContext } from '@/contexts/SessionContext';

function ChatComponent() {
  const {
    session,
    messages,
    completionPercentage,
    canGenerateChecklist,
    sendMessage,
    createSession,
  } = useSessionContext();

  return (
    <div>
      <p>Completion: {completionPercentage}%</p>
      {canGenerateChecklist && <Button>Generate Checklist</Button>}
    </div>
  );
}
```

**Return Values**:
```typescript
{
  session: ChatSession | null;
  loading: boolean;
  error: string | null;
  messages: SessionMessage[];
  extractedIdentity: ExtractedIdentity | null;
  completionPercentage: number;
  missingFields: string[];
  canGenerateChecklist: boolean;
  createSession: (initialMessage?: string) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearSession: () => void;
  linkChecklist: (checklistId: string) => Promise<void>;
}
```

---

## Chat Components

### SessionChatWindow

Enhanced chat window with session management and SSE streaming.

**Location**: `src/components/chat/SessionChatWindow.tsx`

**Usage**:
```tsx
import { SessionProvider } from '@/contexts/SessionContext';
import SessionChatWindow from '@/components/chat/SessionChatWindow';

function ChatPage() {
  return (
    <SessionProvider>
      <SessionChatWindow />
    </SessionProvider>
  );
}
```

**Features**:
- Multi-turn conversation with history
- Real-time streaming responses (SSE)
- Intent classification tags
- Information extraction progress bar
- Smart generate button integration
- Auto-scroll to latest message

### SmartGenerateButton

Intelligent button that appears when sufficient tax information collected.

**Location**: `src/components/chat/SmartGenerateButton.tsx`

**Usage**:
```tsx
import SmartGenerateButton from '@/components/chat/SmartGenerateButton';

// Floating variant (default)
<SmartGenerateButton variant="floating" />

// Inline variant
<SmartGenerateButton variant="inline" className="mt-4" />
```

**Props**:
```typescript
{
  variant?: 'inline' | 'floating';  // Display style
  className?: string;                // Custom CSS class
}
```

**Behavior**:
- Only shows when `completionPercentage >= 60%`
- Displays progress with gradient colors
- Tooltip shows missing fields
- Generates checklist using `free_chat` mode
- Redirects to checklist detail page after generation

### SessionListSidebar

Displays list of user's chat sessions with management actions.

**Location**: `src/components/chat/SessionListSidebar.tsx`

**Usage**:
```tsx
import SessionListSidebar from '@/components/chat/SessionListSidebar';

<div className="flex">
  <SessionListSidebar className="w-80 border-r" />
  <SessionChatWindow />
</div>
```

**Features**:
- Lists all user sessions
- Shows message count and last activity
- Switch between sessions
- Create new session
- Delete sessions with confirmation
- Highlights active session
- Shows checklist linkage status

---

## Checklist Components

### ChecklistChatPanel

Floating or embedded chat panel for checklist detail pages.

**Location**: `src/components/checklist/ChecklistChatPanel.tsx`

**Usage**:
```tsx
import { SessionProvider } from '@/contexts/SessionContext';
import ChecklistChatPanel from '@/components/checklist/ChecklistChatPanel';

function ChecklistDetailPage({ checklistId }: { checklistId: string }) {
  const handleRegenerate = async () => {
    // Refetch checklist data
  };

  return (
    <SessionProvider>
      <div>
        {/* Your checklist content */}
        
        {/* Floating chat button */}
        <ChecklistChatPanel
          checklistId={checklistId}
          mode="floating"
          onRegenerateRequest={handleRegenerate}
        />
      </div>
    </SessionProvider>
  );
}
```

**Props**:
```typescript
{
  checklistId: string;                      // Checklist UUID
  mode?: 'floating' | 'embedded';           // Display mode
  onRegenerateRequest?: () => void;         // Callback for regeneration
}
```

**Features**:
- Contextual help for checklist items
- Intent classification (Explain, New Info, Update)
- Smart regeneration prompts
- Floating button with message badge
- Drawer-based UI for floating mode
- Auto-links to checklist

---

## Hooks

### useSession

React hook for managing session state locally.

**Location**: `src/hooks/useSession.ts`

**Usage**:
```tsx
import { useSession } from '@/hooks/useSession';

function MyComponent() {
  const {
    session,
    messages,
    completionPercentage,
    sendMessage,
    createSession
  } = useSession(true); // autoLoad = true

  useEffect(() => {
    if (!session) {
      createSession();
    }
  }, [session]);

  return <div>...</div>;
}
```

**Note**: Prefer `useSessionContext` when using `SessionProvider`.

### useSessionList

Hook for managing session list.

**Usage**:
```tsx
import { useSessionList } from '@/hooks/useSession';

function SessionList() {
  const { sessions, loading, loadSessions, deleteSession } = useSessionList();

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <ul>
      {sessions.map(session => (
        <li key={session.id}>
          {session.session_id}
          <button onClick={() => deleteSession(session.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

---

## Context Providers

### SessionProvider Configuration

**Full Example**:
```tsx
import { SessionProvider } from '@/contexts/SessionContext';

function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider autoLoad={true}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

### Nested Providers

**Example with multiple contexts**:
```tsx
<AuthProvider>
  <SessionProvider autoLoad={true}>
    <ChecklistProvider>
      <App />
    </ChecklistProvider>
  </SessionProvider>
</AuthProvider>
```

---

## Error Handling

### ErrorBoundary

React error boundary for graceful error handling.

**Location**: `src/components/common/ErrorBoundary.tsx`

**Usage**:
```tsx
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Wrap entire app
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Wrap specific routes
<ErrorBoundary 
  fallback={<CustomErrorUI />}
  onError={(error) => logToService(error)}
  showDetails={process.env.NODE_ENV === 'development'}
>
  <MyComponent />
</ErrorBoundary>
```

**Props**:
```typescript
{
  children: ReactNode;
  fallback?: ReactNode;                                    // Custom fallback UI
  onError?: (error: Error, errorInfo: ErrorInfo) => void; // Error callback
  showDetails?: boolean;                                   // Show error details
}
```

**Features**:
- Catches React rendering errors
- Shows user-friendly error page
- Displays stack trace in dev mode
- Provides reload and go home actions
- Supports custom error logging

### Using withErrorBoundary HOC

```tsx
import { withErrorBoundary } from '@/components/common/ErrorBoundary';

const MyComponent = () => {
  // Component code
};

export default withErrorBoundary(MyComponent, {
  onError: (error) => {
    console.error('Component error:', error);
    // Send to error tracking service
  }
});
```

---

## Type Definitions

### SessionMessage

```typescript
interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

### ExtractedIdentity

```typescript
interface ExtractedIdentity {
  filing_status?: 'single' | 'married_joint' | 'married_separate' | 'head_of_household' | 'qualifying_widow';
  income_range?: string;
  has_dependents?: boolean;
  num_dependents?: number;
  state?: string;
  has_self_employment?: boolean;
  has_investments?: boolean;
  has_rental_property?: boolean;
  has_education_expenses?: boolean;
  has_medical_expenses?: boolean;
  has_charitable_donations?: boolean;
  has_retirement_contributions?: boolean;
  additional_context?: string;
  completion_percentage?: number;
  missing_fields?: string[];
}
```

### IntentType

```typescript
enum IntentType {
  EXPLAIN_ITEM = 'EXPLAIN_ITEM',
  NEW_INFO = 'NEW_INFO',
  UPDATE_REQUEST = 'UPDATE_REQUEST',
  GENERAL = 'GENERAL'
}
```

### GenerationMode

```typescript
enum GenerationMode {
  FORM = 'form',
  GUIDED_CHAT = 'guided_chat',
  FREE_CHAT = 'free_chat'
}
```

---

## Complete Example: Chat Page

```tsx
'use client';

import { SessionProvider } from '@/contexts/SessionContext';
import SessionListSidebar from '@/components/chat/SessionListSidebar';
import SessionChatWindow from '@/components/chat/SessionChatWindow';
import ChecklistProgressWidget from '@/components/chat/ChecklistProgressWidget';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function ChatPage() {
  return (
    <ErrorBoundary>
      <SessionProvider autoLoad={true}>
        <div className="flex h-[calc(100vh-64px)]">
          {/* Left Sidebar */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <ChecklistProgressWidget />
            </div>
            <div className="flex-1 overflow-hidden">
              <SessionListSidebar />
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1">
            <SessionChatWindow />
          </div>
        </div>
      </SessionProvider>
    </ErrorBoundary>
  );
}
```

---

## Complete Example: Checklist Detail with Chat

```tsx
'use client';

import { useState } from 'react';
import { SessionProvider } from '@/contexts/SessionContext';
import ChecklistChatPanel from '@/components/checklist/ChecklistChatPanel';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function ChecklistDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const [checklist, setChecklist] = useState(null);

  const handleRegenerate = async () => {
    // Refetch checklist from API
    const response = await fetch(`/api/checklist/${params.id}`);
    const data = await response.json();
    setChecklist(data);
  };

  return (
    <ErrorBoundary>
      <SessionProvider autoLoad={true}>
        <div className="container mx-auto p-6">
          {/* Checklist Content */}
          <h1>{checklist?.title}</h1>
          {/* ... */}

          {/* Floating Chat Panel */}
          <ChecklistChatPanel
            checklistId={params.id}
            mode="floating"
            onRegenerateRequest={handleRegenerate}
          />
        </div>
      </SessionProvider>
    </ErrorBoundary>
  );
}
```

---

## Styling Guide

### Custom Themes

All components use Ant Design. Customize theme in `tailwind.config.ts`:

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#1890ff',
        success: '#52c41a',
        warning: '#faad14',
        error: '#ff4d4f',
      }
    }
  }
}
```

### Component Class Names

All components accept `className` prop for custom styling:

```tsx
<SessionChatWindow className="custom-class" />
<SmartGenerateButton className="my-4 shadow-lg" />
<SessionListSidebar className="w-96 bg-gray-50" />
```

---

## Performance Optimization

### Lazy Loading

```tsx
import dynamic from 'next/dynamic';

const SessionChatWindow = dynamic(
  () => import('@/components/chat/SessionChatWindow'),
  { ssr: false }
);
```

### Memoization

```tsx
import { memo } from 'react';

const SessionListItem = memo(({ session }) => {
  // Component code
});
```

---

## Testing

### Component Testing Example

```tsx
import { render, screen } from '@testing-library/react';
import { SessionProvider } from '@/contexts/SessionContext';
import SmartGenerateButton from '@/components/chat/SmartGenerateButton';

test('shows button when completion >= 60%', () => {
  render(
    <SessionProvider>
      <SmartGenerateButton />
    </SessionProvider>
  );
  
  // Test assertions
});
```

---

## Troubleshooting

### Session not persisting

Check localStorage:
```javascript
localStorage.getItem('current_session_id');
localStorage.getItem('cached_session');
```

### SSE connection issues

Ensure backend supports SSE:
```javascript
// Check response headers
headers['Content-Type'] = 'text/event-stream'
headers['Cache-Control'] = 'no-cache'
```

### Component not receiving context

Ensure wrapped in provider:
```tsx
<SessionProvider>
  <YourComponent />
</SessionProvider>
```

---

## Best Practices

1. **Always wrap chat components in SessionProvider**
2. **Use ErrorBoundary for production apps**
3. **Implement loading states for better UX**
4. **Handle SSE reconnection on network errors**
5. **Clear session data on logout**
6. **Validate user input before API calls**
7. **Show progress indicators for long operations**
8. **Use memo/useMemo for expensive computations**

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/1641542839/ChatTax/issues
- Documentation: `/docs`

**Last Updated**: November 9, 2025
