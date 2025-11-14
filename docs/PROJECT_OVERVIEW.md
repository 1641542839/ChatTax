# 🇦🇺 ChatTax - Australian Personal Tax Return Assistant

## 📋 Project Overview

**ChatTax** is an AI-powered tax preparation assistant specifically designed for **Australian individual taxpayers**. It helps users prepare their personal tax returns through intelligent conversation, document retrieval from ATO resources, and automated checklist generation.

**Target Market**: Australia 🇦🇺  
**Tax Focus**: Individual/Personal Tax Returns ONLY (not business tax)  
**Tax Authority**: Australian Taxation Office (ATO)

---

## 🎯 Core Features

### 1. **RAG-Based Tax Q&A**
- Ask questions about Australian tax laws and regulations
- AI retrieves relevant information from ATO documents
- Provides accurate answers with source citations
- Uses FAISS vector database + cross-encoder reranking for high accuracy

### 2. **Smart Conversation Modes**
Three ways to collect tax information:

#### a) **Free Chat Mode**
- Natural conversation with AI
- AI automatically extracts tax-relevant information
- Progressive information gathering
- Tracks completion percentage

#### b) **Guided Chat Mode**
- Structured question-answer flow
- Step-by-step guidance through tax questions
- Ensures all necessary information is collected
- Progress tracking through defined phases

#### c) **Quick Generate Mode**
- Direct form-based input
- Fastest way to generate checklist
- For users who know their tax situation

### 3. **Intelligent Checklist Generation**
- Generates personalized tax preparation checklists
- Based on user's specific tax situation:
  - Employment status (employed, self-employed, contractor, etc.)
  - Income sources (salary, rental, investments, etc.)
  - Dependents and family situation
  - Deductions and offsets
- Dynamic item count (10-20 tasks) based on complexity
- Australian-specific tasks (myGov setup, payment summaries, ATO lodgement, etc.)

### 4. **Session Management**
- Multi-turn conversations
- Persistent chat history
- One checklist per session
- Can update/regenerate checklists

### 5. **User Authentication**
- Email/password registration and login
- Google OAuth integration
- JWT-based authentication with refresh tokens
- Secure password hashing (bcrypt)

---

## 🏗️ Architecture

### Technology Stack

#### **Backend** (Python/FastAPI)
- **Framework**: FastAPI (async, high-performance)
- **Database**: SQLite (development) / PostgreSQL (production-ready)
- **ORM**: SQLAlchemy
- **AI/LLM**: OpenAI GPT-4o-mini
- **Vector Store**: FAISS (Facebook AI Similarity Search)
- **Embeddings**: OpenAI text-embedding-3-small
- **Reranking**: Cross-encoder/ms-marco-MiniLM-L-12-v2
- **Authentication**: JWT with refresh tokens

#### **Frontend** (Next.js/React)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: Ant Design (antd)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Real-time**: Server-Sent Events (SSE) for chat streaming

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Chat   │  │Checklist │  │  Auth    │  │ Profile  │   │
│  │   Page   │  │   Page   │  │  Pages   │  │   Page   │   │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘   │
│        │             │             │             │          │
│        └─────────────┴─────────────┴─────────────┘          │
│                          │                                   │
│                    Zustand Stores                            │
│              (Auth, Chat, Session, Checklist)                │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/SSE
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (FastAPI)                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    API Routers                         │ │
│  │  /auth  /chat  /checklist  /session  /guided-chat     │ │
│  └────────────┬───────────────────────────────────────────┘ │
│               │                                              │
│  ┌────────────┴───────────────────────────────────────────┐ │
│  │                    Services Layer                      │ │
│  │  • ChatService      • ChecklistService                 │ │
│  │  • SessionService   • IdentityExtractorService        │ │
│  │  • LLMService       • VectorStoreService              │ │
│  │  • RerankerService  • ContextClassifierService        │ │
│  └────────────┬───────────────────────────────────────────┘ │
│               │                                              │
│  ┌────────────┴───────────────────────────────────────────┐ │
│  │                  Data Layer                            │ │
│  │  • SQLAlchemy ORM    • FAISS Vector DB                │ │
│  │  • SQLite Database   • Embedding Cache                │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │   OpenAI API   │
              │  (GPT-4o-mini) │
              └────────────────┘
