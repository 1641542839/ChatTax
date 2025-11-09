# ChatTax Frontend

> AI-powered Australian tax assistance application built with Next.js 15, React 18, and TypeScript.

## Overview

ChatTax Frontend is a modern web application that provides personalized Australian tax guidance through AI-powered chat, RAG (Retrieval-Augmented Generation) queries, and dynamic checklist generation. Built with Next.js 15 App Router, the application integrates seamlessly with the ChatTax Backend API for real-time tax assistance.

### Key Features

- **🤖 AI Chat Interface**: Real-time streaming responses from GPT-4o-mini
- **📚 RAG Tax Queries**: Answers with citations from 3,246+ Australian tax documents
- **✅ Dynamic Checklists**: Personalized tax preparation tasks (5-15 items) based on user identity
- **🔐 Secure Authentication**: JWT-based auth with token management
- **📱 Responsive Design**: Mobile-first UI with Ant Design components
- **⚡ High Performance**: Optimized builds with Next.js 15 and TypeScript strict mode

---

## Technology Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 15.0.2 (App Router) |
| **UI Library** | React 18 with hooks |
| **Language** | TypeScript 5.x (strict mode) |
| **Components** | Ant Design 5.x |
| **Styling** | Tailwind CSS 3.x + CSS Modules |
| **State** | Zustand 4.x |
| **API Client** | Fetch API + EventSource (SSE) |
| **Dev Tools** | ESLint, Prettier, TypeScript |

---

## Quick Start

### Prerequisites

- **Node.js**: 18.17.0+ (18.x or 20.x recommended)
- **Backend API**: Running on `http://localhost:8000`
- **Git**: For version control

### 5-Minute Setup

```bash
# 1. Clone repository
git clone https://github.com/1641542839/ChatTax.git
cd ChatTax/Frontend

# 2. Install dependencies
npm install

# 3. Configure environment
Copy-Item .env.example .env.local
# Edit .env.local and set:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# 4. Start development server
npm run dev

# ✅ Open http://localhost:3000
```

**First time?** See detailed instructions: [Installation Guide](./docs/01-getting-started/installation.md)

---

## Project Structure

```
Frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   ├── login/        # Authentication pages
│   │   ├── chat/         # Chat interface
│   │   ├── checklist/    # Checklist management
│   │   └── profile/      # User profile
│   ├── components/       # React components
│   │   ├── layout/       # Navbar, Footer, Sidebar
│   │   ├── chat/         # Chat UI components
│   │   ├── checklist/    # Checklist components
│   │   └── ui/           # Reusable UI components
│   ├── services/         # API service layer
│   │   ├── api.ts        # Base API client
│   │   ├── auth.ts       # Authentication service
│   │   ├── chat.ts       # Chat service
│   │   └── checklist.ts  # Checklist service
│   ├── store/            # Zustand state stores
│   │   ├── authStore.ts  # Authentication state
│   │   ├── chatStore.ts  # Chat state
│   │   └── checklistStore.ts # Checklist state
│   ├── types/            # TypeScript type definitions
│   │   └── api.ts        # API types (matches Backend)
│   └── lib/              # Utility functions
├── public/               # Static assets
├── docs/                 # Documentation
├── .env.local           # Environment config (create this)
├── .env.example         # Environment template
├── next.config.js       # Next.js configuration
├── tailwind.config.js   # Tailwind CSS config
├── tsconfig.json        # TypeScript config
└── package.json         # Dependencies
```

---

## Documentation

Comprehensive documentation for developers and AI assistants (like GitHub Copilot).

### � Getting Started
- **[Installation Guide](./docs/01-getting-started/installation.md)** - Complete setup instructions
- **[Quick Start](./docs/01-getting-started/quickstart.md)** - 5-minute setup guide
- **[Configuration](./docs/01-getting-started/configuration.md)** - Environment variables and settings

