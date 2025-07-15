from datetime import datetime, date
from pydantic import BaseModel, EmailStr, ConfigDict, computed_field
from typing import Optional, List

# --- User Schemas (No changes here) ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    surname: Optional[str] = None
    birthday: Optional[date] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: Optional[str] = None
    surname: Optional[str] = None
    birthday: Optional[date] = None
    role: str = "user"
    is_active: bool = True

    @computed_field
    @property
    def full_name(self) -> str:
        if self.first_name and self.surname:
            return f"{self.first_name} {self.surname}"
        return self.first_name or self.surname or "No name set"

    model_config = ConfigDict(from_attributes=True)

# --- Token Schemas (No changes here) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[int] = None
    email: Optional[EmailStr] = None

# --- Task Schemas (No changes here) ---
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    deadline_all_day: bool = False
    deadline: Optional[datetime] = None
    urgency: bool = False
    important: bool = False
    company_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    deadline_all_day: Optional[bool] = None
    deadline: Optional[datetime] = None
    urgency: Optional[bool] = None
    important: Optional[bool] = None
    status: Optional[str] = None
    completed: Optional[bool] = None
    company_id: Optional[int] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    deadline_all_day: bool = False
    deadline: Optional[datetime] = None
    urgency: bool = False
    important: bool = False
    status: str = "new"
    completed: bool = False
    owner_id: int
    group_id: Optional[int] = None
    company_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

# --- Group Schemas (No changes here) ---
class GroupCreate(BaseModel):
    name: str

class GroupOut(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class GroupTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    deadline_all_day: bool = False
    deadline: Optional[datetime] = None
    urgency: bool = False
    important: bool = False

# --- Other Schemas (No changes here) ---
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    surname: Optional[str] = None
    birthday: Optional[date] = None

class CalendarEvent(BaseModel):
    title: str
    start: datetime | date
    end: datetime | date
    type: str
    allDay: bool
    user_id: Optional[int] = None
    task_id: Optional[int] = None
    group_id: Optional[int] = None
    details: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class UserRoleUpdate(BaseModel):
    role: str

class UserStatusUpdate(BaseModel):
    is_active: bool

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

# --- Company Schemas ---
class CompanyBase(BaseModel):
    name: str
    vat_number: Optional[str] = None
    occupation: Optional[str] = None
    # --- THE FIX: Make creation_date optional ---
    creation_date: Optional[date] = None
    description: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    vat_number: Optional[str] = None
    occupation: Optional[str] = None
    creation_date: Optional[date] = None
    description: Optional[str] = None

class CompanyOut(CompanyBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Event Schemas ---
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: str
    event_date: datetime

class EventCreate(EventBase):
    pass

class EventOut(EventBase):
    id: int
    created_by_id: int
    model_config = ConfigDict(from_attributes=True)
