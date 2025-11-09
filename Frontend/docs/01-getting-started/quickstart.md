# Quick Start Guide

Get ChatTax Frontend running in 5 minutes.

## Prerequisites

✅ Node.js 18+ installed  
✅ Backend API running on `http://localhost:8000`  
✅ Git installed

---

## 5-Minute Setup

### Step 1: Clone & Install (2 minutes)

```bash
# Clone repository
git clone https://github.com/1641542839/ChatTax.git
cd ChatTax/Frontend

# Install dependencies
npm install
```

### Step 2: Configure Environment (1 minute)

```bash
# Create environment file
Copy-Item .env.example .env.local

# Edit .env.local - set Backend URL
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Or manually create `Frontend/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Step 3: Start Development Server (30 seconds)

```bash
npm run dev
```

Output:
```
   ▲ Next.js 15.0.2
   - Local:   http://localhost:3000
 ✓ Ready in 2.1s
```

### Step 4: Verify (1 minute)

Open browser: **http://localhost:3000**

You should see:
- ChatTax home page
- Login/Register buttons
- Australian tax theme

---

## Quick Feature Test

### Test 1: User Registration

1. Click **Register** button
2. Fill in form:
   - Email: `test@example.com`
   - Password: `Test123!`
   - Full Name: `Test User`
3. Click **Register**
4. Should redirect to dashboard

### Test 2: Tax Query

1. Navigate to **Chat** page
2. Ask: "What are tax deductions for individuals?"
3. Wait for streaming response
4. See citations from Australian tax documents

### Test 3: Checklist Generation

1. Go to **Checklist** page
2. Fill in identity info:
   - Employment status
   - Income sources
   - Family situation
3. Click **Generate Checklist**
4. See personalized tax preparation tasks (5-15 items)

---

## Quick Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)

# Build
npm run build            # Production build
npm run start            # Run production server

# Type checking
npm run type-check       # Check TypeScript errors

# Linting
npm run lint             # Check code quality
```

---

## Project Structure Overview

```
Frontend/
├── src/
│   ├── app/              # Pages (App Router)
│   │   ├── page.tsx      # Home page
│   │   ├── login/        # Login page
│   │   ├── chat/         # Chat interface
│   │   └── checklist/    # Checklist page
│   ├── components/       # React components
│   ├── services/         # API calls
│   ├── store/            # Zustand state
│   └── types/            # TypeScript types
├── public/               # Static assets
└── .env.local           # Environment config
```

---

## Quick API Integration Test

### Test Backend Connection

Create `src/lib/testAPI.ts`:

```typescript
export async function testAPIConnection() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat/stats`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Backend connected:', data);
    return true;
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
}
```

Run test in browser console:
```javascript
import { testAPIConnection } from '@/lib/testAPI';
await testAPIConnection();
```

### Quick API Query Test

```typescript
// Test RAG query
const response = await fetch(
  'http://localhost:8000/api/chat/query',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'What are tax deductions?',
      top_k: 3
    })
  }
);

const data = await response.json();
console.log('Answer:', data.answer);
console.log('Sources:', data.sources);
```

---

## Quick Troubleshooting

### Backend Not Running

**Error**: `Failed to fetch` in browser console

**Fix**:
```bash
# In Backend directory
cd ../Backend
uvicorn main:app --reload
```

Verify Backend at: http://localhost:8000/docs

### Port 3000 In Use

**Error**: `Port 3000 is already in use`

**Fix**:
```bash
# Use different port
PORT=3001 npm run dev

# Or kill existing process
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin'`

**Fix**: Check Backend `main.py` has CORS middleware:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### TypeScript Errors

**Error**: Module resolution errors

**Fix**:
```bash
# Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

## Quick Development Workflow

### 1. Start Backend

```bash
cd Backend
uvicorn main:app --reload
```

### 2. Start Frontend

```bash
cd Frontend
npm run dev
```

### 3. Make Changes

Edit files in `src/`:
- Pages: `src/app/`
- Components: `src/components/`
- API services: `src/services/`
- Types: `src/types/`

Hot reload happens automatically!

### 4. Check Console

- **Browser Console**: Frontend errors, API responses
- **Terminal**: Build errors, TypeScript errors
- **Backend Terminal**: API logs, database queries

---

## Quick Component Examples

### Simple API Query Component

```typescript
'use client';

import { useState } from 'react';
import { Button, Input, Card } from 'antd';

export default function QuickQuery() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, top_k: 3 })
        }
      );
      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Input.TextArea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a tax question..."
        rows={3}
      />
      <Button onClick={handleQuery} loading={loading}>
        Ask
      </Button>
      {answer && <p>{answer}</p>}
    </Card>
  );
}
```

### Quick Chat Streaming

```typescript
'use client';

import { useState } from 'react';

export default function QuickChat() {
  const [messages, setMessages] = useState<string[]>([]);

  const handleStream = async () => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat/stream?` +
      new URLSearchParams({ question: 'Tax deductions?' })
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.content) {
        setMessages(prev => [...prev, data.content]);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  };

  return (
    <div>
      <button onClick={handleStream}>Start Chat</button>
      {messages.map((msg, i) => (
        <p key={i}>{msg}</p>
      ))}
    </div>
  );
}
```

---

## Quick Authentication

### Register User

```typescript
const handleRegister = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'SecurePass123!',
        full_name: 'John Doe'
      })
    }
  );
  
  const data = await response.json();
  console.log('User registered:', data);
};
```

### Login & Store Token

```typescript
const handleLogin = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username: 'user@example.com',
        password: 'SecurePass123!'
      })
    }
  );
  
  const data = await response.json();
  
  // Store token
  localStorage.setItem('access_token', data.access_token);
  console.log('Logged in successfully');
};
```

### Use Token in API Calls

```typescript
const getProfile = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const user = await response.json();
  console.log('Current user:', user);
};
```

---

## Next Steps

**Now that you're running:**

1. **Explore Architecture**: [System Overview](../02-architecture/overview.md)
2. **Deep Dive API**: [API Integration Guide](../03-api/integration.md)
3. **Build Components**: [Component Documentation](../04-components/overview.md)
4. **Manage State**: [State Management](../05-state-management/architecture.md)
5. **Configure**: [Configuration Guide](./configuration.md)

---

## Quick Reference

### Important URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Backend Docs**: http://localhost:8000/docs
- **Backend Admin**: http://localhost:8000/admin

### Environment Variables

```env
# Required
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Optional
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_DEBUG=true
```

### Key Files

- `src/app/page.tsx` - Home page
- `src/services/api.ts` - API client
- `src/types/api.ts` - Type definitions
- `.env.local` - Environment config

---

## For GitHub Copilot

**Quick Start Context**:
ChatTax Frontend quick setup requires Node.js 18+, Backend running on port 8000, and `npm install` + `npm run dev`. Environment file `.env.local` must contain `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.

**5-Minute Flow**:
1. Clone repo → 2. npm install → 3. Create .env.local → 4. npm run dev → 5. Open localhost:3000

**Quick Test**:
Register user → Ask tax question in chat → Generate checklist with identity info

**Common Quick Fixes**:
- Backend not running → `uvicorn main:app --reload`
- Port conflict → `PORT=3001 npm run dev`
- CORS errors → Check Backend CORS middleware
- Type errors → Restart TS server

---

**Next**: [Configuration Guide](./configuration.md) | [API Integration](../03-api/integration.md) | [Installation](./installation.md)