### 🏗️ Architecture
- **[System Overview](./docs/02-architecture/overview.md)** - High-level architecture and design patterns
- **[Routing & Pages](./docs/02-architecture/routing.md)** - Next.js App Router and page structure

### 🔌 API Integration
- **[Integration Guide](./docs/03-api/integration.md)** - Complete Backend API integration
- **[Type Definitions](./docs/03-api/types.md)** - TypeScript types matching Backend schemas

### 🎨 Components
- Component documentation (see `docs/04-components/`)

### 🗂️ State Management
- State management with Zustand (see `docs/05-state-management/`)

### 🔧 Troubleshooting
- Common issues and solutions (see `docs/06-troubleshooting/`)

**💡 For AI Assistants**: All documentation includes GitHub Copilot context sections for enhanced AI understanding.

---

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run type-check       # TypeScript type checking

# Production
npm run build            # Create optimized build
npm run start            # Run production server

# Code Quality
npm run lint             # Check code with ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format with Prettier
```

### Development Workflow

1. **Start Backend**: Ensure Backend is running on `http://localhost:8000`
   ```bash
   cd ../Backend
   uvicorn main:app --reload
   ```

2. **Start Frontend**: Run development server
   ```bash
   npm run dev
   ```

3. **Make Changes**: Edit files in `src/` - hot reload happens automatically

4. **Test**: Open `http://localhost:3000` and test functionality

5. **Build**: Create production build before deploying
   ```bash
   npm run build
   ```

---

## Backend Integration

### API Endpoints

Frontend integrates with these Backend endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login (get JWT) |
| `/api/auth/me` | GET | Get current user |
| `/api/chat/query` | POST | RAG tax query with citations |
| `/api/chat/stream` | GET | SSE streaming chat |
| `/api/checklist/generate` | POST | Generate personalized checklist |
| `/api/checklist/{id}` | GET | Get specific checklist |
| `/api/checklist/user/{user_id}` | GET | Get user's checklists |

**API Documentation**: See [Backend API Reference](../Backend/docs/03-api/endpoints.md)

### Environment Configuration

Create `.env.local` in project root:

```env
# Required: Backend API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Optional: Development settings
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_DEBUG=true
```

**Important**: 
- Use `NEXT_PUBLIC_` prefix for browser-accessible variables
- Never commit `.env.local` to git
- Backend must allow CORS from `http://localhost:3000`

---

## Key Features Explained

### 1. Authentication Flow

```
User Login → POST /api/auth/login → Receive JWT Token → 
Store in localStorage → Include in all API calls → Protected Routes
```

### 2. RAG Tax Query

```
User Question → POST /api/chat/query → Backend RAG Pipeline:
  ├── Embed question (384-dim)
  ├── Search FAISS (3,246 docs)
  ├── Rerank top results
  └── Generate answer with GPT-4o-mini
→ Response with answer + sources + relevance scores
```

### 3. Chat Streaming

```
User Message → GET /api/chat/stream (SSE) → Stream Events:
  ├── start: Stream begins
  ├── token: Content chunks (real-time)
  ├── source: Document citations
  └── end: Stream complete
→ Real-time UI updates with EventSource
```

### 4. Dynamic Checklist Generation

```
User Identity Info → POST /api/checklist/generate → Backend:
  ├── Analyze employment status
  ├── Query tax regulations
  ├── Generate 5-15 personalized tasks
  └── Assign priorities
→ Checklist with completion tracking
```

---

## Type Safety

All API interactions are fully typed with TypeScript:

```typescript
import type { QueryRequest, QueryResponse } from '@/types/api';

// Type-safe API call
const request: QueryRequest = {
  question: 'What are tax deductions for individuals?',
  top_k: 5,
};

const response: QueryResponse = await queryTax(request);
// TypeScript knows: response.answer, response.sources, response.confidence
```

**Types match Backend exactly** - see [Type Definitions](./docs/03-api/types.md)

---

## Troubleshooting

### Common Issues