```

---

## 📁 Project Structure

```
ChatTax/
├── Backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   ├── auth.py            # Authentication endpoints
│   │   │   │   ├── chat.py            # Chat streaming (SSE)
│   │   │   │   ├── checklist.py       # Checklist CRUD
│   │   │   │   ├── session.py         # Session management
│   │   │   │   └── guided_chat.py     # Guided conversation
│   │   │   └── dependencies.py        # Auth dependencies
│   │   ├── core/
│   │   │   ├── config.py              # Settings (env vars)
│   │   │   └── security.py            # JWT, password hashing
│   │   ├── db/
│   │   │   ├── database.py            # SQLAlchemy setup
│   │   │   └── faiss_index/           # FAISS vector store
│   │   ├── models/
│   │   │   ├── user.py                # User ORM model
│   │   │   ├── chat_session.py        # Session ORM model
│   │   │   └── checklist.py           # Checklist ORM model
│   │   ├── schemas/
│   │   │   └── schemas.py             # Pydantic schemas
│   │   └── services/
│   │       ├── llm_service.py                     # OpenAI integration
│   │       ├── vector_store_service.py            # FAISS operations
│   │       ├── reranker_service.py                # Cross-encoder reranking
│   │       ├── chat_service.py                    # Chat orchestration
│   │       ├── checklist_service.py               # Checklist generation
│   │       ├── session_service.py                 # Session CRUD
│   │       ├── identity_extractor_service.py      # Extract tax info from chat
│   │       ├── context_classifier_service.py      # Intent classification
│   │       └── guided_checklist_service.py        # Guided Q&A flow
│   ├── docs/                          # Backend documentation
│   ├── scripts/                       # Database migration scripts
│   ├── main.py                        # FastAPI app entry point
│   ├── requirements.txt               # Python dependencies
│   └── README.md
│
├── Frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Landing page
│   │   │   ├── login/                 # Login page
│   │   │   ├── register/              # Registration page
│   │   │   ├── chat/                  # Free chat page
│   │   │   ├── checklist/             # Checklist view page
│   │   │   │   ├── guided/            # Guided mode page
│   │   │   │   └── generate/          # Quick generate page
│   │   │   └── checklists/            # All checklists list
│   │   ├── components/
│   │   │   ├── auth/                  # Auth forms
│   │   │   ├── chat/                  # Chat components
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── GenerateChecklistButton.tsx
│   │   │   │   └── ChecklistProgressWidget.tsx
│   │   │   ├── checklist/             # Checklist components
│   │   │   │   ├── TaskCard.tsx
│   │   │   │   ├── ChecklistToolbar.tsx
│   │   │   │   └── SmartGenerateButton.tsx
│   │   │   ├── layout/                # Layout components
│   │   │   └── common/                # Shared components
│   │   ├── contexts/
│   │   │   └── SessionContext.tsx     # Session context provider
│   │   ├── hooks/
│   │   │   ├── useSession.ts          # Session management hook
│   │   │   └── useStreamChat.ts       # SSE streaming hook
│   │   ├── services/
│   │   │   ├── api.ts                 # Base API client
│   │   │   ├── checklistService.ts    # Checklist API calls
│   │   │   ├── sessionService.ts      # Session API calls
│   │   │   └── googleAuth.ts          # Google OAuth
│   │   ├── store/
│   │   │   ├── authStore.ts           # Auth state (Zustand)
│   │   │   ├── chatStore.ts           # Chat state
│   │   │   └── checklistStore.ts      # Checklist state
│   │   └── types/
│   │       ├── api.ts                 # API type definitions
│   │       └── session.ts             # Session types
│   ├── docs/                          # Frontend documentation
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── docs/
│   ├── CHECKLIST_GENERATION_SYSTEM.md # Checklist design (English)
│   └── PROJECT_OVERVIEW.md            # This file
│
├── CODING_RULES.md                    # Development standards
├── API_INTEGRATION_STATUS.md          # API connection status
└── DEMO_GUIDE.md                      # Demo walkthrough
```

---

## 🔑 Key Concepts

### 1. **ChecklistIdentityInfo**
Core data structure representing user's tax situation:

```typescript
{
  employment_status: "employed" | "self_employed" | "contractor" | "retired" | "student" | "unemployed",
  income_sources: ["salary", "rental", "investment", "superannuation", "pension"],
  has_dependents: boolean,
  has_investment: boolean,
  has_rental_property: boolean,
  is_first_time_filer: boolean,
  additional_info: {
    residency_status: "resident" | "foreign_resident" | "working_holiday_maker",
    state: "NSW" | "VIC" | "QLD" | ...,
    has_hecs_help: boolean,
    has_private_health: boolean,
    has_work_expenses: boolean,
    ...
  }
}
```

### 2. **Session-Based Conversation**
- Each chat creates a session (UUID)
- Conversation history stored in JSON
- `extracted_identity` progressively updated
- Session links to one checklist (0..1 relationship)

### 3. **Completion Percentage**
Information completeness scoring (0-100%):
- Employment status: 20%
- Income sources: 20%
- Has dependents: 15%
- Has investments: 15%
- Has rental property: 15%
- Is first-time filer: 15%

**Threshold**: ≥60% to enable checklist generation

### 4. **RAG Pipeline**
1. **User Query** → Embed query using OpenAI embeddings
2. **FAISS Search** → Retrieve top-k similar document chunks
3. **Reranking** (optional) → Cross-encoder rescores results
4. **LLM Generation** → GPT-4o-mini generates answer from context
5. **Source Attribution** → Return sources with relevance scores

### 5. **Checklist Categories**
- **Documents**: Payment summaries, bank statements, PAYG summaries
- **Deductions**: Work expenses, donations, investment costs
- **Forms**: myGov setup, ATO online lodgement
- **Deadlines**: 31 October (individuals), quarterly BAS dates
- **Record Keeping**: Receipt organization, documentation

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- OpenAI API key

### Backend Setup

```bash
cd Backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run database migrations (if needed)
python scripts/create_chat_sessions_table.py

