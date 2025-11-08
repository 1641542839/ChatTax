# API Endpoints Reference

Complete reference for all ChatTax Backend API endpoints.

## Base URL

```
http://localhost:8000
```

Production: `https://api.chattax.com`

## Authentication

Most endpoints require JWT authentication.

**Authentication Header**:
```http
Authorization: Bearer <access_token>
```

**Get Access Token**: See [Authentication Endpoints](#authentication)

---

## Health & Status

### GET /health

Check server health status.

**Authentication**: Not required

**Request**:
```bash
curl http://localhost:8000/health
```

**Response**: `200 OK`
```json
{
  "status": "healthy"
}
```

---

## Authentication

### POST /api/auth/register

Register a new user account.

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePassword123!",
  "full_name": "John Doe"
}
```

**Response**: `201 Created`
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2024-11-08T10:30:00"
}
```

**Errors**:
- `400`: Email or username already exists
- `422`: Validation error (invalid email, weak password)

**Example**:
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "username": "johndoe",
    "password": "MyPassword123!",
    "full_name": "John Doe"
  }'
```

---

### POST /api/auth/login

Login and receive access token.

**Authentication**: Not required

**Request Body**: Form data
```
username=johndoe
password=MyPassword123!
```

**Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors**:
- `401`: Invalid credentials
- `422`: Missing username or password

**Example (cURL)**:
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=johndoe&password=MyPassword123!"
```

**Example (PowerShell)**:
```powershell
$body = @{
    username = "johndoe"
    password = "MyPassword123!"
}
Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" `
  -Method Post -Body $body
```

---

### GET /api/auth/me

Get current authenticated user information.

**Authentication**: Required

**Request**:
```bash
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer <access_token>"
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "email": "john@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2024-11-08T10:30:00"
}
```

**Errors**:
- `401`: Invalid or expired token

---

## RAG Query

### POST /api/chat/query

Ask tax-related questions with AI-powered answers and citations.

**Authentication**: Not required (optional for future user tracking)

**Request Body**:
```json
{
  "question": "What are the home office deductions available in Australia?",
  "user_type": "individual",
  "top_k": 3,
  "use_reranking": true,
  "initial_candidates": 20
}
```

**Parameters**:
- `question` (string, required): User's tax question
- `user_type` (string, optional): Default `"individual"` (only supported value)
- `top_k` (integer, optional): Number of sources to return (1-10), default 3
- `use_reranking` (boolean, optional): Enable two-stage retrieval, default `true`
- `initial_candidates` (integer, optional): Candidates for reranking (10-50), default 20

**Response**: `200 OK`
```json
{
  "answer": "In Australia, individuals can claim home office deductions for expenses directly related to earning income [Source 1]. You can use either the fixed rate method (67 cents per hour) or actual cost method [Source 2]. Deductible expenses include electricity, internet, phone, and depreciation of office equipment [Source 3].",
  "sources": [
    {
      "chunk_id": "ato_doc_245_chunk_12",
      "doc_id": "ato_doc_245",
      "source_url": "https://www.ato.gov.au/individuals/income-and-deductions/deductions/home-office-expenses",
      "section_heading": "Home office expenses",
      "text": "If you work from home, you can claim deductions for the additional running expenses you incur...",
      "crawl_date": "2024-10-15",
      "last_updated_on_page": "2024-09-01",
      "is_table_summary": false,
      "provenance": "Australian Taxation Office",
      "relevance_score": 0.89
    },
    {
      "chunk_id": "ato_doc_1089_chunk_5",
      "doc_id": "ato_doc_1089",
      "source_url": "https://www.ato.gov.au/individuals/income-and-deductions/deductions/working-from-home",
      "section_heading": "Fixed rate method",
      "text": "The fixed rate method allows you to claim 67 cents per hour for each hour you work from home...",
      "crawl_date": "2024-10-15",
      "last_updated_on_page": "2024-08-15",
      "is_table_summary": false,
      "provenance": "Australian Taxation Office",
      "relevance_score": 0.82
    },
    {
      "chunk_id": "ato_doc_2341_chunk_8",
      "doc_id": "ato_doc_2341",
      "source_url": "https://www.ato.gov.au/individuals/income-and-deductions/deductions/working-from-home-expenses",
      "section_heading": "Actual cost method",
      "text": "Under the actual cost method, you calculate your deduction based on the actual expenses incurred...",
      "crawl_date": "2024-10-15",
      "last_updated_on_page": "2024-07-20",
      "is_table_summary": false,
      "provenance": "Australian Taxation Office",
      "relevance_score": 0.78
    }
  ],
  "confidence": 0.85,
  "timestamp": "2024-11-08T10:30:00"
}
```

**Response Fields**:
- `answer` (string): AI-generated answer with citations [Source 1], [Source 2]
- `sources` (array): Retrieved tax documents
  - `chunk_id` (string): Unique chunk identifier
  - `doc_id` (string): Parent document ID
  - `source_url` (string): Original ATO URL
  - `section_heading` (string): Document section name
  - `text` (string): Relevant text excerpt
  - `crawl_date` (string): When document was indexed
  - `last_updated_on_page` (string): Last update on source page
  - `is_table_summary` (boolean): Whether chunk is table summary
  - `provenance` (string): Data source (e.g., "Australian Taxation Office")
  - `relevance_score` (float): 0-1 similarity score
- `confidence` (float): Overall confidence score (0-1)
- `timestamp` (string): Response generation timestamp

**Errors**:
- `400`: Invalid request (missing question, invalid top_k)
- `500`: OpenAI API error or FAISS index error

**Example (cURL)**:
```bash
curl -X POST "http://localhost:8000/api/chat/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Can I claim education expenses for work-related courses?",
    "user_type": "individual",
    "top_k": 3
  }'