**Backend Connection Failed**
```bash
# Error: Failed to fetch
# Fix: Ensure Backend is running
cd ../Backend
uvicorn main:app --reload
```

**Port 3000 In Use**
```bash
# Fix: Use different port
PORT=3001 npm run dev
```

**CORS Errors**
```bash
# Fix: Check Backend CORS settings in Backend/main.py
# Must allow: http://localhost:3000
```

**Type Errors**
```bash
# Fix: Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

**More solutions**: See [Troubleshooting Guide](./docs/06-troubleshooting/common-issues.md)

---

## Contributing

1. **Follow TypeScript strict mode**: No `any` types
2. **Use path aliases**: Import with `@/` prefix
3. **Type all API calls**: Use types from `@/types/api`
4. **Update documentation**: Keep docs in sync with code
5. **Test before commit**: Run `npm run lint` and `npm run type-check`

---

## License

[Add license information]

---

## Related Documentation

- **Backend Documentation**: [../Backend/README.md](../Backend/README.md)
- **Backend API Reference**: [../Backend/docs/03-api/endpoints.md](../Backend/docs/03-api/endpoints.md)
- **Backend Architecture**: [../Backend/docs/02-architecture/overview.md](../Backend/docs/02-architecture/overview.md)

---

## For GitHub Copilot

**Project Context**: ChatTax Frontend is a Next.js 15 TypeScript application for Australian tax assistance. It integrates with a FastAPI Backend via REST API and SSE streaming. Key technologies: React 18, Ant Design 5, Zustand 4, Tailwind CSS 3.

**Architecture**: Three-layer design: Pages (App Router) → Components → Services → Backend API. State managed with Zustand stores (auth, chat, checklist). All API types match Backend Pydantic schemas.

**Critical Files**:
- `src/app/layout.tsx` - Root layout
- `src/services/api.ts` - API client
- `src/types/api.ts` - Type definitions
- `src/store/*.ts` - State management
- `.env.local` - Environment config

**API Integration**: Fetch-based client with JWT auth. SSE streaming for chat. All responses typed. CORS must be configured in Backend.

**Getting Started**: Install deps → Create `.env.local` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` → `npm run dev` → Open localhost:3000

---

**Questions?** Check the [documentation](./docs/) or [Backend docs](../Backend/docs/)

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
ChatTax/
├── src/
│   ├── app/                # Next.js app directory
│   │   ├── layout.tsx      # Root layout with navbar
│   │   ├── page.tsx        # Home page
│   │   ├── chat/           # Chat page
│   │   ├── checklist/      # Checklist page
│   │   └── calculator/     # Calculator page
│   ├── components/         # Reusable components
│   │   └── layout/         # Layout components
│   └── lib/                # Utility functions
├── public/                 # Static assets
├── CODING_RULES.md         # Development guidelines
└── Configuration files
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## 🎨 Code Quality

This project follows strict coding standards:

- SOLID principles
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- Clean code practices

See [CODING_RULES.md](./CODING_RULES.md) for detailed guidelines.

## 🔧 Configuration

### ESLint

Configured with:

- Next.js recommended rules
- TypeScript support
- Prettier integration

### Prettier

Configured with:

- 2-space indentation
- Single quotes
- No semicolons
- TailwindCSS class sorting

### Husky

Pre-commit hooks run:

- ESLint with auto-fix
- Prettier formatting
- TypeScript type checking

## 📄 Routes

- `/` - Home page with feature overview
- `/chat` - AI chat assistant interface
- `/checklist` - Tax preparation checklist
- `/calculator` - Tax calculation tool

## 🤝 Contributing

1. Follow the coding rules in [CODING_RULES.md](./CODING_RULES.md)
2. Run `npm run lint` and `npm run type-check` before committing
3. Write meaningful commit messages
4. Create pull requests for review

## 📝 License

MIT

## 👥 Authors

ChatTax Development Team

---

Made with ❤️ using Next.js 15 and TypeScript
Australian Smart Tax Assistant
