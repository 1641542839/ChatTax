# Frequently Asked Questions (FAQ)

Common questions about ChatTax Frontend development.

## General Questions

### What is ChatTax Frontend?

ChatTax Frontend is a Next.js 15 web application that provides AI-powered Australian tax assistance through chat, RAG queries, and personalized checklist generation. Built with React 18, TypeScript, and Ant Design.

### What technologies does it use?

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript 5
- **Components**: Ant Design 5
- **Styling**: Tailwind CSS 3
- **State**: Zustand 4
- **API**: Fetch + EventSource (SSE)

### Is it production-ready?

Yes, the application can be built for production with `npm run build`. Ensure environment variables are configured properly for your production environment.

---

## Setup Questions

### What Node.js version do I need?

Node.js 18.17.0 or higher. Recommended: 18.x or 20.x LTS versions.

```bash
node --version  # Should be v18.17.0+
```

### Do I need the Backend running?

Yes, Frontend requires the Backend API to be running for all features to work. Backend provides:
- Authentication
- RAG tax queries
- Chat streaming
- Checklist generation

### How do I configure the Backend URL?

Create `.env.local` in Frontend root:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Change URL for different environments (development, staging, production).

### Can I run Frontend without Backend?

No, all core features require Backend API. You can only view static pages without Backend.

---

## Development Questions

### How do I start the development server?

```bash
cd Frontend
npm install
npm run dev

# Opens on http://localhost:3000
```

### How do I fix TypeScript errors?

```bash
# Check errors
npm run type-check

# Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### How do I format code?

```bash
# Format all files
npm run format

# Check formatting
npm run lint
```

### Where do I add new pages?

Use Next.js App Router structure:

```
src/app/
├── your-page/
│   └── page.tsx
```

Creates route: `/your-page`

### Where do I add new components?

```
src/components/
├── feature-name/
│   └── ComponentName.tsx
```

Import with path alias:
```typescript
import { ComponentName } from '@/components/feature-name/ComponentName';
```

---

## API Questions

### How do I call the Backend API?

Use service layer:

```typescript
import { queryTax } from '@/services/chat';

const response = await queryTax({
  question: 'What are tax deductions?',
  top_k: 5,
});
```

### How does authentication work?

1. User logs in → Backend returns JWT token
2. Token stored in `localStorage`
3. Token included in all API requests:
   ```typescript
   headers: {
     'Authorization': `Bearer ${token}`
   }
   ```

### How do I handle API errors?

```typescript
import { APIError } from '@/lib/errors';

try {
  const data = await apiCall();
} catch (error) {
  if (error instanceof APIError) {
    if (error.isUnauthorized) {
      // Redirect to login
    } else {
      // Show error message
    }
  }
}
```

### What are the main API endpoints?

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login (get JWT)
- `GET /api/auth/me` - Get current user
- `POST /api/chat/query` - RAG query
- `GET /api/chat/stream` - SSE streaming
- `POST /api/checklist/generate` - Generate checklist

See [API Documentation](../03-api/integration.md) for complete reference.

---

## State Management Questions

### How do I use Zustand stores?

```typescript
import { useAuthStore } from '@/store/authStore';

function MyComponent() {
  const { user, login, logout } = useAuthStore();
  
  return (
    <div>
      {user ? <p>Hello {user.full_name}</p> : <button onClick={() => login(...)}>Login</button>}
    </div>
  );
}
```

### When should I use Zustand vs useState?

- **Zustand**: Global state (auth, chat messages, checklist)
- **useState**: Local component state (form inputs, UI toggles)

### How do I persist state?

Zustand `persist` middleware (already configured for auth):

```typescript
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      // Store definition
    }),
    { name: 'my-store' }
  )
);
```

---

## Styling Questions

### Should I use Tailwind or Ant Design?

Use both:
- **Ant Design**: Complex components (Form, Table, Modal, etc.)
- **Tailwind**: Layout, spacing, utilities, custom styles

```typescript
<Card className="shadow-lg rounded-lg">
  <Form layout="vertical">
    <div className="flex gap-4 mb-4">
      <Input placeholder="Search" />
    </div>
  </Form>
