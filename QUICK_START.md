# 🚀 Quick Start - When You Lose Context

**Lost track of what this project does? Start here!**

---

## ⚡ 30-Second Overview

**ChatTax** is an AI-powered assistant for **Australian individual tax returns**.

- 🇦🇺 **Australia ONLY** - Not for US, UK, or other countries
- 👤 **Personal tax ONLY** - Not for business tax
- 🤖 **AI-Powered** - Uses GPT-4o-mini + RAG with ATO documents
- ✅ **Generates checklists** - Personalized tax preparation tasks

---

## 📚 Three Documents You MUST Read

### 1. **`docs/PROJECT_OVERVIEW.md`** ⭐⭐⭐
**Read this first!** Complete system guide (20 min)
- What the system does
- How it works
- Architecture
- Tech stack
- Setup instructions

### 2. **`docs/AUSTRALIAN_TAX_REFERENCE.md`** 🇦🇺
**Domain knowledge** (15 min)
- Australian tax basics
- ATO information
- Terminology
- Tax rates and dates
- Testing scenarios

### 3. **`docs/README.md`**
**Documentation index** (5 min)
- Find any documentation quickly
- Organized by role and topic
- Links to everything

---

## 🎯 Key Facts to Remember

### Target Market
- **Country**: Australia 🇦🇺
- **Tax Type**: Personal/Individual tax returns
- **Tax Authority**: ATO (Australian Taxation Office)
- **Users**: Individual Australian taxpayers

### What It Does
1. **Answer tax questions** - RAG-based Q&A using ATO documents
2. **Chat conversations** - Free chat, guided chat, quick form
3. **Generate checklists** - Personalized 10-20 task lists
4. **Track progress** - Session-based conversations

### What It Does NOT Do
- ❌ Business tax returns
- ❌ Other countries (US, UK, etc.)
- ❌ Tax calculations (yet)
- ❌ Direct ATO integration (yet)

---

## 🏗️ Tech Stack

### Backend
- **Python** + **FastAPI**
- **OpenAI GPT-4o-mini** (LLM)
- **FAISS** (vector search)
- **SQLAlchemy** (ORM)
- **SQLite** (database)

### Frontend
- **Next.js 14** (React)
- **TypeScript**
- **Ant Design** (UI)
- **Tailwind CSS**
- **Zustand** (state management)

---

## 🔑 Key Terminology

| Australian Term | What It Means |
|----------------|---------------|
| **ATO** | Australian Taxation Office (like IRS in US) |
| **myGov** | Online portal to access government services |
| **Payment Summary** | Document showing income and tax withheld (like W-2) |
| **PAYG** | Pay As You Go - tax withheld from salary |
| **TFN** | Tax File Number (like SSN) |
| **Financial Year** | 1 July to 30 June (not calendar year!) |
| **Superannuation** | Retirement savings (like 401k) |
| **HECS/HELP** | Student loan system |
| **Lodgement** | Filing/submitting tax return |

---

## 📁 Important Files

### Configuration
```
Backend/.env              # OpenAI API key, secrets
Frontend/.env.local       # Google OAuth (optional)
```

### Core Logic
```
Backend/app/services/
├── llm_service.py                    # OpenAI integration
├── checklist_service.py              # Checklist generation
├── guided_checklist_service.py       # Guided questions
├── identity_extractor_service.py     # Extract tax info from chat
└── vector_store_service.py           # FAISS search
```

### Documentation
```
docs/
├── PROJECT_OVERVIEW.md               # ⭐ START HERE
├── AUSTRALIAN_TAX_REFERENCE.md       # 🇦🇺 Tax knowledge
├── CHECKLIST_GENERATION_SYSTEM.md    # Checklist design
└── README.md                         # Documentation index
```

---

## 🧪 Quick Test

### Backend Test
```bash
cd Backend
python test_chat_rag.py
```

Expected: AI answers Australian tax question with ATO sources

