# System Overview

Comprehensive architecture overview of ChatTax Frontend application.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser                            │
├─────────────────────────────────────────────────────────────┤
│  Next.js App (React 18 + TypeScript)                        │
│  ┌──────────────┬──────────────┬────────────────────────┐  │
│  │ App Router   │ Components   │ Zustand State          │  │
│  │ (Pages)      │ (UI Layer)   │ (Global State)         │  │
│  └──────────────┴──────────────┴────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Service Layer (API Client)                            │  │
│  │ - Authentication   - Chat   - Checklist              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST + SSE
                            │ JWT Authentication
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (FastAPI)                           │
│  - Authentication  - RAG Query  - Chat Streaming            │
│  - Vector DB (FAISS)  - GPT-4o-mini  - PostgreSQL          │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Core Framework
- **Next.js 15.0.2**: React framework with App Router
- **React 18**: UI library with hooks and concurrent features
- **TypeScript 5.x**: Type-safe development

### UI & Styling
- **Ant Design 5.x**: Component library
- **Tailwind CSS 3.x**: Utility-first CSS
- **CSS Modules**: Component-scoped styles

### State Management
- **Zustand 4.x**: Lightweight state management
- **React Hooks**: Local component state

### Data Fetching
- **Fetch API**: HTTP requests
- **EventSource**: Server-Sent Events for streaming

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript Compiler**: Type checking

---

## Project Structure

```
Frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Home page
│   │   ├── login/             # Authentication pages
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── chat/              # Chat interface
│   │   │   └── page.tsx
│   │   ├── checklist/         # Checklist management
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── profile/           # User profile
│   │       └── page.tsx
│   │
│   ├── components/            # React components
│   │   ├── layout/           # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── chat/             # Chat components
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── SourceCitation.tsx
│   │   │   └── ChecklistWidget.tsx
│   │   ├── checklist/        # Checklist components
│   │   │   ├── ChecklistForm.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── IdentityForm.tsx
│   │   └── ui/               # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Loading.tsx
│   │
│   ├── services/             # API service layer
│   │   ├── api.ts           # Base API client
│   │   ├── auth.ts          # Authentication service
│   │   ├── chat.ts          # Chat service
│   │   └── checklist.ts     # Checklist service
│   │
│   ├── store/               # Zustand stores
│   │   ├── authStore.ts    # Authentication state
│   │   ├── chatStore.ts    # Chat state
│   │   └── checklistStore.ts # Checklist state
│   │
│   ├── types/              # TypeScript definitions
│   │   ├── api.ts         # API types (matches Backend)
│   │   ├── auth.ts        # Auth types
│   │   └── components.ts  # Component prop types
│   │
│   ├── lib/               # Utilities
│   │   ├── auth.ts       # Auth helpers
│   │   ├── format.ts     # Formatting utilities
│   │   └── validation.ts # Validation helpers
│   │
│   └── styles/           # Global styles
│       └── globals.css
│
├── public/              # Static assets
│   ├── images/
│   └── fonts/
│
├── docs/               # Documentation
│
├── .env.local         # Environment variables (local)
├── .env.example       # Environment template
├── next.config.js     # Next.js configuration
├── tailwind.config.js # Tailwind configuration
├── tsconfig.json      # TypeScript configuration
└── package.json       # Dependencies
```

---

## Component Hierarchy

```
App Layout (Root)
├── Providers (Auth, Theme)
│   └── Main Layout
│       ├── Navbar
│       │   ├── Logo
│       │   ├── Navigation Links
│       │   └── User Menu
│       ├── Sidebar (optional)
│       │   └── Quick Actions
│       ├── Page Content
│       │   ├── Home Page
│       │   │   ├── Hero Section
│       │   │   ├── Features
│       │   │   └── CTA
│       │   ├── Chat Page
│       │   │   ├── MessageList
│       │   │   │   └── MessageBubble[]
│       │   │   │       ├── User Message
│       │   │   │       └── AI Response
│       │   │   │           ├── Answer Text
│       │   │   │           └── Source Citations
│       │   │   ├── ChatInput
│       │   │   └── ChecklistWidget
│       │   ├── Checklist Page
│       │   │   ├── IdentityForm
│       │   │   ├── ChecklistDisplay
│       │   │   │   └── TaskCard[]
│       │   │   │       ├── Task Info
│       │   │   │       ├── Checkbox
│       │   │   │       └── Actions
│       │   │   └── ProgressBar
│       │   └── Profile Page
│       │       ├── User Info
│       │       ├── Settings
│       │       └── History
│       └── Footer
└── Toast Notifications
```

---

## Data Flow Architecture

### 1. User Authentication Flow

```
User Action (Login)
    ↓
LoginPage Component
    ↓
authService.login()
    ↓
POST /api/auth/login → Backend
    ↓
Response (JWT Token)
    ↓
Store in localStorage
    ↓
Update authStore (Zustand)
    ↓
Redirect to Dashboard
    ↓
Protected Routes Check Token
```

### 2. Chat Query Flow

```
User Types Question
    ↓
ChatInput Component
    ↓
chatStore.addMessage()
    ↓
chatService.query()
    ↓
POST /api/chat/query → Backend
    ↓
Backend RAG Pipeline
    ├── Embed question
    ├── Search FAISS
    ├── Rerank results
    └── Generate answer with GPT-4o-mini
    ↓
Response (answer + sources)
    ↓
chatStore.updateMessage()
    ↓
Component Re-renders
    ↓
Display Answer + Citations
```

### 3. Streaming Chat Flow

