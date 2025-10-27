from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class Checklist(Base):
    """
    SQLAlchemy model for storing personalized tax checklists.
    
    Follows Single Responsibility Principle - only handles data structure.
    """
    __tablename__ = "checklists"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)  # Removed ForeignKey since users table may not exist
    identity_info = Column(JSON, nullable=False)  # Store user's identity information
    checklist_json = Column(JSON, nullable=False)  # Store the generated checklist items
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationship to user (assuming users table exists)
    # user = relationship("User", back_populates="checklists")
    
    def __repr__(self):
        return f"<Checklist(id={self.id}, user_id={self.user_id}, created_at={self.created_at})>"
