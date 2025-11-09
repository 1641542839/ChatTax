# Routing & Pages

Complete guide to Next.js App Router and page structure in ChatTax Frontend.

## Next.js App Router

ChatTax uses **Next.js 15 App Router** (not Pages Router).

### Key Concepts

- **File-based routing**: Folder structure defines routes
- **Server Components**: Default for all components
- **Client Components**: Use `'use client'` directive
- **Layouts**: Shared UI across routes
- **Loading States**: Automatic loading UI

---

## Route Structure

```
app/
├── layout.tsx              # Root layout (applies to all routes)
├── page.tsx                # Home page (/)
├── loading.tsx             # Loading UI for all routes
├── error.tsx               # Error boundary
│
├── login/
│   └── page.tsx            # /login
│
├── register/
│   └── page.tsx            # /register
│
├── chat/
│   ├── page.tsx            # /chat
│   └── loading.tsx         # Loading UI for chat
│
├── checklist/
│   ├── page.tsx            # /checklist
│   ├── new/
│   │   └── page.tsx        # /checklist/new
│   └── [id]/
│       ├── page.tsx        # /checklist/:id (dynamic)
│       └── edit/
│           └── page.tsx    # /checklist/:id/edit
│
└── profile/
    ├── page.tsx            # /profile
    └── settings/
        └── page.tsx        # /profile/settings
```

---

## Route Definitions

### Public Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Home/landing page |
| `/login` | `app/login/page.tsx` | User login |
| `/register` | `app/register/page.tsx` | User registration |

### Protected Routes (Require Authentication)

| Route | File | Description |
|-------|------|-------------|
| `/chat` | `app/chat/page.tsx` | Chat interface |
| `/checklist` | `app/checklist/page.tsx` | Checklist list |
| `/checklist/new` | `app/checklist/new/page.tsx` | Create checklist |
| `/checklist/:id` | `app/checklist/[id]/page.tsx` | View checklist |
| `/checklist/:id/edit` | `app/checklist/[id]/edit/page.tsx` | Edit checklist |
| `/profile` | `app/profile/page.tsx` | User profile |
| `/profile/settings` | `app/profile/settings/page.tsx` | User settings |

---

## Page Examples

### 1. Home Page (`app/page.tsx`)

```typescript
import Link from 'next/link';
import { Button } from 'antd';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">
        Welcome to ChatTax
      </h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        Your AI-powered Australian tax assistant. Get personalized 
        tax advice and generate customized checklists.
      </p>
      
      <div className="flex gap-4">
        <Link href="/register">
          <Button type="primary" size="large">
            Get Started
          </Button>
        </Link>
        <Link href="/login">
          <Button size="large">
            Login
          </Button>
        </Link>
      </div>
    </main>
  );
}
```

### 2. Chat Page (`app/chat/page.tsx`)

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import ChatInterface from '@/components/chat/ChatInterface';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { messages, loadHistory } = useChatStore();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Load chat history
    loadHistory();
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // or <Loading />
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Tax Chat</h1>
      <ChatInterface messages={messages} />
    </div>
  );
}
```

### 3. Dynamic Route (`app/checklist/[id]/page.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getChecklistById } from '@/services/checklist';
import ChecklistDisplay from '@/components/checklist/ChecklistDisplay';
import type { Checklist } from '@/types/api';

export default function ChecklistDetailPage() {
  const params = useParams();
  const checklistId = params.id as string;
  
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChecklist() {
      try {
        const data = await getChecklistById(checklistId);
        setChecklist(data);
      } catch (error) {
        console.error('Failed to load checklist:', error);
      } finally {
        setLoading(false);
      }
    }

    loadChecklist();
  }, [checklistId]);

  if (loading) return <div>Loading...</div>;
  if (!checklist) return <div>Checklist not found</div>;

  return (
    <div className="container mx-auto py-8">
      <ChecklistDisplay checklist={checklist} />
    </div>
  );
}
```

---

## Layouts

### Root Layout (`app/layout.tsx`)

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChatTax - Australian Tax Assistant',
  description: 'AI-powered tax assistance for Australian individuals',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AntdRegistry>
      </body>
    </html>
  );
}
```

### Nested Layout (`app/checklist/layout.tsx`)

```typescript
import ChecklistSidebar from '@/components/checklist/ChecklistSidebar';

export default function ChecklistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <ChecklistSidebar />
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
}
```

---

## Navigation

### Link Component

```typescript
import Link from 'next/link';

// Basic link
<Link href="/chat">Go to Chat</Link>

// With styling
<Link 
  href="/checklist" 
  className="text-blue-500 hover:underline"
>
  View Checklists
</Link>

// With active state
<Link 
  href="/profile"
  className={pathname === '/profile' ? 'active' : ''}
>
  Profile
</Link>
```

### Programmatic Navigation