```

**Example (Python)**:
```python
import requests

response = requests.post('http://localhost:8000/api/chat/query', json={
    'question': 'What is the tax-free threshold in Australia?',
    'user_type': 'individual',
    'top_k': 3
})
result = response.json()
print(result['answer'])
```

---

### GET /api/chat/stats

Get vector store statistics.

**Authentication**: Not required

**Request**:
```bash
curl http://localhost:8000/api/chat/stats
```

**Response**: `200 OK`
```json
{
  "status": "initialized",
  "document_count": 3246,
  "embedding_dim": 384,
  "index_type": "Flat",
  "metadata_size": "2.4 MB"
}
```

---

## Chat Streaming

### POST /api/chat/stream

Stream chat responses using Server-Sent Events (SSE).

**Authentication**: Required

**Request Body**:
```json
{
  "content": "How do I claim working from home expenses?"
}
```

**Response**: SSE Stream

**Event Types**:
- `message`: Token chunk
  ```
  event: message
  data: {"content": "You"}
  
  event: message
  data: {"content": " can"}
  
  event: message
  data: {"content": " claim"}
  ```

- `done`: Stream completed
  ```
  event: done
  data: {"message": "Stream completed"}
  ```

**Example (JavaScript)**:
```javascript
const eventSource = new EventSource(
  'http://localhost:8000/api/chat/stream',
  { 
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }
);

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log(data.content); // Token chunk
});

eventSource.addEventListener('done', () => {
  eventSource.close();
});
```

**Example (Python)**:
```python
import sseclient
import requests

response = requests.post(
    'http://localhost:8000/api/chat/stream',
    json={'content': 'What are tax offsets?'},
    headers={'Authorization': f'Bearer {access_token}'},
    stream=True
)

client = sseclient.SSEClient(response)
for event in client.events():
    if event.event == 'message':
        data = json.loads(event.data)
        print(data['content'], end='', flush=True)
    elif event.event == 'done':
        break
