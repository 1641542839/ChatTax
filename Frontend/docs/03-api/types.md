# API Type Definitions

TypeScript type definitions for all API interactions with Backend.

## Overview

This file provides complete TypeScript types matching the Backend API schemas. Always keep these types in sync with [Backend API Documentation](../../../Backend/docs/03-api/endpoints.md).

---

## Authentication Types

### Register

```typescript
// POST /api/auth/register
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
  created_at: string;  // ISO 8601 datetime
}
```

### Login

```typescript
// POST /api/auth/login
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
}
```

### Current User

```typescript
// GET /api/auth/me
// Returns: UserResponse (same as register)
```

---

## RAG Query Types

### Query Request

```typescript
// POST /api/chat/query
export interface QueryRequest {
  question: string;                    // Required: User's tax question
  user_type?: 'individual';            // Optional: Default 'individual' (only supported value)
  top_k?: number;                      // Optional: Number of sources (1-10), default 3
  use_reranking?: boolean;             // Optional: Enable two-stage retrieval, default true
  initial_candidates?: number;         // Optional: Candidates for reranking (10-50), default 20
}
```

### Query Response

```typescript
export interface QueryResponse {
  answer: string;                      // AI-generated answer with citations
  sources: Source[];                   // Retrieved tax documents
  confidence: number;                  // Overall confidence score (0-1)
  timestamp: string;                   // ISO 8601 datetime
}

export interface Source {
  chunk_id: string;                    // Unique chunk identifier
  doc_id: string;                      // Parent document ID
  source_url: string;                  // Original ATO URL
  section_heading: string;             // Document section name
  text: string;                        // Relevant text excerpt
  crawl_date: string;                  // When document was indexed (YYYY-MM-DD)
  last_updated_on_page: string;        // Last update on source page (YYYY-MM-DD)
  is_table_summary: boolean;           // Whether chunk is table summary
  provenance: string;                  // Data source (e.g., "Australian Taxation Office")
  relevance_score: number;             // 0-1 similarity score
}
```

### Stats

```typescript
// GET /api/chat/stats
export interface VectorStoreStats {
  status: 'initialized' | 'error';
  document_count: number;
  embedding_dim: number;
  index_type: string;
  metadata_size: string;
}
```

---

## Chat Streaming Types

### Stream Request

```typescript
// POST /api/chat/stream
export interface StreamChatRequest {
  content: string;                     // User's message
}
```

### Stream Events

```typescript
// SSE Event Types
export type StreamEventType = 'message' | 'done' | 'error';

export interface StreamMessageEvent {
  event: 'message';
  data: {
    content: string;                   // Token chunk
  };
}

export interface StreamDoneEvent {
  event: 'done';
  data: {
    message: 'Stream completed';
  };
}

export interface StreamErrorEvent {
  event: 'error';
  data: {
    error: string;
  };
}

export type StreamEvent = StreamMessageEvent | StreamDoneEvent | StreamErrorEvent;
```

### Chat Message

```typescript
export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;                  // ISO 8601 datetime
  sources?: Source[];                  // For assistant messages with sources
}
```

---

## Checklist Types

### Generate Checklist

```typescript
// POST /api/checklist/generate
export interface GenerateChecklistRequest {
  user_id?: number;                    // Optional: User ID for tracking
  identity_info: IdentityInfo;
}

export interface IdentityInfo {
  employment_status: EmploymentStatus;
  income_sources: IncomeSource[];
  has_dependents: boolean;
  has_investment: boolean;
  has_rental_property: boolean;
  is_first_time_filer: boolean;
  additional_info?: {
    industry?: string;
    location?: AustralianState;
    [key: string]: any;               // Allow additional custom fields
  };
}

export type EmploymentStatus = 
  | 'employed' 
  | 'self-employed' 
  | 'unemployed' 
  | 'retired';

export type IncomeSource = 
  | 'salary' 
  | 'investment' 
  | 'rental' 
  | 'business' 
  | 'other';

export type AustralianState = 
  | 'NSW' 
  | 'VIC' 
  | 'QLD' 
  | 'WA' 
  | 'SA' 
  | 'TAS' 
  | 'ACT' 
  | 'NT';
```

### Checklist Response

```typescript
export interface Checklist {
  id: number;
  user_id?: number;
  identity_info: IdentityInfo;
  items: ChecklistItem[];
  created_at: string;                  // ISO 8601 datetime
  updated_at: string;                  // ISO 8601 datetime
}

export interface ChecklistItem {
  id: string;                          // Unique item identifier
  title: string;                       // Short task title
  description: string;                 // Detailed task description
  category: ChecklistCategory;
  priority: Priority;
  status: TaskStatus;
  estimated_time?: string;             // e.g., "10 minutes"
}

export type ChecklistCategory = 
  | 'documents' 
  | 'accounts' 
  | 'records' 
  | 'calculations' 
  | 'review';

export type Priority = 
  | 'high' 
  | 'medium' 
  | 'low';

export type TaskStatus = 
  | 'todo' 
  | 'in_progress' 
  | 'completed';
```

### Get Checklist

