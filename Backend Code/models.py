from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

# This is the association table for the many-to-many relationship between users and groups
group_members = Table(
    "group_members",
    Base.metadata,
    Column("group_id", Integer, ForeignKey("groups.id")),
    Column("user_id", Integer, ForeignKey("users.id"))
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    surname = Column(String, nullable=True)
    birthday = Column(Date, nullable=True)
    role = Column(String, default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    tasks = relationship("Task", back_populates="owner")
    groups = relationship("Group", secondary=group_members, back_populates="members")
    events = relationship("Event", back_populates="creator")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    start_date = Column(DateTime, nullable=True)
    deadline_all_day = Column(Boolean, default=False)
    deadline = Column(DateTime, nullable=True)
    urgency = Column(Boolean, default=False)
    important = Column(Boolean, default=False)
    status = Column(String, default="new", nullable=False)
    completed = Column(Boolean, default=False)
    
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    owner = relationship("User", back_populates="tasks")
    group = relationship("Group", back_populates="tasks")
    # --- THE FIX: The back_populates argument now correctly points to "tasks" ---
    company = relationship("Company", back_populates="tasks")


class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    
    members = relationship("User", secondary=group_members, back_populates="groups")
    tasks = relationship("Task", back_populates="group")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)

    user = relationship("User")

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    vat_number = Column(String, unique=True, index=True, nullable=True)
    occupation = Column(String, nullable=True)
    creation_date = Column(Date, nullable=True)
    description = Column(String, nullable=True)
    
    # This relationship correctly links back to the "company" attribute on the Task model
    tasks = relationship("Task", back_populates="company")

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    location = Column(String, nullable=False)
    event_date = Column(DateTime(timezone=True), nullable=False)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator = relationship("User", back_populates="events")