### Frontend Test
```bash
# Backend running on http://localhost:8000
# Frontend running on http://localhost:3000

# Go to http://localhost:3000
# Click "Free Chat"
# Ask: "What can I claim for home office expenses?"
```

Expected: AI responds with Australian home office deduction info

---

## 🐛 Common Issues

### "FAISS index not found"
**Solution**: Ensure `Backend/app/db/faiss_index/` exists with:
- `index.faiss`
- `metadata.json`
- `embeddings.pkl`

### "OpenAI API key error"
**Solution**: Check `Backend/.env` has `OPENAI_API_KEY=sk-proj-...`

### "API connection refused"
**Solution**: Start backend: `uvicorn main:app --reload --port 8000`

---

## 🎓 Learning Path

### Day 1: Understanding
1. Read `docs/PROJECT_OVERVIEW.md` (20 min)
2. Read `docs/AUSTRALIAN_TAX_REFERENCE.md` (15 min)
3. Browse `docs/README.md` (5 min)

### Day 2: Setup & Explore
1. Set up backend (follow PROJECT_OVERVIEW.md)
2. Set up frontend
3. Test the application
4. Explore API docs at `http://localhost:8000/docs`

### Day 3: Code Deep Dive
1. Read `docs/CHECKLIST_GENERATION_SYSTEM.md`
2. Explore service files in `Backend/app/services/`
3. Read `Backend/docs/API_DOCUMENTATION.md`
4. Check components in `Frontend/src/components/`

---

## 📞 Need More Info?

### By Topic
- **Architecture**: `docs/PROJECT_OVERVIEW.md` Section "Architecture"
- **API Endpoints**: `Backend/docs/API_DOCUMENTATION.md`
- **Database Schema**: `docs/CHECKLIST_GENERATION_SYSTEM.md` Section "Database Design"
- **Australian Tax**: `docs/AUSTRALIAN_TAX_REFERENCE.md`
- **Troubleshooting**: `Backend/docs/06-troubleshooting/` and `Frontend/docs/06-troubleshooting/`

### By Role
- **Backend Dev**: Start with `docs/PROJECT_OVERVIEW.md`, then `Backend/docs/`
- **Frontend Dev**: Start with `docs/PROJECT_OVERVIEW.md`, then `Frontend/docs/`
- **QA/Tester**: Read `docs/AUSTRALIAN_TAX_REFERENCE.md` for test scenarios
- **Product Manager**: Read `docs/PROJECT_OVERVIEW.md` for features

---

## ✅ Checklist for New Developers

Getting started? Complete these steps:

- [ ] Read `docs/PROJECT_OVERVIEW.md`
- [ ] Read `docs/AUSTRALIAN_TAX_REFERENCE.md`
- [ ] Set up backend development environment
- [ ] Set up frontend development environment
- [ ] Test API at `http://localhost:8000/docs`
- [ ] Run the frontend at `http://localhost:3000`
- [ ] Test chat functionality
- [ ] Generate a test checklist
- [ ] Read `CODING_RULES.md`
- [ ] Review `docs/CHECKLIST_GENERATION_SYSTEM.md`

---

## 🎉 You're Ready!

After reading this quick start and the three key documents, you should understand:

✅ What ChatTax does (Australian personal tax assistant)  
✅ How it works (RAG + LLM + Checklist generation)  
✅ Australian tax basics (ATO, myGov, financial year, etc.)  
✅ Where to find detailed information (docs folder)  
✅ How to set up and test the system  

**Next step**: Dive into `docs/PROJECT_OVERVIEW.md` for comprehensive details!

---

## 🔖 Bookmark These URLs

**When running locally:**
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

**External Resources:**
- ATO Website: https://www.ato.gov.au/
- myGov: https://my.gov.au/
- OpenAI: https://platform.openai.com/

---

Last Updated: 2024-11-14  
Version: 1.0.0

**Remember**: When in doubt, read `docs/PROJECT_OVERVIEW.md` - it has everything! 🚀
