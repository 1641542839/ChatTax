"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# User Schemas
class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for user creation."""

    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """Schema for user update."""

    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8, max_length=100)


class UserResponse(UserBase):
    """Schema for user response."""

    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Authentication Schemas
class Token(BaseModel):
    """Token response schema."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Token payload schema."""

    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None


class LoginRequest(BaseModel):
    """Login request schema."""

    username: str
    password: str


# Chat Schemas
class ChatMessage(BaseModel):
    """Chat message schema."""

    content: str = Field(..., min_length=1, max_length=5000, alias="message")


class ChatResponse(BaseModel):
    """Chat response schema."""

    response: str
    timestamp: datetime


# Query & RAG Schemas
class QueryRequest(BaseModel):
    """Request schema for RAG-based query."""

    question: str = Field(..., min_length=1, max_length=2000, description="User's tax-related question")
    user_type: str = Field(..., description="Type of user: 'individual', 'business', or 'professional'")
    top_k: int = Field(default=3, ge=1, le=10, description="Number of relevant documents to retrieve")

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What are the tax deductions for home office expenses in 2024?",
                "user_type": "individual",
                "top_k": 3
            }
        }


class DocumentSource(BaseModel):
    """Schema for document source information from crawled data."""

    chunk_id: str = Field(..., description="Unique chunk identifier")
    doc_id: str = Field(..., description="Document identifier")
    source_url: str = Field(..., description="Source URL of the tax document")
    section_heading: str = Field(..., description="Section heading from the document")
    text: str = Field(..., description="Text content of the chunk")
    tokens_est: int = Field(..., description="Estimated token count")
    is_table_summary: bool = Field(..., description="Whether this is a table summary")
    table_ref: Optional[str] = Field(None, description="Table reference if applicable")
    provenance: str = Field(..., description="Data provenance information")
    crawl_date: str = Field(..., description="Date when data was crawled")
    last_updated_on_page: Optional[str] = Field(None, description="Last update date from source page")
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="Bi-encoder similarity score from FAISS (0-1)")
    rerank_score: Optional[float] = Field(None, description="Cross-encoder rerank score (if reranking enabled)")


class QueryResponse(BaseModel):
    """Response schema for RAG-based query."""

    answer: str = Field(..., description="AI-generated answer to the user's question")
    sources: list[DocumentSource] = Field(..., description="List of source documents used")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Overall confidence score (0-1)")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")
    user_type: str = Field(..., description="User type used for context")

    class Config:
        json_schema_extra = {
            "example": {
                "answer": "For home office expenses in 2024, you can deduct...",
                "sources": [
                    {
                        "chunk_id": "chunk_001",
                        "doc_id": "irs_pub_587",
                        "source_url": "https://www.irs.gov/publications/p587",
                        "section_heading": "Home Office Deduction",
                        "text": "You can deduct expenses for the business use of your home...",
                        "tokens_est": 150,
                        "is_table_summary": False,
                        "table_ref": None,
                        "provenance": "IRS Official Website",
                        "crawl_date": "2024-01-15",
                        "last_updated_on_page": "2024-01-10",
                        "relevance_score": 0.92
                    }
                ],
                "confidence": 0.89,
                "timestamp": "2024-10-26T10:30:00",
                "user_type": "individual"
            }
        }
