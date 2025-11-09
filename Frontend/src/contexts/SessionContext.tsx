/**
 * Session Context
 * 
 * Global context for managing chat session state across the application.
 * Provides session state and control methods to all child components.
 */

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession } from '@/hooks/useSession';
import type {
  ChatSession,
  SessionMessage,
  ExtractedIdentity,
} from '@/types/session';

interface SessionContextValue {
  /** Current session */
  session: ChatSession | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Session's conversation history */
  messages: SessionMessage[];
  /** Extracted identity information */
  extractedIdentity: ExtractedIdentity | null;
  /** Information completion percentage (0-100) */
  completionPercentage: number;
  /** Missing required fields */
  missingFields: string[];
  /** Whether session has enough info for checklist generation */
  canGenerateChecklist: boolean;
  /** Create a new session */
  createSession: (initialMessage?: string) => Promise<void>;
  /** Load an existing session */
  loadSession: (sessionId: string) => Promise<void>;
  /** Send a message to current session */
  sendMessage: (content: string) => Promise<void>;
  /** Clear current session */
  clearSession: () => void;
  /** Link checklist to current session */
  linkChecklist: (checklistId: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
  /** Whether to automatically load last session from localStorage */
  autoLoad?: boolean;
}

/**
 * Session Provider Component
 * 
 * Wraps the application to provide global session state management.
 * 
 * @example
 * ```tsx
 * // In app layout or root component
 * function RootLayout({ children }) {
 *   return (
 *     <SessionProvider autoLoad={true}>
 *       {children}
 *     </SessionProvider>
 *   );
 * }
 * ```
 */
export function SessionProvider({ children, autoLoad = true }: SessionProviderProps) {
  const sessionState = useSession(autoLoad);

  return (
    <SessionContext.Provider value={sessionState}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Hook to access session context
 * 
 * @throws Error if used outside SessionProvider
 * @returns Session context value
 * 
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const {
 *     messages,
 *     sendMessage,
 *     completionPercentage,
 *     canGenerateChecklist
 *   } = useSessionContext();
 * 
 *   return (
 *     <div>
 *       <ChatHistory messages={messages} />
 *       <MessageInput onSend={sendMessage} />
 *       {canGenerateChecklist && (
 *         <GenerateButton percentage={completionPercentage} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSessionContext(): SessionContextValue {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }

  return context;
}

/**
 * HOC to inject session context as props
 * 
 * @param Component Component to wrap
 * @returns Wrapped component with session props
 * 
 * @example
 * ```tsx
 * interface MyComponentProps {
 *   session: ChatSession | null;
 *   sendMessage: (content: string) => Promise<void>;
 * }
 * 
 * function MyComponent({ session, sendMessage }: MyComponentProps) {
 *   // Component implementation
 * }
 * 
 * export default withSession(MyComponent);
 * ```
 */
export function withSession<P extends Partial<SessionContextValue>>(
  Component: React.ComponentType<P>
) {
  return function SessionComponent(props: Omit<P, keyof SessionContextValue>) {
    const sessionContext = useSessionContext();

    return <Component {...(props as P)} {...sessionContext} />;
  };
}
