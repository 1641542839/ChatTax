# Common Issues

Solutions to common problems in ChatTax Frontend development.

## Installation Issues

### Node Version Mismatch

**Error**: `The engine "node" is incompatible with this module`

**Solution**:
```bash
# Check current version
node --version

# Install Node 18+ (recommended: 18.17.0+)
# Using nvm (Node Version Manager):
nvm install 18
nvm use 18

# Verify
node --version  # Should show v18.x.x
```

### npm Install Fails

**Error**: `ERESOLVE unable to resolve dependency tree`

**Solution**:
```bash
# Clear cache
npm cache clean --force

# Delete node_modules and lock file
Remove-Item -Recurse -Force node_modules, package-lock.json

# Reinstall
npm install
```

### Permission Errors (Windows)

**Error**: `EPERM: operation not permitted`

**Solution**:
```powershell
# Run as Administrator
# Or set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Development Server Issues

### Port 3000 Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Option 1: Use different port
PORT=3001 npm run dev

# Option 2: Kill process on port 3000 (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Option 3: Find process manually
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Hot Reload Not Working

**Problem**: Changes not reflecting in browser

**Solution**:
```bash
# 1. Stop dev server (Ctrl+C)
# 2. Clear .next cache
Remove-Item -Recurse -Force .next

# 3. Restart
npm run dev

# 4. Hard refresh browser (Ctrl+Shift+R)
```

### Build Fails

**Error**: Type errors or missing modules

**Solution**:
```bash
# Check TypeScript errors
npm run type-check

# Install missing dependencies
npm install

# Clear cache and rebuild
Remove-Item -Recurse -Force .next, node_modules
npm install
npm run build
```

---

## Backend Connection Issues

### Backend Not Running

**Error**: `Failed to fetch` or `Network request failed`

**Solution**:
```bash
# Verify Backend is running
# In Backend directory:
cd ../Backend
uvicorn main:app --reload

# Check Backend is accessible
# Open: http://localhost:8000/docs
```

### Wrong API URL

**Error**: Connection failures despite Backend running

**Solution**:
```bash
# Check .env.local
cat .env.local

# Should contain:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# If missing, create .env.local:
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local

# Restart dev server
npm run dev
```

### CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:

Check Backend CORS configuration in `Backend/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend dev server
        "http://localhost:3001",  # Alternative port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Restart Backend after changes.

---

## TypeScript Issues

### Module Not Found

**Error**: `Cannot find module '@/services/api'`

**Solution**:
```bash
# 1. Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# 2. Check tsconfig.json has path aliases:
# "paths": {
#   "@/*": ["./src/*"]
# }

# 3. Restart VS Code
```

### Type Errors

**Error**: `Property 'X' does not exist on type 'Y'`

**Solution**:
```typescript
// Check type definitions in src/types/api.ts
// Ensure types match Backend schemas

// Example: Add missing property
export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string; // Add if missing
}
```

### any Type Warnings

**Error**: `Unsafe assignment of an any value`

**Solution**:
```typescript
// Don't use 'any'
const data: any = response.json(); // ❌

// Use proper types
import type { QueryResponse } from '@/types/api';
const data: QueryResponse = await response.json(); // ✅
```

---

## Authentication Issues

### Token Not Persisting

**Problem**: User logged out on page refresh

**Solution**:
```typescript
// Ensure token stored in localStorage
// In authService or authStore:
localStorage.setItem('access_token', token);

// Check on page load
useEffect(() => {
  const token = localStorage.getItem('access_token');
  if (token) {
    // Verify token with Backend
    checkAuth();
  }
}, []);
```

### Unauthorized Errors

**Error**: `401 Unauthorized` on API calls

**Solution**:
```typescript
// Ensure token included in API calls
const token = localStorage.getItem('access_token');

fetch(`${API_BASE}/api/chat/query`, {
  headers: {
    'Authorization': `Bearer ${token}`, // Must include
    'Content-Type': 'application/json',
  },
});
```

### Login Redirects Immediately

**Problem**: Can't stay on login page when already authenticated

**Solution**:
```typescript
// In login page, check auth state
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated]);

  // ...
}
```

---

## Streaming Issues

### SSE Not Working

**Problem**: Chat streaming not displaying real-time

**Solution**:
```typescript
// Check EventSource connection
const eventSource = new EventSource(
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat/stream?question=${encodeURIComponent(question)}`
);

// Add error handling
eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};

// Check Browser DevTools → Network → EventStream
```

### Stream Not Closing

**Problem**: EventSource stays open

**Solution**:
```typescript
useEffect(() => {
  const eventSource = new EventSource(url);
  
  // Cleanup on unmount
  return () => {
    eventSource.close();
  };
}, []);
```

---

## Build and Deployment Issues

### Build Fails in Production

**Error**: Build succeeds locally but fails in production

**Solution**:
```bash
# Test production build locally
npm run build
npm run start

# Check for:
# - Environment variables set
# - All dependencies installed
# - No dev dependencies in production code
```

### Environment Variables Not Working

**Problem**: `process.env.NEXT_PUBLIC_API_BASE_URL` is undefined

**Solution**:
```bash
# Must use NEXT_PUBLIC_ prefix for browser access
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000  # ✅
API_BASE_URL=http://localhost:8000              # ❌

# Restart server after .env.local changes
```

### Images Not Loading

**Problem**: Images return 404

**Solution**:
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image 
  src="/images/logo.png"  // Must be in public/ folder
  alt="Logo"
  width={200}
  height={50}
/>

// Configure domains in next.config.js for external images
module.exports = {
  images: {
    domains: ['example.com'],
  },
};
```

---

## Performance Issues

### Slow Page Loads

**Problem**: Pages take long to load

**Solution**:
```typescript
// 1. Use dynamic imports for heavy components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});

// 2. Implement pagination for large lists
// 3. Use React.memo for expensive components
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  // Component logic
});
```

### Too Many Re-renders

**Error**: `Maximum update depth exceeded`

**Solution**:
```typescript
// ❌ Don't call setState in render
function Component() {
  const [count, setCount] = useState(0);
  setCount(count + 1); // ❌ Infinite loop
}

// ✅ Use useEffect for side effects
function Component() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(count + 1);
  }, []); // Run once
}
```

---

## For GitHub Copilot

**Common Issues Summary**:

**Installation**: Node 18+ required, clear cache and reinstall if issues.

**Dev Server**: Port conflicts → use PORT=3001, Hot reload issues → clear .next cache.

**Backend**: Ensure running on port 8000, check .env.local has correct URL, verify CORS settings.

**TypeScript**: Restart TS server, check path aliases in tsconfig.json, use proper types not any.

**Auth**: Store token in localStorage, include Bearer token in API headers.

**Streaming**: Use EventSource, add error handling, close on unmount.

**Build**: Test locally with npm run build, use NEXT_PUBLIC_ prefix for env vars.

---

**See also**: [API Errors](./api-errors.md) | [FAQ](./faq.md) | [Configuration](../01-getting-started/configuration.md)
