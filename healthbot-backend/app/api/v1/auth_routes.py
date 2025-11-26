from fastapi import APIRouter, HTTPException
from uuid import uuid4
from app.schemas.auth_schemas import RegisterRequest, LoginRequest
from app.core.supabase_clients import supabase_auth, supabase_db

router = APIRouter(prefix="/auth", tags=["Auth"])


# ----------------------------------------
# REGISTER
# ----------------------------------------

@router.post("/register")
def register_user(payload: RegisterRequest):

    # 1️⃣ Create user in Supabase Auth
    response = supabase_auth.auth.sign_up({
        "email": payload.email,
        "password": payload.password,
        "data": {
            "name": payload.name,
            "role": payload.role,
        }
    })

    user = response.user
    if not user:
        raise HTTPException(400, f"Signup failed: {response}")

    # 2️⃣ If role = PATIENT → create patient record
    if payload.role == "patient":
        try:
            supabase_db.table("patients").insert({
                "id": str(uuid4()),
                "name": payload.name,
                "email": payload.email,
                "phone": payload.phone,
                "age": payload.age,
                "gender": payload.gender,
            }).execute()
        except Exception as e:
            raise HTTPException(400, f"Patient DB insert failed: {e}")

        return {
            "message": "User + Patient created",
            "auth_user_id": user.id,
            "role": "patient"
        }

    # 3️⃣ If role = DOCTOR → create doctor record
    elif payload.role == "doctor":

        # Validate doctor-specific fields
        if not payload.speciality or not payload.clinic_name or not payload.experience:
            raise HTTPException(
                400,
                "Doctor registration requires: speciality, clinic_name, experience"
            )

        try:
            supabase_db.table("doctors").insert({
                "id": str(uuid4()),
                "name": payload.name,
                "email": payload.email,
                "phone": payload.phone,
                "speciality": payload.speciality,
                "clinic_name": payload.clinic_name,
                "experience": payload.experience,
            }).execute()
        except Exception as e:
            raise HTTPException(400, f"Doctor DB insert failed: {e}")

        return {
            "message": "User + Doctor created",
            "auth_user_id": user.id,
            "role": "doctor"
        }

    # 4️⃣ Invalid role
    else:
        raise HTTPException(400, "Invalid role. Must be 'patient' or 'doctor'.")

@router.post("/login")
def login_user(payload: LoginRequest):

    result = supabase_auth.auth.sign_in_with_password({
        "email": payload.email,
        "password": payload.password
    })

    user = result.user
    session = result.session

    role = user.user_metadata.get("role")
    profile = None

    if role == "patient":
        profile = supabase_db.table("patients").select("*").eq("email", user.email).single().execute()

    elif role == "doctor":
        profile = supabase_db.table("doctors").select("*").eq("email", user.email).single().execute()

    return {
        "message": "Login successful",
        "role": role,
        "user": {
            "id": user.id,
            "email": user.email,
        },
        "session": {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "expires_in": session.expires_in,
        },
        "profile": profile.data if profile else None
    }
