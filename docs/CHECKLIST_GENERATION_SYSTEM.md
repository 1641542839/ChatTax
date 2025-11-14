# 📋 Checklist Generation System Design

## 📐 System Architecture Overview

## Overview
Always follow `CODING_RULES.md`

### Core Design Principles

1. **One Session → Maximum One Checklist**
   - Each session generates one checklist
   - Can update existing checklist
   - Supports regeneration (overwrite)

2. **Multi-Mode Unity for Australian Personal Tax**
   - Free Chat Mode: Extract information from conversation history
   - Guided Chat Mode: Extract from structured Q&A
   - Quick Generate Mode: User directly fills form
   - **All modes focus exclusively on AUSTRALIAN INDIVIDUAL tax returns**

3. **Progressive Information Collection**
   - Users can supplement information through multiple rounds of conversation
   - System automatically extracts and updates `extracted_identity`
   - Prompts to generate checklist when threshold is reached

---

## 🗄️ Database Design

### Existing Table Structure (Implemented)

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
);

-- Chat sessions table
CREATE TABLE chat_sessions (
    id INTEGER PRIMARY KEY,
    session_id VARCHAR UNIQUE NOT NULL,  -- UUID
    user_id INTEGER REFERENCES users(id),
    title VARCHAR,
    conversation_history JSON,  -- [{"role": "user|assistant", "content": "..."}]
    extracted_identity JSON,    -- ChecklistIdentityInfo as dict
    checklist_id INTEGER REFERENCES checklists(id),
    checklist_generated BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Checklists table
CREATE TABLE checklists (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    identity_info JSON,         -- ChecklistIdentityInfo
    checklist_json JSON,        -- [ChecklistItem]
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Relationship Explanation

```
User (1) ─────< (N) ChatSession
                        │
                        │ (1:1 optional)
                        ▼
                    Checklist
```

- **User → ChatSessions**: One-to-many (one user can have multiple sessions)
- **ChatSession → Checklist**: One-to-zero-or-one (one session has at most one checklist)

---

## 🔄 Business Process Flow

### Flow 1: Free Chat Mode → Generate Checklist

```
┌─────────────────────────────────────────────────────────────┐
│  1. User sends message                                       │
│     "I'm employed and have 2 kids in Australia"             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Backend processing                                        │
│     • Save message to conversation_history                   │
│     • LLM analyzes entire conversation history               │
│     • Extract/update extracted_identity                      │
│     • Calculate completion_percentage                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Frontend displays progress                               │
│     • Show information completion: 60%                       │
│     • Extracted info tags: 📊 Employed, 👶 2 Kids           │
│     • Display "Generate Checklist" button (active ≥60%)     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  4. User clicks "Generate Checklist"                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Backend generates Checklist                              │
│     POST /api/checklist/generate-from-session                │
│     {                                                         │
│       "session_id": "uuid",                                   │
│       "user_id": 1                                            │
│     }                                                         │
│                                                               │
│     • Get session.extracted_identity                         │
│     • Call LLM to generate personalized checklist            │
│     • Create Checklist record                                │
│     • Update session.checklist_id + checklist_generated=true │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Frontend displays Checklist                              │
│     • Navigate to /checklist page                            │
│     • Display generated task list                            │
│     • Support status toggle, add notes, etc.                 │
└─────────────────────────────────────────────────────────────┘
```

### Flow 2: Update Existing Checklist

```
┌─────────────────────────────────────────────────────────────┐
│  User continues conversation, adds new information           │
│  "Actually, I also have rental income"                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend detects significant information change              │
│  • Update extracted_identity                                 │
│  • Check checklist_generated == true                         │
│  • Prompt user: "New info detected, update checklist?"      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  User chooses:                                               │
│  A. Update checklist → Add new items                         │
│  B. Regenerate checklist → Complete regeneration            │
│  C. Ignore → Keep existing checklist                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Backend Implementation

### 1. New API Endpoints

#### `POST /api/checklist/generate-from-session`

Generate checklist from session:

```python
# Backend/app/api/routers/checklist.py

@router.post("/generate-from-session")
async def generate_checklist_from_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    service: ChecklistService = Depends(get_checklist_service)
) -> ChecklistResponse:
    """
    Generate personalized Australian individual tax return checklist from session history.
    
    Business logic:
    1. Verify session ownership
    2. Check if checklist already exists (option to overwrite or append)
    3. Generate checklist from session.extracted_identity
    4. Update session.checklist_id and checklist_generated
    """
    # Get session
    session = SessionService.get_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(404, "Session not found")
    
    # Check if checklist already exists
    if session.checklist_generated:
        raise HTTPException(
            400, 
            "Checklist already exists. Use update endpoint to modify."
        )
    
    # Generate from extracted_identity
    if not session.extracted_identity:
        raise HTTPException(
            400,
            "Not enough information. Continue chatting to provide more details."
        )
    
    # Generate checklist
    identity_info = ChecklistIdentityInfo(**session.extracted_identity)
    checklist = await service.generate_and_save_checklist(
        user_id=current_user.id,
        identity_info=identity_info
    )
    
    # Link to session
    session.checklist_id = checklist.id
    session.checklist_generated = True
    db.commit()
    
    return checklist
```

---

## 🎨 Frontend Implementation

### 1. Session Context Enhancement

Update `useSession.ts` to return checklist-related state:

```typescript
// Frontend/src/hooks/useSession.ts

export interface UseSessionReturn {
  // ... existing fields ...
  
  // Checklist related
  canGenerateChecklist: boolean;         // completion_percentage >= 60%
  hasChecklist: boolean;                 // checklist_generated
  checklistId: number | null;            // checklist_id
  
  // New methods
  generateChecklist: () => Promise<ChecklistResponse | null>;
  regenerateChecklist: () => Promise<ChecklistResponse | null>;
}
```

---

## 🎯 User Experience Flow

### Scenario 1: Starting from Scratch

1. **User**: Opens app, clicks "Free Chat"
2. **System**: Creates new session
3. **User**: "I'm employed in Australia with 2 kids"
4. **System**: 
   - AI responds
   - Extracts info → `extracted_identity`
   - Shows progress bar: "Information: 40% complete"
5. **User**: "I also have rental income from an investment property"
6. **System**:
   - Updates `extracted_identity`
   - Progress bar updates: "Information: 65% complete"
   - ✨ "Generate Checklist" button activates
7. **User**: Clicks "Generate Checklist"
8. **System**:
   - Calls LLM to generate personalized checklist
   - Navigates to checklist page
   - Displays 12-15 Australian tax return tasks

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Sends Message
       ▼
┌─────────────────┐
│  Chat Session   │◄─────────┐
│  - conversation │          │
│  - extracted_   │          │
│    identity     │          │
└────────┬────────┘          │
         │                   │
         │ Generate          │ Update
         ▼                   │
┌─────────────────┐          │
│   Checklist     │──────────┘
│   - items       │
│   - status      │
└─────────────────┘
```

---

## 🔧 Configuration and Tuning

### LLM Prompt Configuration

```python
# Backend/app/core/prompts.py

IDENTITY_EXTRACTION_PROMPT = """
Analyze the conversation and extract Australian personal tax-related information for INDIVIDUAL taxpayers only.

Required fields:
- employment_status: employed | self-employed | contractor | retired | student | unemployed
- income_sources: array of [salary, investment, rental, superannuation, pension, other]
- has_dependents: boolean
- has_investment: boolean
- has_rental_property: boolean
- is_first_time_filer: boolean

Additional context:
- residency_status (Australian resident, foreign resident, WHM)
- state/territory
- special circumstances (HECS/HELP debt, private health insurance, etc.)

Focus on AUSTRALIAN INDIVIDUAL tax returns only - NOT business tax.
Confidence threshold: 60% to suggest checklist generation.
"""

CHECKLIST_GENERATION_PROMPT = """
Generate a personalized Australian INDIVIDUAL tax return checklist based on:

Identity: {identity_info}

Create 10-20 actionable tasks categorized as:
- Documents (gather required forms - payment summaries, bank statements, etc.)
- Deductions (work-related expenses, donations, etc.)
- Forms (myGov setup, lodge via ATO online, etc.)
- Deadlines (lodgement dates - 31 October for individuals)
- Record Keeping (receipts, documentation)

Each task should have:
- Title (brief, actionable)
- Description (specific Australian tax instructions)
- Priority (high/medium/low)
- Estimated time
- Australian tax context (ATO requirements, myGov, etc.)

Focus ONLY on INDIVIDUAL PERSONAL tax returns, not business tax.
"""
```

---

## 🚀 Implementation Steps

### Phase 1: Backend Foundation (Completed)

1. ✅ Create `IdentityExtractionService`
2. ✅ Add `/api/checklist/generate-from-session` endpoint
3. ✅ Modify chat streaming endpoint to add identity extraction logic
4. ✅ Write unit tests

### Phase 2: Frontend Integration (Completed)

1. ✅ Update `useSession` hook
2. ✅ Create `SmartGenerateButton` component
3. ✅ Update checklist page
4. ✅ Add progress display component

### Phase 3: Optimization & Testing (Completed)

1. ✅ E2E test complete flow
2. ✅ Optimize LLM prompts for Australian context
3. ✅ Performance optimization
4. ✅ Error handling improvements

---

## ❓ FAQ

### Q1: Can a user have multiple checklists?

**A**: Yes, through multiple **sessions**, each session can generate one checklist.

- Scenario 1: 2024 tax return → Session A → Checklist A
- Scenario 2: 2025 tax return → Session B → Checklist B

### Q2: How to handle checklist updates?

**A**: Three strategies:

1. **Append mode**: Keep existing items, add new items
2. **Regenerate**: Complete regeneration (recommended)
3. **Smart merge**: Keep completed items, update others

### Q3: Are checklists different between modes?

**A**: Core logic is the same, only information source differs:

| Mode | Information Source | Features |
|------|-------------------|----------|
| Free Chat | LLM extracts from conversation | Flexible, requires multiple rounds |
| Guided Chat | Structured Q&A | Precise, guided |
| Quick Generate | User form | Fast, direct |

All modes generate the same `ChecklistIdentityInfo` format → unified checklist generation logic focused on AUSTRALIAN INDIVIDUAL tax returns.

---

## 📈 Future Extensions

### 1. AI-Assisted Updates

When users provide new information, AI automatically suggests tasks to add:

```
User: "I started freelancing this year"
AI: "💡 I'll add 3 tasks for self-employment:
     1. Gather invoices for freelance income
     2. Track business expenses
     3. Consider ABN registration requirements"
```

### 2. Progress Tracking

- Display checklist completion percentage
- Estimate completion time
- Send reminder notifications

### 3. Collaboration Features

- Share checklist with tax agent
- Multi-user collaborative completion

### 4. Historical Comparison

- Compare checklists from different years
- Auto-reuse data from previous year
- Track year-over-year changes

---

## ✅ Summary

This design has the following advantages:

1. **Unified Architecture**: All modes share the same checklist generation logic
2. **Progressive**: Users can gradually provide information
3. **Flexible Updates**: Supports append and regenerate
4. **User-Friendly**: Clear progress display and operation prompts
5. **Extensible**: Easy to add new modes and features
6. **Australian-Focused**: Specifically designed for Australian individual tax returns (ATO requirements, myGov, payment summaries, etc.)

The system is now ready for Australian personal tax return processing!
