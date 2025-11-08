# API Integration Guide

Complete guide to integrating ChatTax Frontend with Backend API.

## Overview

The Frontend communicates with the Backend via REST API and Server-Sent Events (SSE). All API interactions are handled through service layers.

**Backend API Base URL**: 
- Development: `http://localhost:8000`
- Production: `https://api.chattax.com` (configure in `.env.local`)

**Backend API Documentation**: See [Backend API Reference](../../../Backend/docs/03-api/endpoints.md)

---

## API Service Architecture

```
Frontend Components
    ↓
API Services (src/services/)
    ↓
HTTP Client (fetch/axios)
    ↓
Backend API (http://localhost:8000)
```

### Service Files

- **`authService.ts`**: Authentication (register, login, logout)
- **`chatService.ts`**: Chat queries and streaming
- **`checklistService.ts`**: Checklist generation and management
- **`queryService.ts`**: RAG query endpoint

---

## Configuration

### Environment Variables

Create `.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# API Endpoints
NEXT_PUBLIC_AUTH_ENDPOINT=/api/auth
NEXT_PUBLIC_CHAT_ENDPOINT=/api/chat
NEXT_PUBLIC_CHECKLIST_ENDPOINT=/api/checklist
```

### API Client Setup

```typescript
// src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = {
  get: async (endpoint: string, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },
  
  post: async (endpoint: string, data?: any, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },
};
```

---

## Authentication API

### Register User

**Backend Endpoint**: `POST /api/auth/register`

**Frontend Implementation**:

```typescript
// src/services/authService.ts
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export async function register(data: RegisterRequest): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }
  
  return response.json();
}
```

**Usage in Component**:

```typescript
// src/components/auth/RegisterForm.tsx
import { register } from '@/services/authService';

const handleRegister = async () => {
  try {
    const user = await register({
      email: 'user@example.com',
      username: 'username',
      password: 'password123',
      full_name: 'John Doe',
    });
    
    console.log('User registered:', user);
    // Redirect to login or auto-login
  } catch (error) {
    console.error('Registration error:', error);
    // Show error message
  }
};
```

### Login

**Backend Endpoint**: `POST /api/auth/login`

**Frontend Implementation**:

```typescript
// src/services/authService.ts
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);
  
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Invalid credentials');
  }
  
  const data = await response.json();
  
  // Store token in localStorage or cookie
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', data.access_token);
  }
  
  return data;
}
```

**Usage**:

```typescript
const handleLogin = async () => {
  try {
    const { access_token } = await login({
      username: 'username',
      password: 'password123',
    });
    
    console.log('Login successful');
    router.push('/chat');
  } catch (error) {
    setError('Invalid username or password');
  }
};
```

### Get Current User

**Backend Endpoint**: `GET /api/auth/me`

**Frontend Implementation**:

```typescript
// src/services/authService.ts
export async function getCurrentUser(): Promise<UserResponse> {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    throw new Error('No access token');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user info');
  }
  
  return response.json();
}
```

### Token Management

```typescript
// src/lib/auth.ts
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function setAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
}

export function removeAccessToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
```

---

## RAG Query API

### Query Endpoint

**Backend Endpoint**: `POST /api/chat/query`

**Backend Request Schema**:
```typescript
{
  question: string;          // Required
  user_type?: string;        // Optional, default "individual"
  top_k?: number;           // Optional, default 3
  use_reranking?: boolean;  // Optional, default true
  initial_candidates?: number; // Optional, default 20
}
```

**Backend Response Schema**:
```typescript
{
  answer: string;
  sources: Array<{
    chunk_id: string;
    doc_id: string;
    source_url: string;
    section_heading: string;
    text: string;
    crawl_date: string;
    last_updated_on_page: string;
    is_table_summary: boolean;
    provenance: string;
    relevance_score: number;
  }>;
  confidence: number;
  timestamp: string;
}
```

**Frontend Implementation**:

