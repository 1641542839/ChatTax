# Configuration Guide

Complete environment configuration and settings for ChatTax Frontend.

## Environment Variables

### Required Variables

Create `.env.local` in project root:

```env
# Backend API Configuration (REQUIRED)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**Important**: 
- `NEXT_PUBLIC_` prefix exposes variable to browser
- Never commit `.env.local` to git
- Use `.env.example` as template

### Optional Variables

```env
# Environment
NEXT_PUBLIC_ENV=development  # development | staging | production

# Debug Mode
NEXT_PUBLIC_DEBUG=true       # Enable console logging

# API Timeouts
NEXT_PUBLIC_API_TIMEOUT=30000  # 30 seconds

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_CHAT_HISTORY=true
```

### Environment Files

| File | Purpose | Git Tracked |
|------|---------|-------------|
| `.env.local` | Local development (overrides all) | ❌ No |
| `.env.development` | Development defaults | ✅ Yes |
| `.env.production` | Production defaults | ✅ Yes |
| `.env.example` | Template for developers | ✅ Yes |

**Priority**: `.env.local` > `.env.production` > `.env.development`

---

## Backend API Configuration

### Development (Local)

```env
# Local Backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Staging

```env
# Staging Backend
NEXT_PUBLIC_API_BASE_URL=https://staging-api.chattax.com
```

### Production

```env
# Production Backend
NEXT_PUBLIC_API_BASE_URL=https://api.chattax.com
```

### API Endpoints

Backend provides these endpoints (configured via `NEXT_PUBLIC_API_BASE_URL`):

```typescript
// Base URL from environment
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// Endpoints
const AUTH_REGISTER = `${API_BASE}/api/auth/register`;
const AUTH_LOGIN = `${API_BASE}/api/auth/login`;
const CHAT_QUERY = `${API_BASE}/api/chat/query`;
const CHAT_STREAM = `${API_BASE}/api/chat/stream`;
const CHECKLIST_GENERATE = `${API_BASE}/api/checklist/generate`;
```

---

## Next.js Configuration

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode for development warnings
  reactStrictMode: true,

  // Environment variables available to browser
  env: {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },

  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // Production optimizations
  swcMinify: true,
  compress: true,

  // Output config
  output: 'standalone', // For Docker deployment

  // Webpack customization (if needed)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side only
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    // Language and environment
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    
    // Module resolution
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    
    // Type checking
    "strict": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    
    // Emit
    "noEmit": true,
    "incremental": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    
    // Path aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/services/*": ["./src/services/*"],
      "@/types/*": ["./src/types/*"],
      "@/store/*": ["./src/store/*"],
      "@/lib/*": ["./src/lib/*"]
    },
    
    // Next.js specific
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### Path Aliases Usage

```typescript
// Instead of relative imports
import { Button } from '../../../components/ui/Button';
import { queryTax } from '../../../services/chat';

// Use path aliases
import { Button } from '@/components/ui/Button';
import { queryTax } from '@/services/chat';
```

---

## Tailwind CSS Configuration

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
  // Important for Ant Design compatibility
  corePlugins: {
    preflight: false,
  },
};
```

---

## ESLint Configuration

### .eslintrc.json

```json
{
  "extends": [
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error"
  },
  "ignorePatterns": ["node_modules/", ".next/", "out/"]
}
```

---

## API Client Configuration

### src/services/api.ts

```typescript
// API client configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// API client with auth
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('access_token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  };

  const response = await fetch(
    `${API_CONFIG.baseURL}${endpoint}`,
    config
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
```

---

## Authentication Configuration

### Token Storage

```typescript
// src/lib/auth.ts

export const AUTH_CONFIG = {
  tokenKey: 'access_token',
  userKey: 'user_info',
  tokenExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Store token
export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_CONFIG.tokenKey, token);
  localStorage.setItem('token_time', Date.now().toString());
}

// Get token
export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_CONFIG.tokenKey);
}

// Clear auth
export function clearAuth(): void {
  localStorage.removeItem(AUTH_CONFIG.tokenKey);
  localStorage.removeItem(AUTH_CONFIG.userKey);
  localStorage.removeItem('token_time');
}

// Check if token expired
export function isTokenExpired(): boolean {
  const tokenTime = localStorage.getItem('token_time');
  if (!tokenTime) return true;
  
  const elapsed = Date.now() - parseInt(tokenTime);
  return elapsed > AUTH_CONFIG.tokenExpiry;
}
```

---

## CORS Configuration

### Frontend Requirements

Frontend running on `http://localhost:3000` needs Backend CORS configured.

**Backend must allow** (in `Backend/main.py`):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend development
        "https://chattax.com",     # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Testing CORS

```typescript
// Test CORS from browser console
const response = await fetch(
  'http://localhost:8000/api/chat/stats',
  {
    method: 'GET',
    credentials: 'include',
  }
);

console.log('CORS working:', response.ok);
```

---

## Development vs Production

### Development Mode

```env
# .env.local (development)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_DEBUG=true
```

**Features**:
- Hot reload enabled
- Source maps included
- Detailed error messages
- Console logging enabled

### Production Mode

```env
# .env.production
NEXT_PUBLIC_API_BASE_URL=https://api.chattax.com
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_DEBUG=false
```

**Features**:
- Code minified
- No source maps
- Error boundaries
- Analytics enabled

---

## Security Configuration

### Content Security Policy

Add to `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self' http://localhost:8000",
          ].join('; '),
        },
      ],
    },
  ];
}
```

### Environment Variable Security

**❌ Never expose in Frontend**:
- Database credentials
- API keys for external services
- Secret keys

**✅ Safe to expose** (with `NEXT_PUBLIC_`):
- Backend API URL
- Public feature flags
- Analytics IDs

---

## Performance Configuration

### Bundle Analysis

```bash
# Install analyzer
npm install --save-dev @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

### Image Optimization

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['localhost', 'api.chattax.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

---

## For GitHub Copilot

**Configuration Context**:
ChatTax Frontend configuration centers on `.env.local` with `NEXT_PUBLIC_API_BASE_URL` pointing to Backend. TypeScript strict mode enabled with path aliases (@/). Next.js 15 with App Router, Tailwind CSS with Ant Design compatibility, ESLint for code quality.

**Critical Settings**:
- Environment: `.env.local` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
- TypeScript: Strict mode, path aliases (@/), no implicit any
- API Client: Fetch-based with auth token injection
- CORS: Backend must allow `http://localhost:3000`
- Auth: JWT tokens in localStorage with expiry checking

**Path Aliases**:
- `@/components/*` → `src/components/*`
- `@/services/*` → `src/services/*`
- `@/types/*` → `src/types/*`
- `@/store/*` → `src/store/*`

**Security**:
- Never commit `.env.local`
- Use `NEXT_PUBLIC_` for browser variables only
- Store JWT in localStorage with expiry
- CSP headers in production

---

**Next**: [System Overview](../02-architecture/overview.md) | [API Integration](../03-api/integration.md) | [Back to Getting Started](./installation.md)