</Card>
```

### How do I customize Ant Design theme?

```typescript
// app/layout.tsx
import { ConfigProvider } from 'antd';

<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#0ea5e9',
      borderRadius: 8,
    },
  }}
>
  {children}
</ConfigProvider>
```

### Can I use CSS Modules?

Yes, create `Component.module.css`:

```css
.container {
  padding: 20px;
}
```

```typescript
import styles from './Component.module.css';

<div className={styles.container}>Content</div>
```

---

## Deployment Questions

### How do I build for production?

```bash
npm run build
npm run start

# Or for static export
npm run build
# Deploy .next/ folder
```

### What environment variables do I need?

**Required**:
```env
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

**Optional**:
```env
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_DEBUG=false
```

### Where should I deploy?

Recommended platforms:
- **Vercel**: Native Next.js support
- **Netlify**: Static/serverless deployment
- **AWS**: S3 + CloudFront (static) or ECS (Docker)
- **Docker**: Use `Dockerfile` for containerized deployment

### How do I configure CORS for production?

Update Backend `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",  # Production domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Feature Questions

### How does chat streaming work?

Uses Server-Sent Events (SSE):

```typescript
const eventSource = new EventSource(
  `${API_BASE}/api/chat/stream?question=${question}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Update UI with streamed content
};
```

### How do checklists work?

1. User fills identity form (employment, income, etc.)
2. Frontend sends to `POST /api/checklist/generate`
3. Backend generates 5-15 personalized tasks
4. Frontend displays with checkboxes for tracking

### Can users save their progress?

Yes, checklist state is persisted. Implement saving with:

```typescript
await updateChecklist(checklistId, {
  items: tasks,
  completed_count: completedTasks,
});
```

---

## Troubleshooting Questions

### Why isn't hot reload working?

```bash
# Clear cache
Remove-Item -Recurse -Force .next
npm run dev
```

### Why do I get CORS errors?

1. Backend not configured to allow Frontend origin
2. Check Backend `main.py` has CORS middleware
3. Ensure `allow_origins` includes Frontend URL

### Why is my API call failing?

1. Backend not running → `uvicorn main:app --reload`
2. Wrong URL in `.env.local`
3. Missing or expired JWT token
4. Check Browser DevTools → Network tab

### How do I debug TypeScript errors?

```bash
# Run type checker
npm run type-check

# Check specific file
npx tsc --noEmit src/path/to/file.tsx

# Restart TS server in VS Code
```

---

## Performance Questions

### How can I improve page load speed?

1. Use dynamic imports for heavy components
2. Implement pagination for large lists
3. Optimize images with Next.js `<Image>`
4. Enable static generation where possible

### How do I reduce bundle size?

```bash
# Analyze bundle
ANALYZE=true npm run build

# Use code splitting
import dynamic from 'next/dynamic';

const Heavy = dynamic(() => import('./Heavy'));
```

### Should I use Server or Client Components?

- **Server Components** (default): Static content, data fetching
- **Client Components** (`'use client'`): Interactivity, state, event handlers

---

## Contributing Questions

### How do I contribute?

1. Follow TypeScript strict mode
2. Use path aliases (`@/`)
3. Type all API calls
4. Update documentation
5. Run `npm run lint` before committing

### What's the code style?

- **ESLint**: Enforced code quality
- **Prettier**: Auto-formatting
- **TypeScript**: Strict mode, no `any` types
- **Naming**: camelCase for variables, PascalCase for components

---

## For GitHub Copilot

**FAQ Summary**:

**Setup**: Node 18+, Backend required, .env.local with API URL.

**Development**: `npm run dev` on port 3000, TypeScript strict mode, path aliases with @/.

**API**: Service layer in src/services/, JWT auth in localStorage, APIError for error handling.

**State**: Zustand for global (auth, chat, checklist), useState for local.

**Styling**: Ant Design + Tailwind, ConfigProvider for theme.

**Deployment**: Build with `npm run build`, configure CORS in Backend, deploy to Vercel/Netlify/AWS.

**Troubleshooting**: Clear .next cache, check Backend running, verify .env.local, restart TS server.

---

**More Help**: [Common Issues](./common-issues.md) | [API Errors](./api-errors.md) | [Documentation](../)