```typescript
// src/services/queryService.ts
export interface QueryRequest {
  question: string;
  user_type?: 'individual';
  top_k?: number;
  use_reranking?: boolean;
  initial_candidates?: number;
}

export interface Source {
  chunk_id: string;
  doc_id: string;
  source_url: string;
  section_heading: string;
  text: string;
  crawl_date: string;
  last_updated_on_page: string;
  is_table_summary: boolean;
  provenance: string;
  relevance_score: number;
}

export interface QueryResponse {
  answer: string;
  sources: Source[];
  confidence: number;
  timestamp: string;
}

export async function queryTax(request: QueryRequest): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: request.question,
      user_type: request.user_type || 'individual',
      top_k: request.top_k || 3,
      use_reranking: request.use_reranking ?? true,
      initial_candidates: request.initial_candidates || 20,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Query failed');
  }
  
  return response.json();
}
```

**Usage**:

```typescript
// In component
const handleQuery = async (question: string) => {
  setLoading(true);
  try {
    const result = await queryTax({
      question,
      top_k: 5,
      use_reranking: true,
    });
    
    setAnswer(result.answer);
    setSources(result.sources);
    setConfidence(result.confidence);
  } catch (error) {
    console.error('Query error:', error);
  } finally {
    setLoading(false);
  }
};
```

---

## Chat Streaming API

### SSE Stream Endpoint

**Backend Endpoint**: `POST /api/chat/stream`

**Frontend Implementation**:

```typescript
// src/services/chatService.ts
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export async function streamChat(
  message: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  const token = getAccessToken();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ content: message }),
    });
    
    if (!response.ok) {
      throw new Error(`Stream error: ${response.status}`);
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('No reader available');
    }
    
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            onComplete();
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }
    }
    
    onComplete();
  } catch (error) {
    onError(error as Error);
  }
}
```

**Usage with React Hook**:

```typescript
// src/hooks/useStreamChat.ts
import { useState } from 'react';
import { streamChat } from '@/services/chatService';

export function useStreamChat() {
  const [streaming, setStreaming] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  
  const sendMessage = async (message: string) => {
    setStreaming(true);
    setCurrentMessage('');
    
    await streamChat(
      message,
      (chunk) => {
        setCurrentMessage((prev) => prev + chunk);
      },
      () => {
        setStreaming(false);
      },
      (error) => {
        console.error('Stream error:', error);
        setStreaming(false);
      }
    );
  };
  
  return {
    sendMessage,
    streaming,
    currentMessage,
  };
}
```

**Usage in Component**:

```typescript
const ChatComponent = () => {
  const { sendMessage, streaming, currentMessage } = useStreamChat();
  
  const handleSend = () => {
    sendMessage('What are tax deductions?');
  };
  
  return (
    <div>
      <button onClick={handleSend} disabled={streaming}>
        Send
      </button>
      <div>{currentMessage}</div>
    </div>
  );
};
```

---

## Checklist API

### Generate Checklist

**Backend Endpoint**: `POST /api/checklist/generate`