```typescript
// GET /api/checklist/{checklist_id}?user_id={user_id}
export interface GetChecklistParams {
  checklist_id: number;
  user_id?: number;
}

// Returns: Checklist
```

### Get User Checklists

```typescript
// GET /api/checklist/user/{user_id}
// Returns: Checklist[]
```

---

## Error Types

### API Error Response

```typescript
export interface APIErrorResponse {
  detail: string;                      // Error message
  status_code: number;                 // HTTP status code
}

export interface ValidationError {
  loc: string[];                       // Location of error in request
  msg: string;                         // Error message
  type: string;                        // Error type
}

export interface ValidationErrorResponse {
  detail: ValidationError[];
}
```

### Common HTTP Status Codes

```typescript
export enum HTTPStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
}
```

---

## Utility Types

### API Response Wrapper

```typescript
export type APIResponse<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: APIErrorResponse;
};
```

### Paginated Response (Future)

```typescript
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}
```

---

## Type Guards

### Check if Error Response

```typescript
export function isAPIError(response: any): response is APIErrorResponse {
  return response && typeof response.detail === 'string' && typeof response.status_code === 'number';
}

export function isValidationError(response: any): response is ValidationErrorResponse {
  return response && Array.isArray(response.detail) && response.detail.length > 0;
}
```

### Check Authentication

```typescript
export function isAuthenticated(response: any): response is LoginResponse {
  return response && typeof response.access_token === 'string' && response.token_type === 'bearer';
}
```

---

## Example Usage

### Type-Safe API Call

```typescript
import type { QueryRequest, QueryResponse, APIErrorResponse } from '@/types/api';

async function performQuery(question: string): Promise<QueryResponse> {
  const request: QueryRequest = {
    question,
    top_k: 5,
    use_reranking: true,
  };
  
  const response = await fetch('/api/chat/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    if (isAPIError(data)) {
      throw new Error(data.detail);
    }
    throw new Error('Unknown error');
  }
  
  return data as QueryResponse;
}
```

### Type-Safe Form Handling

```typescript
import type { GenerateChecklistRequest, Checklist } from '@/types/api';

const ChecklistForm = () => {
  const [formData, setFormData] = useState<IdentityInfo>({
    employment_status: 'employed',
    income_sources: ['salary'],
    has_dependents: false,
    has_investment: false,
    has_rental_property: false,
    is_first_time_filer: true,
  });
  
  const handleSubmit = async () => {
    const request: GenerateChecklistRequest = {
      identity_info: formData,
    };
    
    const response = await generateChecklist(request);
    // response is typed as Checklist
    console.log(response.items.length); // TypeScript knows this exists
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

---

## Type Validation

### Runtime Validation with Zod

```typescript
import { z } from 'zod';

// Define Zod schema matching API types
export const QueryResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(z.object({
    chunk_id: z.string(),
    doc_id: z.string(),
    source_url: z.string().url(),
    section_heading: z.string(),
    text: z.string(),
    crawl_date: z.string(),
    last_updated_on_page: z.string(),
    is_table_summary: z.boolean(),
    provenance: z.string(),
    relevance_score: z.number().min(0).max(1),
  })),
  confidence: z.number().min(0).max(1),
  timestamp: z.string(),
});

// Validate response
function validateQueryResponse(data: unknown): QueryResponse {
  return QueryResponseSchema.parse(data);
}
```

---

## OpenAPI/Swagger Integration

### Generate Types from OpenAPI

```bash
# Install openapi-typescript
npm install -D openapi-typescript

# Generate types from Backend OpenAPI spec
npx openapi-typescript http://localhost:8000/openapi.json -o src/types/api-generated.ts
```

### Use Generated Types

```typescript
import type { paths } from '@/types/api-generated';

type QueryEndpoint = paths['/api/chat/query']['post'];
type QueryRequest = QueryEndpoint['requestBody']['content']['application/json'];
type QueryResponse = QueryEndpoint['responses']['200']['content']['application/json'];
```

---

## Version Compatibility

### API Version Header

```typescript
export const API_VERSION = 'v1';

export function getAPIHeaders(token?: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-API-Version': API_VERSION,
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}
```

### Backward Compatibility

```typescript
// Handle old and new response formats
export function normalizeQueryResponse(response: any): QueryResponse {
  // Handle API version changes
  if (response.version === 'v1') {
    return response;
  }
  
  // Convert old format to new format
  return {
    answer: response.answer,
    sources: response.documents?.map((doc: any) => ({
      chunk_id: doc.id,
      doc_id: doc.doc_id,
      source_url: doc.url,
      section_heading: doc.heading,
      text: doc.content,
      crawl_date: doc.crawled_at,
      last_updated_on_page: doc.updated_at,
      is_table_summary: doc.is_table || false,
      provenance: doc.source,
      relevance_score: doc.score,
    })) || [],
    confidence: response.confidence || 0,
    timestamp: response.timestamp || new Date().toISOString(),
  };
}
```

---

## Next Steps

- [API Integration Guide](./integration.md)
- [Service Layer Implementation](./services.md)
- [Error Handling](../06-troubleshooting/api-errors.md)
- [Backend API Reference](../../../Backend/docs/03-api/endpoints.md)
