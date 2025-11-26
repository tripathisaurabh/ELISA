from pydantic import BaseModel, EmailStr
from typing import Optional

from pydantic import BaseModel
from typing import Optional

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str  # "patient" or "doctor"

    # Patient fields
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None

    # Doctor fields
    speciality: Optional[str] = None
    clinic_name: Optional[str] = None
    experience: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