```

---

## Checklist Management

### POST /api/checklist/generate

Generate personalized tax preparation checklist.

**Authentication**: Not required (optional for user tracking)

**Request Body**:
```json
{
  "user_id": 1,
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

**Parameters**:
- `user_id` (integer, optional): User ID for tracking
- `identity_info` (object, required):
  - `employment_status` (string): "employed", "self-employed", "unemployed", "retired"
  - `income_sources` (array): ["salary", "investment", "rental", "business", "other"]
  - `has_dependents` (boolean): Has dependent children
  - `has_investment` (boolean): Has investment income
  - `has_rental_property` (boolean): Owns rental property
  - `is_first_time_filer` (boolean): First time filing tax return
  - `additional_info` (object, optional):
    - `industry` (string): Work industry
    - `location` (string): Australian state (NSW, VIC, QLD, etc.)

**Response**: `201 Created`
```json
{
  "id": 1,
  "user_id": 1,
  "identity_info": { ... },
  "items": [
    {
      "id": "doc_001",
      "title": "Gather payment summaries",
      "description": "Collect all payment summaries (formerly group certificates) from your employers showing income earned and tax withheld",
      "category": "documents",
      "priority": "high",
      "status": "todo",
      "estimated_time": "10 minutes"
    },
    {
      "id": "doc_002",
      "title": "Prepare bank statements",
      "description": "Gather bank statements showing interest income for all accounts",
      "category": "documents",
      "priority": "high",
      "status": "todo",
      "estimated_time": "15 minutes"
    },
    {
      "id": "doc_003",
      "title": "Organize investment statements",
      "description": "Collect dividend statements, capital gains/losses records from your investment portfolio",
      "category": "documents",
      "priority": "high",
      "status": "todo",
      "estimated_time": "20 minutes"
    }
    // ... 5-15 items total based on complexity
  ],
  "created_at": "2024-11-08T10:30:00",
  "updated_at": "2024-11-08T10:30:00"
}
```

**Checklist Item Fields**:
- `id` (string): Unique item identifier
- `title` (string): Short task title
- `description` (string): Detailed task description
- `category` (string): "documents", "accounts", "records", "calculations", "review"
- `priority` (string): "high", "medium", "low"
- `status` (string): "todo", "in_progress", "completed"
- `estimated_time` (string): Estimated time to complete

**Complexity Levels**:
- **Simple** (3-4 factors): 5-8 items
- **Moderate** (5-6 factors): 8-12 items
- **Complex** (7+ factors): 12-15 items

**Example**:
```bash
curl -X POST "http://localhost:8000/api/checklist/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "identity_info": {
      "employment_status": "employed",
      "income_sources": ["salary"],
      "has_dependents": false,
      "location": "VIC"
    }
  }'
```

---

### GET /api/checklist/{checklist_id}

Get specific checklist by ID.

**Authentication**: Not required

**Query Parameters**:
- `user_id` (integer, optional): User ID for authorization

**Request**:
```bash
curl "http://localhost:8000/api/checklist/1?user_id=1"
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "items": [ ... ],
  "created_at": "2024-11-08T10:30:00",
  "updated_at": "2024-11-08T10:30:00"
}
```

**Errors**:
- `404`: Checklist not found

---

### GET /api/checklist/user/{user_id}

Get all checklists for a user.

**Authentication**: Not required

**Request**:
```bash
curl "http://localhost:8000/api/checklist/user/1"
```

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 1,
    "items": [ ... ],
    "created_at": "2024-11-08T10:30:00"
  },
  {
    "id": 2,
    "user_id": 1,
    "items": [ ... ],
    "created_at": "2024-11-07T14:20:00"
  }
]
```

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message description",
  "status_code": 400
}
```

**Common Status Codes**:
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

**Example Error**:
```json
{
  "detail": "Invalid email format",
  "status_code": 422
}
```

---

## Rate Limiting

**Current Limits**:
- No rate limiting implemented yet

**Future Plans**:
- 100 requests per minute per IP
- 1000 requests per hour per authenticated user

---

## Next Steps

- [Query Endpoint Details](./query-endpoint.md)
- [Authentication Flow](./authentication.md)
- [Checklist API Guide](./checklist-api.md)