```
User Requests Stream
    ↓
EventSource Connection
    ↓
GET /api/chat/stream (SSE) → Backend
    ↓
Stream Events:
├── event: start
├── event: token (multiple)
├── event: source (multiple)
└── event: end
    ↓
chatStore.appendStreamToken()
    ↓
Real-time UI Updates
    ↓
Stream Complete
    ↓
Close EventSource
```

### 4. Checklist Generation Flow

```
User Fills Identity Form
    ↓
ChecklistForm Component
    ↓
checklistService.generate()
    ↓
POST /api/checklist/generate → Backend
    ↓
Backend Processing:
├── Analyze identity info
├── Query tax regulations
├── Generate 5-15 tasks
└── Assign priorities
    ↓
Response (Checklist)
    ↓
checklistStore.setChecklist()
    ↓
ChecklistDisplay Renders
    ↓
User Interacts with Tasks
```

---

## State Management Architecture

### Zustand Stores

**1. Auth Store** (`store/authStore.ts`)
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterRequest) => Promise<void>;
}
```

**2. Chat Store** (`store/chatStore.ts`)
```typescript
interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, content: string) => void;
  clearMessages: () => void;
}
```

**3. Checklist Store** (`store/checklistStore.ts`)
```typescript
interface ChecklistState {
  checklist: Checklist | null;
  tasks: ChecklistItem[];
  toggleTask: (taskId: string) => void;
  generateChecklist: (identity: IdentityInfo) => Promise<void>;
}
```

### State Update Flow

```
Component Event
    ↓
Store Action (Zustand)
    ↓
API Service Call
    ↓
Backend Response
    ↓
Update Store State
    ↓
React Re-renders
    ↓
UI Updates
```

---

## API Integration Architecture

### Service Layer Pattern

```typescript
// Base API client
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new APIError(response.status, await response.json());
  }

  return response.json();
}

// Service layer
export const chatService = {
  query: (request: QueryRequest) =>
    apiClient<QueryResponse>('/api/chat/query', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
  
  stream: (question: string) =>
    new EventSource(`${API_BASE}/api/chat/stream?question=${question}`),
};
```

### Error Handling

```
API Call
    ↓
Error Occurs
    ↓
APIError Class
    ├── status: number
    ├── message: string
    └── details: any
    ↓
Error Boundary / Catch Block
    ↓
Display Error Message
    ↓
Log to Console (development)
    ↓
Optional: Send to Analytics
```

---

## Routing Architecture

### App Router Structure

Next.js 15 uses file-system based routing:

```
app/
├── layout.tsx              → /
├── page.tsx                → / (home)
├── login/
│   └── page.tsx            → /login
├── register/
│   └── page.tsx            → /register
├── chat/
│   └── page.tsx            → /chat
├── checklist/
│   ├── page.tsx            → /checklist
│   └── [id]/
│       └── page.tsx        → /checklist/:id
└── profile/
    └── page.tsx            → /profile
```

### Navigation Flow

```typescript
// Programmatic navigation
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/chat');
router.back();

// Link component
import Link from 'next/link';

<Link href="/chat">Go to Chat</Link>
```

### Protected Routes

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  // Protected routes
  if (pathname.startsWith('/chat') || 
      pathname.startsWith('/checklist')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}
```

---

## Performance Architecture

### Code Splitting

```typescript
// Dynamic imports
const ChatComponent = dynamic(() => import('@/components/chat/ChatBox'), {
  loading: () => <Loading />,
  ssr: false, // Client-side only
});

// Route-based splitting (automatic)
app/
├── chat/page.tsx     → Bundle: chat.js
├── checklist/page.tsx → Bundle: checklist.js
└── profile/page.tsx   → Bundle: profile.js
```

### Caching Strategy

```typescript
// API response caching
const cache = new Map<string, { data: any; timestamp: number }>();

export async function cachedQuery(question: string) {
  const cached = cache.get(question);
  
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.data; // Return cached if < 5 minutes old
  }

  const data = await queryTax({ question });
  cache.set(question, { data, timestamp: Date.now() });
  return data;
}
```

### Optimization Techniques

1. **Image Optimization**: Next.js `<Image>` component
2. **Font Optimization**: Next.js font loading
3. **Bundle Splitting**: Automatic code splitting
4. **Tree Shaking**: Remove unused code
5. **Minification**: Production build minification

---

## Security Architecture

### Authentication

```
Login → JWT Token → localStorage → API Calls
                        ↓
                  Token in Header
                        ↓
              Backend Validates Token
                        ↓
                  Return User Data
```

### Protected API Calls

```typescript
// All API calls include token
const token = localStorage.getItem('access_token');

fetch(`${API_BASE}/api/chat/query`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

### CSRF Protection

- Next.js automatically includes CSRF tokens
- Backend validates origin headers
- Credentials mode for cookies

---

## For GitHub Copilot

**Architecture Summary**:
ChatTax Frontend uses Next.js 15 App Router with TypeScript, React 18, Ant Design, and Zustand. Three-layer architecture: Pages → Components → Services → Backend API. State managed with Zustand stores (auth, chat, checklist). API integration via fetch with JWT auth. SSE for streaming. File-based routing with protected routes.

**Key Patterns**:
- Service Layer: Abstracted API calls in `src/services/`
- State Management: Zustand stores for global state
- Component Composition: Nested component hierarchy
- Type Safety: TypeScript interfaces matching Backend schemas
- Error Handling: APIError class with error boundaries

**Data Flow**:
User Action → Component → Store Action → Service Call → Backend API → Response → Update Store → Re-render

**Critical Files**:
- `src/app/layout.tsx` - Root layout with providers
- `src/services/api.ts` - Base API client
- `src/store/*.ts` - Zustand state stores
- `src/types/api.ts` - Type definitions

---

**Next**: [Routing Guide](./routing.md) | [Design System](./design-system.md) | [Components](../04-components/overview.md)
