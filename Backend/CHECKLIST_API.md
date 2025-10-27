# Checklist API Documentation

## Overview

The Checklist API provides endpoints for generating and managing personalized tax preparation checklists based on user's identity information.

## Base URL

```
http://localhost:8000/api/checklist
```

## Endpoints

### 1. Generate Checklist

Generate a personalized tax checklist using AI based on user's tax situation.

**Endpoint:** `POST /api/checklist/generate`

**Request Body:**
```json
{
  "user_id": 123,
  "identity_info": {
    "employment_status": "employed",
    "income_sources": ["salary", "investment"],
    "has_dependents": true,
    "has_investment": true,
    "has_rental_property": false,
    "is_first_time_filer": false,
    "additional_info": {
      "industry": "tech",
      "location": "NSW"
    }
  }
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "user_id": 123,
  "identity_info": { ... },
  "items": [
    {
      "id": "doc_001",
      "title": "Gather payment summaries",
      "description": "Collect all payment summaries from your employers showing income and tax withheld",
      "category": "documents",
      "priority": "high",
      "status": "todo",
      "estimated_time": "10 minutes"
    }
  ],
  "created_at": "2024-10-27T10:30:00",
  "updated_at": "2024-10-27T10:30:00"
}
```

---

### 2. Get Checklist by ID

Retrieve a specific checklist.

**Endpoint:** `GET /api/checklist/{checklist_id}?user_id={user_id}`

**Parameters:**
- `checklist_id` (path): ID of the checklist
- `user_id` (query): User ID for authorization

**Response:** `200 OK`
```json
{
  "id": 1,
  "user_id": 123,
  "items": [...],
  "created_at": "2024-10-27T10:30:00",
  "updated_at": "2024-10-27T10:30:00"
}
```

---

### 3. Get User's Checklists

Get all checklists for a user.

**Endpoint:** `GET /api/checklist/user/{user_id}`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 123,
    "items": [...],
    "created_at": "2024-10-27T10:30:00"
  },
  {
    "id": 2,
    "user_id": 123,
    "items": [...],
    "created_at": "2024-10-26T15:20:00"
  }
]
```

---

### 4. Update Item Status

Update the status of a checklist item.

**Endpoint:** `PATCH /api/checklist/{checklist_id}/status?user_id={user_id}`

**Request Body:**
```json
{
  "item_id": "doc_001",
  "status": "doing"
}
```

**Status Values:**
- `todo`: Not started
- `doing`: In progress
- `done`: Completed

**Response:** `200 OK`
```json
{
  "id": 1,
  "user_id": 123,
  "items": [
    {
      "id": "doc_001",
      "title": "Gather payment summaries",
      "status": "doing",  // Updated
      ...
    }
  ],
  "updated_at": "2024-10-27T11:00:00"
}
```

---

### 5. Delete Checklist

Delete a checklist.

**Endpoint:** `DELETE /api/checklist/{checklist_id}?user_id={user_id}`

**Response:** `204 No Content`

---

## Identity Info Fields

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `employment_status` | string | Employment status | "employed", "self-employed", "unemployed" |
| `income_sources` | array | List of income sources | ["salary", "rental", "investment"] |
| `has_dependents` | boolean | Has dependents | true/false |
| `has_investment` | boolean | Has investments | true/false |
| `has_rental_property` | boolean | Has rental properties | true/false |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `is_first_time_filer` | boolean | First time filing (default: false) |
| `additional_info` | object | Any additional context |

---

## Checklist Item Structure

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique item identifier |
| `title` | string | Short title |
| `description` | string | Detailed description |
| `category` | string | Category: documents, deductions, forms, deadlines, record_keeping |
| `priority` | string | Priority: high, medium, low |
| `status` | string | Status: todo, doing, done |
| `estimated_time` | string | Time estimate (e.g., "15 minutes") |

---

## Error Responses

### 404 Not Found
```json
{
  "detail": "Checklist 123 not found or you don't have access"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to generate checklist: <error message>"
}
```

---

## Testing

Run the test script:

```bash
python test_checklist.py
```

Or use the FastAPI docs:

```
http://localhost:8000/docs
```

---

## Architecture

The checklist feature follows SOLID principles:

1. **Single Responsibility**: Each layer has one responsibility
   - Router: HTTP handling
   - Service: Business logic
   - Model: Data structure
   - LLM Service: AI generation

2. **Dependency Inversion**: Services depend on abstractions
   - Router depends on ChecklistService interface
   - Service depends on LLMService interface

3. **Open/Closed**: Extensible without modification
   - Can add new checklist types
   - Can change LLM provider

---

## Database Schema

Table: `checklists`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users |
| identity_info | JSON | User's identity data |
| checklist_json | JSON | Checklist items array |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |
