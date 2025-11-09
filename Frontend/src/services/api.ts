/**
 * API Client Service
 * 
 * Centralized HTTP client for Backend API communication.
 * Handles authentication, error handling, and request/response formatting.
 * 
 * @module services/api
 */

import { APIError, type ErrorResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Request configuration options
 */
interface RequestConfig extends RequestInit {
  /** Include authentication token in headers */
  auth?: boolean;
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/**
 * Build request headers with authentication and content type
 */
function buildHeaders(config?: RequestConfig): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(config?.headers as Record<string, string>),
  };

  // Add authentication token if requested (default: true)
  if (config?.auth !== false) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Parse error response from Backend
 */
async function parseError(response: Response): Promise<APIError> {
  let errorDetail = 'An error occurred';
  let errorResponse: ErrorResponse | undefined;

  try {
    errorResponse = await response.json();
    
    if (errorResponse) {
      // Handle validation errors (array format)
      if (Array.isArray(errorResponse.detail)) {
        errorDetail = errorResponse.detail
          .map(err => `${err.loc.join('.')}: ${err.msg}`)
          .join(', ');
      } 
      // Handle simple string errors
      else if (typeof errorResponse.detail === 'string') {
        errorDetail = errorResponse.detail;
      }
    }
  } catch (e) {
    // If response is not JSON, use status text
    errorDetail = response.statusText || errorDetail;
  }

  return new APIError(response.status, errorDetail, errorResponse);
}

/**
 * Generic API client function
 * 
 * @template T - Expected response type
 * @param endpoint - API endpoint path (e.g., '/api/auth/login')
 * @param config - Request configuration
 * @returns Promise with typed response data
 * 
 * @example
 * ```typescript
 * const user = await apiClient<UserResponse>('/api/users/me');
 * const tokens = await apiClient<LoginResponse>('/api/auth/login', {
 *   method: 'POST',
 *   body: JSON.stringify({ email, password }),
 *   auth: false, // Don't send token for login
 * });
 * ```
 */
export async function apiClient<T = any>(
  endpoint: string,
  config?: RequestConfig
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...config,
    headers: buildHeaders(config),
  });

  // Handle error responses
  if (!response.ok) {
    throw await parseError(response);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  // Parse JSON response
  return response.json();
}

/**
 * Upload file to Backend
 * 
 * @param endpoint - API endpoint path
 * @param file - File to upload
 * @param additionalData - Additional form data fields
 * @returns Promise with typed response data
 * 
 * @example
 * ```typescript
 * const result = await uploadFile<UploadResponse>(
 *   '/api/documents/upload',
 *   fileInput.files[0],
 *   { category: 'tax' }
 * );
 * ```
 */
export async function uploadFile<T = any>(
  endpoint: string,
  file: File,
  additionalData?: Record<string, string>
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);

  // Add additional form fields
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 * 
 * @returns New access token
 * @throws APIError if refresh fails
 * 
 * @example
 * ```typescript
 * try {
 *   const newToken = await refreshAccessToken();
 *   localStorage.setItem('access_token', newToken);
 * } catch (error) {
 *   // Refresh failed, redirect to login
 *   router.push('/login');
 * }
 * ```
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    throw new APIError(401, 'No refresh token available');
  }

  const response = await apiClient<{ access_token: string }>('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${refreshToken}`,
    },
    auth: false,
  });

  return response.access_token;
}

/**
 * Check if current access token is expired
 * 
 * @returns true if token is expired or missing
 * 
 * @example
 * ```typescript
 * if (isTokenExpired()) {
 *   await refreshAccessToken();
 * }
 * ```
 */
export function isTokenExpired(): boolean {
  const token = getAuthToken();
  if (!token) return true;

  try {
    // Decode JWT payload (base64)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    
    // Token expires in less than 5 minutes
    return Date.now() >= expiryTime - 5 * 60 * 1000;
  } catch (e) {
    return true;
  }
}
