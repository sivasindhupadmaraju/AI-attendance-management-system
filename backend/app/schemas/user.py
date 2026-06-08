from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Optional[str] = "admin"  # "admin" or "teacher"
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

