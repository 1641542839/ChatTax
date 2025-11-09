/**
 * API Response Types
 * 
 * TypeScript interfaces for API responses.
 * Ensures type safety across Frontend-Backend communication.
 */

// ============================================================
// Authentication Types
// ============================================================

/**
 * JWT token response from login/register endpoints
 */
export interface LoginResponse {
  /** JWT access token (expires in 30 minutes) */
  access_token: string;
  /** JWT refresh token (expires in 7 days) */
  refresh_token: string;
  /** Token type (always "bearer") */
  token_type: 'bearer';
}

/**
 * User registration request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  full_name?: string;
}

/**
 * Traditional login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Google OAuth login request
 */
export interface GoogleLoginRequest {
  /** Google ID token from @react-oauth/google */
  google_token: string;
}

// ============================================================
// User Types
// ============================================================

/**
 * User profile data
 */
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  oauth_provider: 'google' | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Chat Types
// ============================================================

/**
 * Chat message
 */
export interface MessageResponse {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

/**
 * Chat session
 */
export interface ChatSessionResponse {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: MessageResponse[];
}

/**
 * Send message request
 */
export interface SendMessageRequest {
  content: string;
  session_id?: string;
}

// ============================================================
// Error Types
// ============================================================

/**
 * API error response
 */
export interface ErrorResponse {
  detail: string | ErrorDetail[];
  status_code: number;
}

/**
 * Validation error detail
 */
export interface ErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/**
 * Custom API error class
 */
export class APIError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public response?: ErrorResponse
  ) {
    super(detail);
    this.name = 'APIError';
  }
}

// ============================================================
// Pagination Types
// ============================================================

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