# Start server
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local
# Edit .env.local with your Google OAuth credentials (optional)

# Run development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 📚 Key API Endpoints

### Authentication
```
POST /api/auth/register          - Register new user
POST /api/auth/login             - Login (get JWT tokens)
POST /api/auth/refresh           - Refresh access token
GET  /api/auth/me                - Get current user profile
POST /api/auth/google            - Google OAuth login
```

### Chat
```
POST /api/chat/stream            - Stream chat response (SSE)
  Query params:
    - session_id (optional)
    - user_type (always "individual")
    - use_reranking (default: true)
```

### Session
```
POST /api/session/create         - Create new session
GET  /api/session/{session_id}   - Get session details
GET  /api/session/list           - List user's sessions
DELETE /api/session/{session_id} - Delete session
```

### Checklist
```
POST /api/checklist/generate               - Generate checklist (form/session)
GET  /api/checklist/my-checklists          - Get all checklists (authenticated)
GET  /api/checklist/{id}                   - Get single checklist
PATCH /api/checklist/{id}/status           - Update item status
DELETE /api/checklist/{id}                 - Delete checklist (authenticated)
POST /api/checklist/{id}/regenerate        - Regenerate checklist
PUT  /api/checklist/{id}/item              - Update item (deprecated)
```

### Guided Chat
```
GET  /api/guided-chat/start                - Get first question
POST /api/guided-chat/answer               - Submit answer
GET  /api/guided-chat/{session_id}/next    - Get next question
```

---

## 🧪 Testing

### Backend Tests
```bash
cd Backend

# Test chat RAG pipeline
python test_chat_rag.py

# Test checklist generation
python test_checklist.py

# Test API endpoints
python test_api.py
```

### Frontend Tests
```bash
cd Frontend

# Run tests (if configured)
npm test

# Type check
npx tsc --noEmit
```

---

## 🔐 Security Features

1. **JWT Authentication**
   - Access token (15 min expiry)
   - Refresh token (7 days expiry)
   - Secure HTTP-only cookies (production)

2. **Password Security**
   - Bcrypt hashing
   - Minimum 8 characters
   - Password strength validation

3. **OAuth Integration**
   - Google OAuth 2.0
   - Secure token exchange
   - Profile information sync

4. **API Security**
   - CORS configured
   - Rate limiting (production)
   - Input validation (Pydantic schemas)
   - SQL injection protection (SQLAlchemy ORM)

---

## 🌏 Australian Tax Specific Features