**Backend Request Schema**: See [Backend API - Checklist](../../../Backend/docs/03-api/endpoints.md#post-apichecklistgenerate)

**Frontend Implementation**:

```typescript
// src/services/checklistService.ts
export interface IdentityInfo {
  employment_status: 'employed' | 'self-employed' | 'unemployed' | 'retired';
  income_sources: Array<'salary' | 'investment' | 'rental' | 'business' | 'other'>;
  has_dependents: boolean;
  has_investment: boolean;
  has_rental_property: boolean;
  is_first_time_filer: boolean;
  additional_info?: {
    industry?: string;
    location?: string;
    [key: string]: any;
  };
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'documents' | 'accounts' | 'records' | 'calculations' | 'review';
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'completed';
  estimated_time?: string;
}

export interface Checklist {
  id: number;
  user_id?: number;
  identity_info: IdentityInfo;
  items: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export async function generateChecklist(
  identityInfo: IdentityInfo,
  userId?: number
): Promise<Checklist> {
  const response = await fetch(`${API_BASE_URL}/api/checklist/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      identity_info: identityInfo,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate checklist');
  }
  
  return response.json();
}
```

**Usage**:

```typescript
const handleGenerateChecklist = async () => {
  try {
    const checklist = await generateChecklist({
      employment_status: 'employed',
      income_sources: ['salary', 'investment'],
      has_dependents: true,
      has_investment: true,
      has_rental_property: false,
      is_first_time_filer: false,
      additional_info: {
        industry: 'technology',
        location: 'NSW',
      },
    });
    
    console.log('Generated checklist:', checklist);
    setChecklistItems(checklist.items);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Get Checklist by ID

```typescript
export async function getChecklist(
  checklistId: number,
  userId?: number
): Promise<Checklist> {
  const params = userId ? `?user_id=${userId}` : '';
  const response = await fetch(
    `${API_BASE_URL}/api/checklist/${checklistId}${params}`
  );
  
  if (!response.ok) {
    throw new Error('Checklist not found');
  }
  
  return response.json();
}
```

### Get User Checklists

```typescript
export async function getUserChecklists(userId: number): Promise<Checklist[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/checklist/user/${userId}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch checklists');
  }
  
  return response.json();
}
```

---

## Error Handling

### API Error Handler

```typescript
// src/lib/apiError.ts
export class APIError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public response?: any
  ) {
    super(detail);
    this.name = 'APIError';
  }
}

export async function handleAPIError(response: Response): Promise<never> {
  let detail = 'An error occurred';
  let responseData;
  
  try {
    responseData = await response.json();
    detail = responseData.detail || responseData.message || detail;
  } catch (e) {
    detail = response.statusText || detail;
  }
  
  throw new APIError(response.status, detail, responseData);
}

// Usage in service
export async function safeAPICall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      await handleAPIError(response);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(0, 'Network error', error);
  }
}
```

### Error Display Component

```typescript
// src/components/ErrorMessage.tsx
export function ErrorMessage({ error }: { error: Error | APIError }) {
  if (error instanceof APIError) {
    switch (error.status) {
      case 400:
        return <div>Invalid request. Please check your input.</div>;
      case 401:
        return <div>Please log in to continue.</div>;
      case 404:
        return <div>Resource not found.</div>;
      case 500:
        return <div>Server error. Please try again later.</div>;
      default:
        return <div>{error.detail}</div>;
    }
  }
  
  return <div>{error.message}</div>;
}
```

---

## Request/Response Examples

### Complete RAG Query Flow

```typescript
// Component that queries and displays results
import { queryTax } from '@/services/queryService';

const TaxQueryComponent = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await queryTax({
        question: query,
        top_k: 5,
        use_reranking: true,
      });
      
      setResult(response);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a tax question..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {error && <ErrorMessage error={error} />}
      
      {result && (
        <div>
          <h3>Answer (Confidence: {(result.confidence * 100).toFixed(0)}%)</h3>
          <p>{result.answer}</p>
          
          <h4>Sources:</h4>
          {result.sources.map((source, idx) => (
            <div key={source.chunk_id}>
              <a href={source.source_url} target="_blank" rel="noopener">
                [{idx + 1}] {source.section_heading}
              </a>
              <span> (Relevance: {(source.relevance_score * 100).toFixed(0)}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## API Testing

### Test API Connection

```typescript
// src/lib/testAPI.ts
export async function testAPIConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('API connection failed:', error);
    return false;
  }
}
```

### Mock API for Development

```typescript
// src/services/__mocks__/queryService.ts
export async function queryTax(request: QueryRequest): Promise<QueryResponse> {
  // Return mock data for development
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    answer: 'Mock answer for: ' + request.question,
    sources: [
      {
        chunk_id: 'mock_1',
        doc_id: 'doc_1',
        source_url: 'https://www.ato.gov.au/mock',
        section_heading: 'Mock Section',
        text: 'Mock content',
        crawl_date: '2024-11-08',
        last_updated_on_page: '2024-11-01',
        is_table_summary: false,
        provenance: 'Mock Source',
        relevance_score: 0.95,
      },
    ],
    confidence: 0.85,
    timestamp: new Date().toISOString(),
  };
}
```

---

## Next Steps

- [Service Layer Documentation](./services.md)
- [State Management with API](../05-state-management/api-state.md)
- [Error Handling](../06-troubleshooting/api-errors.md)
- [Backend API Reference](../../../Backend/docs/03-api/endpoints.md)
