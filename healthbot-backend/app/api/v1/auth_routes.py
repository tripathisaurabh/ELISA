from uuid import uuid4
from fastapi import APIRouter, HTTPException
from app.schemas.auth_schemas import RegisterRequest, LoginRequest
from app.core.supabase_client import supabase_auth, supabase_db

router = APIRouter(prefix="/auth", tags=["Auth"])


# --------------------------------------------------------
# REGISTER
# --------------------------------------------------------
@router.post("/register")
def register_user(payload: RegisterRequest):

    # 1️⃣ Create user in Supabase Auth
    try:
        response = supabase_auth.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "data": {
                "name": payload.name,
                "role": payload.role
            }
        })
    except Exception as e:
        raise HTTPException(400, f"Supabase signup failed: {str(e)}")

    user = response.user
    if not user:
        raise HTTPException(400, "Signup failed")

    # --------------------------------------------------------
    # PATIENT FLOW  ✅ ONLY PATIENT ID USED
    # --------------------------------------------------------
    if payload.role == "patient":
        patient_id = str(uuid4())

        try:
            supabase_db.table("patients").insert({
                "id": patient_id,         # REAL patient ID we use everywhere
                "name": payload.name,
                "email": payload.email,
                "phone": payload.phone,
                "age": payload.age,
                "gender": payload.gender,
            }).execute()
        except Exception as e:
            raise HTTPException(400, f"Patient DB insert failed: {str(e)}")

        return {
            "message": "User + Patient created",
            "patient_id": patient_id,    # FRONTEND WILL USE THIS ONLY
            "role": "patient"
        }

    # --------------------------------------------------------
    # DOCTOR FLOW
    # --------------------------------------------------------
    if payload.role == "doctor":
        doctor_id = str(uuid4())

        try:
            supabase_db.table("doctors").insert({
                "id": doctor_id,        # REAL doctor ID used everywhere
                "name": payload.name,
                "email": payload.email,
                "speciality": payload.speciality,
                "clinic_name": payload.clinic_name,
                "experience": payload.experience,
            }).execute()
        except Exception as e:
            raise HTTPException(400, f"Doctor DB insert failed: {str(e)}")

        return {
            "message": "User + Doctor created",
            "doctor_id": doctor_id,
            "role": "doctor"
        }

    raise HTTPException(400, f"Unknown role: {payload.role}")


# --------------------------------------------------------
# LOGIN
# --------------------------------------------------------
@router.post("/login")
def login_user(payload: LoginRequest):

    # 1️⃣ Login with Supabase Auth
    try:
        auth_res = supabase_auth.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password,
        })
    except Exception as e:
        raise HTTPException(400, f"Login failed: {str(e)}")

    user = auth_res.user
    session = auth_res.session
    if not user:
        raise HTTPException(400, "Invalid credentials")

    # Role from metadata
    role = (user.user_metadata or {}).get("role")

    patient_id = None
    doctor_id = None

    # --------------------------------------------------------
    # PATIENT LOGIN → GET patient_id BY EMAIL (NOT BY auth ID)
    # --------------------------------------------------------
    if role == "patient":
        try:
            res = (
                supabase_db.table("patients")
                .select("id")
                .eq("email", user.email)      # FETCH BY EMAIL ONLY
                .single()
                .execute()
            )
            patient_id = res.data["id"]
        except:
            patient_id = None

    # --------------------------------------------------------
    # DOCTOR LOGIN → GET doctor_id BY EMAIL
    # --------------------------------------------------------
    if role == "doctor":
        try:
            res = (
                supabase_db.table("doctors")
                .select("id")
                .eq("email", user.email)
                .single()
                .execute()
            )
            doctor_id = res.data["id"]
        except:
            doctor_id = None

    return {
        "message": "Login successful",
        "role": role,
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "email": user.email,
        "name": (user.user_metadata or {}).get("name"),
        "session": session
    }