```typescript
'use client';

import { useRouter } from 'next/navigation';

export default function MyComponent() {
  const router = useRouter();

  const handleSubmit = async () => {
    // Navigate after action
    await createChecklist();
    router.push('/checklist');
  };

  const goBack = () => {
    router.back();
  };

  const refresh = () => {
    router.refresh(); // Refresh server data
  };

  return (
    <>
      <button onClick={handleSubmit}>Submit</button>
      <button onClick={goBack}>Back</button>
      <button onClick={refresh}>Refresh</button>
    </>
  );
}
```

### URL Parameters

```typescript
'use client';

import { useSearchParams, usePathname } from 'next/navigation';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Get query parameters
  const query = searchParams.get('q');
  const filter = searchParams.get('filter');

  // Current path
  console.log('Current path:', pathname);

  return (
    <div>
      <p>Query: {query}</p>
      <p>Filter: {filter}</p>
    </div>
  );
}

// Usage: /search?q=tax&filter=deductions
```

---

## Route Protection

### Middleware (`middleware.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/', '/login', '/register'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Client-Side Protection

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <div>Protected content</div>;
}
```

---

## Loading States

### Route Loading (`app/loading.tsx`)

```typescript
import { Spin } from 'antd';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spin size="large" tip="Loading..." />
    </div>
  );
}
```

### Specific Route Loading (`app/chat/loading.tsx`)

```typescript
export default function ChatLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>
  );
}
```

---

## Error Handling

### Error Boundary (`app/error.tsx`)

```typescript
'use client';

import { useEffect } from 'react';
import { Button } from 'antd';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="mb-4 text-gray-600">{error.message}</p>
      <Button type="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
```

### Not Found (`app/not-found.tsx`)

```typescript
import Link from 'next/link';
import { Button } from 'antd';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Page not found</p>
      <Link href="/">
        <Button type="primary">Go Home</Button>
      </Link>
    </div>
  );
}
```

---

## Route Groups

### Grouping without URL (`app/(auth)/layout.tsx`)

```
app/
├── (auth)/              # Group without affecting URL
│   ├── layout.tsx       # Shared layout for auth pages
│   ├── login/
│   │   └── page.tsx     # /login (not /auth/login)
│   └── register/
│       └── page.tsx     # /register (not /auth/register)
```

```typescript
// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-container">
      <div className="auth-card">
        {children}
      </div>
    </div>
  );
}
```

---

## Parallel Routes

### Multiple Slots (`app/dashboard/@stats/page.tsx`)

```
app/
├── dashboard/
│   ├── @stats/
│   │   └── page.tsx
│   ├── @charts/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
```

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  stats,
  charts,
}: {
  children: React.ReactNode;
  stats: React.ReactNode;
  charts: React.ReactNode;
}) {
  return (
    <div className="dashboard">
      <div className="stats-panel">{stats}</div>
      <div className="main-content">{children}</div>
      <div className="charts-panel">{charts}</div>
    </div>
  );
}
```

---

## Route Handlers (API Routes)

### API Route (`app/api/test/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';

// GET /api/test
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello from API' });
}

// POST /api/test
export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}
```

### Dynamic API Route (`app/api/checklist/[id]/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const checklistId = params.id;
  
  // Fetch checklist from Backend
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/checklist/${checklistId}`
  );
  
  const data = await response.json();
  return NextResponse.json(data);
}
```

---

## Metadata

### Static Metadata

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat - ChatTax',
  description: 'Chat with AI about Australian tax',
  keywords: ['tax', 'australia', 'chat', 'AI'],
};

export default function ChatPage() {
  return <div>Chat content</div>;
}
```

### Dynamic Metadata

```typescript
import type { Metadata } from 'next';

export async function generateMetadata({ 
  params 
}: { 
  params: { id: string } 
}): Promise<Metadata> {
  const checklist = await getChecklistById(params.id);
  
  return {
    title: `${checklist.title} - ChatTax`,
    description: checklist.description,
  };
}

export default function ChecklistPage({ params }: { params: { id: string } }) {
  return <div>Checklist {params.id}</div>;
}
```

---

## For GitHub Copilot

**Routing Context**:
ChatTax uses Next.js 15 App Router with file-based routing. Route structure: `app/[route]/page.tsx`. Protected routes require authentication check. Dynamic routes use `[param]` syntax. Layouts shared across routes. Loading and error states auto-handled.

**Key Patterns**:
- Public routes: `/`, `/login`, `/register`
- Protected routes: `/chat`, `/checklist`, `/profile`
- Dynamic routes: `/checklist/[id]` for individual checklists
- Client components: `'use client'` for interactivity
- Navigation: `useRouter()` for programmatic, `<Link>` for declarative

**Route Protection**:
Middleware checks token → Redirect to login if missing. Client-side protection with `useAuthStore` and `useRouter`.

**Critical Files**:
- `app/layout.tsx` - Root layout with Navbar/Footer
- `middleware.ts` - Route protection
- `app/*/page.tsx` - Individual pages

---

**Next**: [Design System](./design-system.md) | [System Overview](./overview.md) | [Components](../04-components/overview.md)
