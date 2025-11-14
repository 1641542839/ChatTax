/**
 * useSession Hook
 * 
 * React hook for managing chat session state, including creating sessions,
 * loading conversation history, sending messages, and tracking extracted identity.
 */

import { useState, useCallback, useEffect } from 'react';
import { sessionService, sessionStorage } from '@/services/sessionService';
import type {
  ChatSession,
  SessionMessage,
  ExtractedIdentity,
  AddMessageRequest,
  SessionListItem,
} from '@/types/session';

interface UseSessionReturn {
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
  createSession: (initialMessage?: string) => Promise<ChatSession | null>;
  /** Load an existing session */
  loadSession: (sessionId: string) => Promise<void>;
  /** Send a message to current session */
  sendMessage: (content: string) => Promise<void>;
  /** Clear current session */
  clearSession: () => void;
  /** Link checklist to current session */
  linkChecklist: (checklistId: string) => Promise<void>;
}

/**
 * Hook for managing chat session state
 * 
 * @param autoLoad Whether to automatically load last session from localStorage
 * @returns Session state and control methods
 * 
 * @example
 * ```tsx
 * function ChatPage() {
 *   const {
 *     session,
 *     messages,
 *     completionPercentage,
 *     canGenerateChecklist,
 *     sendMessage,
 *     createSession,
 *   } = useSession(true);
 * 
 *   useEffect(() => {
 *     if (!session) {
 *       createSession();
 *     }
 *   }, []);
 * 
 *   return (
 *     <div>
 *       <ChatHistory messages={messages} />
 *       <MessageInput onSend={sendMessage} />
 *       {canGenerateChecklist && (
 *         <Button>Generate Checklist ({completionPercentage}%)</Button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSession(autoLoad = false): UseSessionReturn {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedIdentity, setExtractedIdentity] = useState<ExtractedIdentity | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Derive messages from session
  const messages = session?.conversation_history || [];

  // Check if can generate checklist (completion >= 60%)
  const canGenerateChecklist = completionPercentage >= 60;

  /**
   * Create a new session
   */
  const createSession = useCallback(async (initialMessage?: string): Promise<ChatSession | null> => {
    console.log('[useSession] createSession called, initialMessage:', initialMessage);
    console.trace('[useSession] createSession call stack');
    setLoading(true);
    setError(null);

    try {
      const newSession = await sessionService.createSession(
        initialMessage ? { initial_message: initialMessage } : undefined
      );

      console.log('[useSession] Session created successfully:', newSession.session_id);
      setSession(newSession);
      setExtractedIdentity(newSession.extracted_identity);
      setCompletionPercentage(newSession.extracted_identity?.completion_percentage || 0);
      setMissingFields(newSession.extracted_identity?.missing_fields || []);

      // Save to localStorage
      sessionStorage.setCurrentSessionId(newSession.session_id);
      sessionStorage.setCachedSession(newSession);

      return newSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      console.error('[useSession] Create session error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load an existing session
   */
  const loadSession = useCallback(async (sessionId: string) => {
    console.log('[useSession] loadSession called for:', sessionId);
    setLoading(true);
    setError(null);

    try {
      const loadedSession = await sessionService.getSession(sessionId);
      console.log('[useSession] Session loaded, messages count:', loadedSession.conversation_history?.length);

      setSession(loadedSession);
      setExtractedIdentity(loadedSession.extracted_identity);
      setCompletionPercentage(loadedSession.extracted_identity?.completion_percentage || 0);
      setMissingFields(loadedSession.extracted_identity?.missing_fields || []);

      // Save to localStorage
      sessionStorage.setCurrentSessionId(loadedSession.session_id);
      sessionStorage.setCachedSession(loadedSession);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load session';
      setError(errorMessage);
      console.error('[useSession] Load session error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Send a message to the current session
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!session) {
      setError('No active session');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: AddMessageRequest = {
        content,
        role: 'user',
      };

      const result = await sessionService.addMessage(session.session_id, request);

      // Update session state
      setSession(result.session);
      setExtractedIdentity(result.extracted_identity);
      setCompletionPercentage(result.completion_percentage);
      setMissingFields(result.missing_fields);

      // Update cache
      sessionStorage.setCachedSession(result.session);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Send message error:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  /**
   * Link a checklist to the current session
   */
  const linkChecklist = useCallback(async (checklistId: string) => {
    if (!session) {
      setError('No active session');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedSession = await sessionService.linkChecklist(
        session.session_id,
        checklistId
      );

      setSession(updatedSession);
      sessionStorage.setCachedSession(updatedSession);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to link checklist';
      setError(errorMessage);
      console.error('Link checklist error:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  /**
   * Clear current session
   */
  const clearSession = useCallback(() => {
    setSession(null);
    setExtractedIdentity(null);
    setCompletionPercentage(0);
    setMissingFields([]);
    setError(null);
    sessionStorage.clearAll();
  }, []);

  /**
   * Auto-load last session on mount
   */
  useEffect(() => {
    if (!autoLoad) return;

    const cachedSession = sessionStorage.getCachedSession();
    if (cachedSession) {
      setSession(cachedSession);
      setExtractedIdentity(cachedSession.extracted_identity);
      setCompletionPercentage(
        cachedSession.extracted_identity?.completion_percentage || 0
      );
      setMissingFields(cachedSession.extracted_identity?.missing_fields || []);
    }
  }, [autoLoad]);

  return {
    session,
    loading,
    error,
    messages,
    extractedIdentity,
    completionPercentage,
    missingFields,
    canGenerateChecklist,
    createSession,
    loadSession,
    sendMessage,
    clearSession,
    linkChecklist,
  };
}

/**
 * Hook for listing all user sessions
 * 
 * @returns Session list state and control methods
 * 
 * @example
 * ```tsx
 * function SessionList() {
 *   const { sessions, loading, loadSessions } = useSessionList();
 * 
 *   useEffect(() => {
 *     loadSessions();
 *   }, []);
 * 
 *   return (
 *     <div>
 *       {sessions.map(session => (
 *         <SessionItem key={session.id} session={session} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSessionList() {
  // Use concrete typing for stronger guarantees
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async (limit = 20, offset = 0) => {
    console.log('[useSessionList] loadSessions called');
    setLoading(true);
    setError(null);

    try {
      const sessionList = await sessionService.listSessions(limit, offset);
      console.log('[useSessionList] Fetched sessions:', sessionList.length, 'total');
      // Defensive filter in case legacy records lack is_active flag or backend param changes
      const activeOnly = sessionList.filter(s => s.is_active !== false);
      console.log('[useSessionList] Active sessions:', activeOnly.length, 'sessions');
      setSessions(activeOnly);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(errorMessage);
      console.error('[useSessionList] Load sessions error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    console.log('[useSessionList] deleteSession called for:', sessionId);
    setLoading(true);
    setError(null);
    try {
      await sessionService.deleteSession(sessionId);
      console.log('[useSessionList] Delete API call successful');
      // Optimistic removal; we also trigger a fresh list reload to reflect server state
      setSessions(prev => {
        const filtered = prev.filter(s => s.session_id !== sessionId);
        console.log('[useSessionList] Optimistically removed. Before:', prev.length, 'After:', filtered.length);
        return filtered;
      });
      // Authoritative reload (listSessions already filters inactive)
      const fresh = await sessionService.listSessions();
      console.log('[useSessionList] Reloaded after delete. Count:', fresh.length);
      setSessions(fresh);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete session';
      setError(errorMessage);
      console.error('[useSessionList] Delete session error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sessions,
    loading,
    error,
    loadSessions,
    deleteSession,
  };
}