### ATO Integration
- Knowledge base sourced from ATO official documents
- Australian terminology (myGov, payment summary, PAYG, etc.)
- Financial year references (2023-24, 2024-25)
- Australian income tax brackets and rates

### Residency Status
- Australian resident for tax purposes
- Foreign resident
- Working holiday maker (WHM)
- Different tax treatments

### Income Types
- PAYG salary/wages
- Business income (sole trader)
- Rental property income
- Investment income (dividends, interest, capital gains)
- Superannuation
- Government payments (Centrelink)

### Deductions
- Work-related expenses (home office, car, tools, etc.)
- Self-education expenses
- Donations to DGRs (Deductible Gift Recipients)
- Investment property deductions
- Tax agent fees

### Offsets & Credits
- Low and Middle Income Tax Offset (LMITO)
- Low Income Tax Offset (LITO)
- Senior Australians Tax Offset (SAPTO)
- Private health insurance rebate

### Deadlines
- 31 October: Individuals lodging own return
- 15 May (next year): Tax agents' deadline
- Quarterly BAS dates for businesses

---

## 🐛 Common Issues & Solutions

### Backend Issues

**Issue**: FAISS index not found  
**Solution**: Ensure `Backend/app/db/faiss_index/` exists and contains:
- `index.faiss`
- `metadata.json`
- `embeddings.pkl`

**Issue**: OpenAI API key error  
**Solution**: Check `.env` file has `OPENAI_API_KEY=your-key-here`

**Issue**: Database errors  
**Solution**: Run migration scripts in `Backend/scripts/`

### Frontend Issues

**Issue**: API connection refused  
**Solution**: Ensure backend is running on `http://localhost:8000`

**Issue**: SSE streaming not working  
**Solution**: Check CORS settings in backend `main.py`

**Issue**: Google OAuth not working  
**Solution**: Configure Google OAuth credentials in Google Cloud Console

---

## 📊 Performance Metrics

### RAG Pipeline
- **FAISS search**: ~50-100ms for 10k documents
- **Reranking**: ~200-300ms for top 10 results
- **LLM response**: ~2-4s streaming (GPT-4o-mini)
- **Total latency**: ~2.5-4.5s for complete answer

### Checklist Generation
- **Identity extraction**: ~1-2s
- **Checklist generation**: ~3-5s
- **Database save**: <100ms

---

## 🔮 Future Enhancements

### Phase 1: Core Improvements
- [ ] Add document upload (PDFs for payment summaries, receipts)
- [ ] OCR integration for receipt processing
- [ ] Multi-year comparison
- [ ] Export checklist to PDF

### Phase 2: Advanced Features
- [ ] Tax calculation estimates
- [ ] Integration with ATO myGov (official API if available)
- [ ] Collaborative checklists (share with tax agent)
- [ ] Mobile app (React Native)

### Phase 3: AI Enhancements
- [ ] Fine-tuned model on Australian tax data
- [ ] Voice input/output
- [ ] Personalized tax tips and reminders
- [ ] Anomaly detection (potential errors in return)

---

## 👥 Contributing

Please follow `CODING_RULES.md` for development standards:
- Code style: PEP 8 (Python), ESLint/Prettier (TypeScript)
- Documentation: Docstrings for all functions/classes
- Testing: Write tests for new features
- Commits: Conventional commits format

---

## 📄 License

[Add your license here]

---

## 📞 Support

For issues or questions:
- Check existing documentation in `docs/`
- Review `API_INTEGRATION_STATUS.md` for API status
- Consult `DEMO_GUIDE.md` for usage examples

---

## ✅ Checklist for Developers

When starting development:
1. ✅ Read this `PROJECT_OVERVIEW.md`
2. ✅ Review `CODING_RULES.md`
3. ✅ Read `CHECKLIST_GENERATION_SYSTEM.md` for checklist logic
4. ✅ Check `API_INTEGRATION_STATUS.md` for endpoint status
5. ✅ Set up development environment (Backend + Frontend)
6. ✅ Test API using `http://localhost:8000/docs`
7. ✅ Familiarize with Australian tax terminology

**Remember**: This system is EXCLUSIVELY for Australian INDIVIDUAL tax returns. NOT for business tax, NOT for other countries.

---

Last Updated: 2024-11-14
Version: 1.0.0
