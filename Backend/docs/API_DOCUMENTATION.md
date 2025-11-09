# ChatTax Backend API Documentation

## Overview

ChatTax Backend provides RESTful APIs for tax checklist generation, multi-turn conversation management, and intelligent information extraction. Built with FastAPI, it supports streaming responses and context-aware interactions.

**Base URL**: `http://localhost:8000`

**Authentication**: JWT Bearer Token (required for all endpoints except login/register)

```http
Authorization: Bearer <access_token>
```

---

## Table of Contents

1. [Authentication](#authentication)
2. [Session Management](#session-management)
3. [Chat & Streaming](#chat--streaming)
4. [Checklist Generation](#checklist-generation)
5. [Guided Chat](#guided-chat)
6. [Error Handling](#error-handling)

---

## Authentication

### Register User

Create a new user account.

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe",
  "full_name": "John Doe"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Login

Authenticate existing user.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Google OAuth Login

**Endpoint**: `POST /api/auth/google`

**Request Body**:
```json
{
  "google_token": "google_oauth_token_here"
}
```

---

## Session Management

Sessions store multi-turn conversation history and extracted tax identity information.

### Create Session

Create a new chat session.

**Endpoint**: `POST /api/sessions`

**Request Body** (optional):
```json
{
  "initial_message": "I need help with my taxes"
}
```

**Response** (200 OK):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "user-uuid",
  "conversation_history": [],
  "extracted_identity": null,
  "checklist_id": null,
  "created_at": "2025-11-09T10:30:00",
  "updated_at": "2025-11-09T10:30:00"
}
```

### List Sessions

Get all user sessions.

**Endpoint**: `GET /api/sessions?limit=20&offset=0`

**Query Parameters**:
- `limit` (optional): Maximum results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response** (200 OK):
```json
[
  {
    "id": "session-uuid",
    "session_id": "session-uuid",
    "user_id": "user-uuid",
    "checklist_id": "checklist-uuid",
    "created_at": "2025-11-09T10:30:00",
    "updated_at": "2025-11-09T10:35:00",
    "message_count": 5,
    "last_message": "What documents do I need?"
  }
]
```

### Get Session Details

Get full session with conversation history.

**Endpoint**: `GET /api/sessions/{session_id}`

**Response** (200 OK):
```json
{
  "id": "session-uuid",
  "session_id": "session-uuid",
  "user_id": "user-uuid",
  "conversation_history": [
    {
      "role": "user",
      "content": "I'm married filing jointly",
      "timestamp": "2025-11-09T10:30:00"
    },
    {
      "role": "assistant",
      "content": "Great! Do you have any dependents?",
      "timestamp": "2025-11-09T10:30:05"
    }
  ],
  "extracted_identity": {
    "filing_status": "married_joint",
    "has_dependents": null,
    "completion_percentage": 20,
    "missing_fields": ["income_range", "state", "has_dependents"]
  },
  "checklist_id": null,
  "created_at": "2025-11-09T10:30:00",
  "updated_at": "2025-11-09T10:35:00"
}
```

### Add Message to Session

Add a message and trigger identity extraction.

**Endpoint**: `POST /api/sessions/{session_id}/messages`

**Request Body**:
```json
{
  "content": "I have 2 kids under 17",
  "role": "user"
}
```

**Response** (200 OK):
```json
{
  "session": {
    "id": "session-uuid",
    "conversation_history": [...],
    "extracted_identity": {
      "filing_status": "married_joint",
      "has_dependents": true,
      "num_dependents": 2,
      "completion_percentage": 40,
      "missing_fields": ["income_range", "state"]
    }
  },
  "extracted_identity": {...},
  "completion_percentage": 40,
  "missing_fields": ["income_range", "state"]
}
```

### Delete Session

**Endpoint**: `DELETE /api/sessions/{session_id}`

**Response** (204 No Content)

---

## Chat & Streaming

### Stream Chat Response

Send message and receive streaming response with SSE (Server-Sent Events).

**Endpoint**: `POST /api/chat/stream`

**Request Body**:
```json
{
  "message": "What is a W-2 form?",
  "session_id": "session-uuid"
}
```

**Response** (200 OK - SSE Stream):

```
data: {"type": "chunk", "content": "A W-2 form"}

data: {"type": "chunk", "content": " is a tax document"}

data: {"type": "metadata", "intent": {"intent": "EXPLAIN_ITEM", "confidence": 0.95, "should_regenerate": false}}

data: {"type": "chunk", "content": " that shows..."}

data: {"type": "done"}
```

**SSE Event Types**:

1. **chunk**: Streaming text content
```json
{"type": "chunk", "content": "partial text"}
```

2. **metadata**: Intent classification and flags
```json
{
  "type": "metadata",
  "intent": {
    "intent": "NEW_INFO",
    "confidence": 0.85,
    "should_regenerate": true
  }
}
```

3. **done**: Stream complete
```json
{"type": "done"}
```

4. **error**: Error occurred
```json
{"type": "error", "error": "Error message"}
```

**Intent Types**:
- `EXPLAIN_ITEM`: User asking for explanation
- `NEW_INFO`: User providing new tax information
- `UPDATE_REQUEST`: User requesting checklist update
- `GENERAL`: General conversation

---

## Checklist Generation

### Generate Checklist

Generate tax checklist using one of three modes.

**Endpoint**: `POST /api/checklist/generate`

**Request Body - Mode 1 (FORM)**:
```json
{
  "generation_mode": "form",
  "identity": {
    "filing_status": "married_joint",
    "income_range": "$75,000 - $100,000",
    "has_dependents": true,
    "num_dependents": 2,
    "state": "California",
    "has_self_employment": false,
    "has_investments": true,
    "has_rental_property": false,
    "has_education_expenses": true,
    "has_medical_expenses": false,
    "has_charitable_donations": true,
    "has_retirement_contributions": true,
    "additional_context": "First time homebuyer"
  }
}
```

**Request Body - Mode 2 (GUIDED_CHAT)**:
```json
{
  "generation_mode": "guided_chat",
  "session_id": "session-uuid"
}
```

**Request Body - Mode 3 (FREE_CHAT)**:
```json
{
  "generation_mode": "free_chat",
  "session_id": "session-uuid"
}
```

**Response** (200 OK):
```json
{
  "id": "checklist-uuid",
  "user_id": "user-uuid",
  "title": "2024 Tax Checklist - Married Filing Jointly",
  "categories": [
    {
      "name": "Personal Information",
      "items": [
        {
          "name": "Social Security Numbers",
          "description": "SSN for you, spouse, and dependents",
          "is_completed": false,
          "priority": "high"
        }
      ]
    }
  ],
  "identity_info": {...},
  "generation_mode": "free_chat",
  "chat_session_id": "session-uuid",
  "created_at": "2025-11-09T10:40:00"
}
```

### Get User Checklists

**Endpoint**: `GET /api/checklist?skip=0&limit=10`

**Response** (200 OK):
```json
[
  {
    "id": "checklist-uuid",
    "title": "2024 Tax Checklist",
    "created_at": "2025-11-09T10:40:00",
    "categories": [...]
  }
]
```

### Get Checklist Details

**Endpoint**: `GET /api/checklist/{checklist_id}`

### Update Checklist Item

**Endpoint**: `PUT /api/checklist/{checklist_id}/items/{item_id}`

**Request Body**:
```json
{
  "is_completed": true
}
```

### Delete Checklist

**Endpoint**: `DELETE /api/checklist/{checklist_id}`

---

## Guided Chat

Structured question flow for Path 2 (Guided Chat).

### Get Initial Question

**Endpoint**: `GET /api/guided-chat/{session_id}/initial`

**Response** (200 OK):
```json
{
  "phase": "filing_status",
  "question": "What is your tax filing status?",
  "question_type": "single_choice",
  "options": [
    {"value": "single", "label": "Single"},
    {"value": "married_joint", "label": "Married Filing Jointly"},
    {"value": "married_separate", "label": "Married Filing Separately"},
    {"value": "head_of_household", "label": "Head of Household"},
    {"value": "qualifying_widow", "label": "Qualifying Widow(er)"}
  ],
  "required": true,
  "progress": 11,
  "total_questions": 9,
  "current_question": 1
}
```

### Get Next Question

**Endpoint**: `GET /api/guided-chat/{session_id}/next?current_phase=filing_status`

### Submit Answer

**Endpoint**: `POST /api/guided-chat/{session_id}/answer`

**Request Body**:
```json
{
  "answer": "married_joint",
  "phase": "filing_status"
}
```

**Response** (200 OK):
```json
{
  "phase": "income_range",
  "question": "What is your estimated annual income?",
  "question_type": "single_choice",
  "options": [...],
  "progress": 22,
  "current_question": 2
}
```

---

## Error Handling

All errors follow this format:

**Response** (4xx/5xx):
```json
{
  "detail": "Error message"
}
```

**Common Status Codes**:
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

**Validation Error Example** (422):
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## Rate Limiting

- Authentication endpoints: 5 requests/minute
- Chat streaming: 20 requests/minute
- Other endpoints: 60 requests/minute

---

## Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (httpOnly cookies recommended)
3. **Refresh tokens** before expiration (30 min for access tokens)
4. **Handle SSE reconnection** for streaming endpoints
5. **Implement exponential backoff** for retries
6. **Validate user input** on frontend before API calls
7. **Use session_id** for multi-turn conversations
8. **Monitor completion_percentage** to enable smart features

---

## Example: Complete Workflow (Free Chat Mode)

```javascript
// 1. Create session
const session = await fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 2. Stream chat messages
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "I'm married with 2 kids, earning $80k/year",
    session_id: session.session_id
  })
});

// 3. Parse SSE stream
const reader = response.body.getReader();
const decoder = new TextDecoder();
// ... handle streaming ...

// 4. Check completion
const sessionDetails = await fetch(`/api/sessions/${session.session_id}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

if (sessionDetails.extracted_identity.completion_percentage >= 60) {
  // 5. Generate checklist
  const checklist = await fetch('/api/checklist/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      generation_mode: 'free_chat',
      session_id: session.session_id
    })
  }).then(r => r.json());
}
```

---

## Support

For issues or questions:
- GitHub: https://github.com/1641542839/ChatTax
- Email: support@chattax.com

**Last Updated**: November 9, 2025
