/**
 * Session Service
 * 
 * API service for managing chat sessions, including creating sessions,
 * loading session history, sending messages, and handling multi-turn conversations.
 */

import { apiClient } from './api';
import type {
  ChatSession,
  SessionListItem,
  CreateSessionRequest,
  AddMessageRequest,
  SessionMessage,
  ExtractedIdentity,
} from '@/types/session';

const SESSION_BASE = '/api/sessions';

/**
 * Session management service
 */
export const sessionService = {
  /**
   * Create a new chat session
   * 
   * @param request Optional initial message
   * @returns Created session
   */
  async createSession(request?: CreateSessionRequest): Promise<ChatSession> {
    const response = await apiClient<ChatSession>(SESSION_BASE, {
      method: 'POST',
      body: JSON.stringify(request || {}),
    });
    return response;
  },

  /**
   * Get list of user's sessions
   * 
   * @param limit Maximum number of sessions to return
   * @param offset Pagination offset
   * @returns List of session summaries
   */
  async listSessions(limit = 20, offset = 0): Promise<SessionListItem[]> {
    // Ask backend to include inactive too, then filter client-side based on is_active
    // This prevents any mismatch between server filtering and UI state after soft-delete
    const params = new URLSearchParams({
      limit: limit.toString(),
      include_inactive: 'true',
      _ts: Date.now().toString(),
    });
    const url = `${SESSION_BASE}?${params.toString()}`;
    const response = await apiClient<SessionListItem[]>(url, { cache: 'no-store' });
    // Filter out inactive sessions client-side to be extra safe
    return response.filter(s => s.is_active !== false);
  },

  /**
   * Get detailed session information
   * 
   * @param sessionId Session UUID
   * @returns Full session with conversation history
   */
  async getSession(sessionId: string): Promise<ChatSession> {
    const response = await apiClient<ChatSession>(`${SESSION_BASE}/${sessionId}`);
    return response;
  },

  /**
   * Add a message to an existing session
   * 
   * This triggers identity extraction on the backend and returns
   * the updated session with extracted information.
   * 
   * @param sessionId Session UUID
   * @param request Message content and role
   * @returns Updated session with extracted identity
   */
  async addMessage(sessionId: string, request: AddMessageRequest): Promise<{
    session: ChatSession;
    extracted_identity: ExtractedIdentity;
    completion_percentage: number;
    missing_fields: string[];
  }> {
    const response = await apiClient<{
      session: ChatSession;
      extracted_identity: ExtractedIdentity;
      completion_percentage: number;
      missing_fields: string[];
    }>(`${SESSION_BASE}/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response;
  },

  /**
   * Delete a session
   * 
   * @param sessionId Session UUID
   */
  async deleteSession(sessionId: string): Promise<void> {
    console.log('sessionService.deleteSession - sessionId:', sessionId);
    console.log('sessionService.deleteSession - URL:', `${SESSION_BASE}/${sessionId}`);
    await apiClient(`${SESSION_BASE}/${sessionId}`, {
      method: 'DELETE',
    });
    console.log('sessionService.deleteSession - API call completed successfully');
  },

  /**
   * Link a checklist to a session
   * 
   * @param sessionId Session UUID
   * @param checklistId Checklist UUID
   */
  async linkChecklist(sessionId: string, checklistId: string): Promise<ChatSession> {
    const response = await apiClient<ChatSession>(
      `${SESSION_BASE}/${sessionId}/checklist`,
      {
        method: 'PATCH',
        body: JSON.stringify({ checklist_id: checklistId }),
      }
    );
    return response;
  },

  /**
   * Get session's extracted identity information
   * 
   * Helper method to extract identity info from a session
   * 
   * @param sessionId Session UUID
   * @returns Extracted identity information
   */
  async getExtractedIdentity(sessionId: string): Promise<ExtractedIdentity | null> {
    const session = await this.getSession(sessionId);
    return session.extracted_identity;
  },

  /**
   * Check if session has sufficient information for checklist generation
   * 
   * @param sessionId Session UUID
   * @returns Whether session has sufficient information
   */
  async canGenerateChecklist(sessionId: string): Promise<boolean> {
    const identity = await this.getExtractedIdentity(sessionId);
    if (!identity) return false;
    
    // Check if completion percentage is high enough (e.g., >= 60%)
    return (identity.completion_percentage || 0) >= 60;
  },
};

/**
 * Session storage utility
 * 
 * Helper functions for managing current session in localStorage
 */
export const sessionStorage = {
  /**
   * Get current session ID from localStorage
   */
  getCurrentSessionId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('current_session_id');
  },

  /**
   * Set current session ID in localStorage
   */
  setCurrentSessionId(sessionId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('current_session_id', sessionId);
  },

  /**
   * Clear current session ID from localStorage
   */
  clearCurrentSessionId(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('current_session_id');
  },

  /**
   * Get cached session from localStorage
   */
  getCachedSession(): ChatSession | null {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem('cached_session');
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  },

  /**
   * Cache session in localStorage
   */
  setCachedSession(session: ChatSession): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cached_session', JSON.stringify(session));
  },

  /**
   * Clear cached session from localStorage
   */
  clearCachedSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('cached_session');
  },

  /**
   * Clear all session data from localStorage
   */
  clearAll(): void {
    this.clearCurrentSessionId();
    this.clearCachedSession();
  },
};
