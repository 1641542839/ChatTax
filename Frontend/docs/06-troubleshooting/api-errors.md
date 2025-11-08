# API Errors

Guide to handling and troubleshooting API errors in ChatTax Frontend.

## Common API Error Codes

### Authentication Errors (401, 403)

**401 Unauthorized**
```json
{
  "detail": "Could not validate credentials"
}
```

**Causes**:
- Missing or invalid JWT token
- Token expired
- Token not included in request

**Solutions**:
```typescript
// Ensure token is included
const token = localStorage.getItem('access_token');

fetch(`${API_BASE}/api/endpoint`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Check token expiration
if (isTokenExpired()) {
  logout();
  router.push('/login');
}
```

**403 Forbidden**
```json
{
  "detail": "Not enough permissions"
}
```

**Solution**: User doesn't have access to resource. Check user roles.

---

### Validation Errors (422)

**Error Response**:
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

**Causes**:
- Invalid request data
- Missing required fields
- Type mismatches

**Solution**:
```typescript
// Validate before sending
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

try {
  schema.parse(formData);
  // Send request
} catch (error) {
  // Show validation errors
}
```

---

### Server Errors (500, 502, 503)

**500 Internal Server Error**
```json
{
  "detail": "Internal server error"
}
```

**Causes**:
- Backend bug
- Database connection issue
- Unhandled exception

**Solution**:
```typescript
// Retry with exponential backoff
async function retryRequest(fn: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status >= 500 && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
}
```

---

## Error Handling Patterns

### API Error Class

```typescript
// src/lib/errors.ts
export class APIError extends Error {
  status: number;
  details: any;

  constructor(status: number, message: string, details?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }

  static fromResponse(response: Response, data: any): APIError {
    return new APIError(
      response.status,
      data.detail || response.statusText,
      data
    );
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isValidationError() {
    return this.status === 422;
  }

  get isServerError() {
    return this.status >= 500;
  }
}
```

### API Client with Error Handling

```typescript
// src/services/api.ts
import { APIError } from '@/lib/errors';

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw APIError.fromResponse(response, data);
  }

  return data;
}
```

### Component Error Handling

```typescript
'use client';

import { useState } from 'react';
import { APIError } from '@/lib/errors';
import { message } from 'antd';

export default function MyComponent() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await apiCall(data);
      message.success('Success!');
    } catch (error) {
      if (error instanceof APIError) {
        if (error.isUnauthorized) {
          message.error('Please login again');
          router.push('/login');
        } else if (error.isValidationError) {
          message.error(`Validation error: ${error.message}`);
        } else if (error.isServerError) {
          message.error('Server error. Please try again later.');
        } else {
          message.error(error.message);
        }
      } else {
        message.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return <button onClick={handleSubmit} disabled={loading}>Submit</button>;
}
```

---

## CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Browser Console**:
```
Access to fetch at 'http://localhost:8000/api/chat/query' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solution**: Update Backend CORS settings

```python
# Backend/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Network Errors

### Connection Refused

**Error**: `Failed to fetch` or `net::ERR_CONNECTION_REFUSED`

**Causes**:
- Backend not running
- Wrong API URL
- Firewall blocking

**Solution**:
```bash
# Check Backend is running
curl http://localhost:8000/docs

# Check .env.local
cat .env.local  # Should have NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Timeout Errors

**Error**: Request takes too long

**Solution**:
```typescript
// Add timeout to fetch
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s

try {
  const response = await fetch(url, {
    signal: controller.signal,
  });
  clearTimeout(timeout);
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('Request timeout');
  }
}
```

---

## Rate Limiting

**Error**: `429 Too Many Requests`

```json
{
  "detail": "Rate limit exceeded. Try again in 60 seconds."
}
```

**Solution**:
```typescript
// Implement request throttling
import { throttle } from 'lodash';

const throttledQuery = throttle(
  async (question: string) => {
    return await queryTax({ question });
  },
  1000 // Max 1 request per second
);
```

---

## Debugging API Calls

### Browser DevTools

1. **Network Tab**: View all API requests
   - Check request URL
   - Check request headers (Authorization)
   - Check request body
   - Check response status and body

2. **Console**: Log API calls
```typescript
console.log('API Request:', {
  url: endpoint,
  method: options?.method || 'GET',
  headers,
  body: options?.body,
});
```

### API Response Logging

```typescript
// src/services/api.ts
export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const isDev = process.env.NEXT_PUBLIC_ENV === 'development';

  if (isDev) {
    console.log('🔵 API Request:', endpoint, options);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (isDev) {
      console.log('🟢 API Response:', endpoint, data);
    }

    return data;
  } catch (error) {
    if (isDev) {
      console.error('🔴 API Error:', endpoint, error);
    }
    throw error;
  }
}
```

---

## Testing API Calls

### Test with curl

```bash
# Test authentication
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=password123"

# Test query with token
curl http://localhost:8000/api/chat/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"What are tax deductions?","top_k":3}'
```

### Test Component

```typescript
// src/lib/testAPI.ts
export async function testAPIConnection() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat/stats`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Backend connected:', data);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
}

// Usage in component or browser console
import { testAPIConnection } from '@/lib/testAPI';
await testAPIConnection();
```

---

## For GitHub Copilot

**API Error Handling**: ChatTax uses APIError class for structured error handling. Common errors: 401 (unauthorized - check token), 422 (validation - check request data), 500 (server error - retry). CORS errors → check Backend middleware. Network errors → verify Backend running.

**Error Patterns**:
- Wrap API calls in try-catch
- Use APIError for type checking
- Show user-friendly messages with Ant Design message
- Retry on 500+ errors
- Redirect to login on 401

**Debugging**:
- Browser DevTools Network tab
- Console logging in development
- Test with curl or Postman
- Use testAPIConnection utility

---

**See also**: [Common Issues](./common-issues.md) | [FAQ](./faq.md) | [API Integration](../03-api/integration.md)
