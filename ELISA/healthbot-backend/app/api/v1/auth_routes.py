# app/api/v1/auth_routes.py
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
        # some Supabase clients accept `data` -> user_metadata, but this may not always persist
        # we still pass it, but we will not rely solely on it at login time
        "data": {
            "name": payload.name,
            "role": payload.role,
        }
    })

    user = getattr(response, "user", None)
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


# ----------------------------------------
# LOGIN
# ----------------------------------------
@router.post("/login")
def login_user(payload: LoginRequest):
    # Attempt to sign in with email/password
    result = supabase_auth.auth.sign_in_with_password({
        "email": payload.email,
        "password": payload.password
    })

    user = getattr(result, "user", None)
    session = getattr(result, "session", None)

    # If login failed, raise an error with details (safe message)
    if not user or not session:
        # result may contain error details; include in message for debugging (but avoid leaking secrets)
        raise HTTPException(401, f"Login failed: {result}")

    # Try to read role from user metadata (if present)
    role = None
    try:
        # user.user_metadata may be None or dict, guard access
        um = getattr(user, "user_metadata", None)
        if isinstance(um, dict):
            role = um.get("role")
    except Exception:
        role = None

    profile = None

    # If we couldn't get role from metadata, infer it from DB rows (by email)
    if not role:
        # Check patients table
        try:
            patient_resp = supabase_db.table("patients").select("*").eq("email", user.email).single().execute()
            if getattr(patient_resp, "data", None):
                role = "patient"
                profile = patient_resp.data
        except Exception:
            # continue to doctor check
            profile = None

    if not role:
        try:
            doctor_resp = supabase_db.table("doctors").select("*").eq("email", user.email).single().execute()
            if getattr(doctor_resp, "data", None):
                role = "doctor"
                profile = doctor_resp.data
        except Exception:
            profile = None

    # If role still not determined, leave it as None (frontend will treat as patient by fallback)
    # But we return role explicitly (maybe None) so frontend sees it.
    # If profile is a supabase response wrapper (not data), ensure we return .data
    if profile is None:
        # If either patient_resp or doctor_resp exist but had no .data we tried above, ensure profile is None
        profile = None

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
        "profile": profile
    }
