from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.v1.auth_routes import router as auth_router
from app.api.v1.report_routes import router as report_router
from app.api.v1.share_routes import router as share_router
from app.api.v1.rag_routes import router as rag_router
from app.api.v1.doctor_chat_routes import router as doctor_chat_router

settings = get_settings()

app = FastAPI(
    title="HealthBot Backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------
# Root
# ----------------------------
@app.get("/")
def root():
    return {"message": "HealthBot backend running"}


# ----------------------------
# Supabase quick test
# ----------------------------
@app.get("/test/supabase")
def test_supabase():
    from app.core.supabase_clients import supabase_auth, supabase_db
    res = supabase.table("reports").select("*").limit(1).execute()
    return {"success": True, "data": res.data}


# ----------------------------
# 🔍 DEBUG: what role is backend using?
# ----------------------------
@app.get("/debug/role")
def debug_role():
    """
    This calls a Postgres function `auth_role()` which returns
    the JWT role used by Supabase for this request.

    If everything is correct, you should see:  "service_role"
    If you see "anon" or null, RLS errors are expected.
    """
    from app.core.supabase_clients import supabase_auth, supabase_db
    res = supabase.rpc("auth_role").execute()
    return {"data": res.data}


# ----------------------------
# Routers
# ----------------------------
from app.api.v1.auth_routes import router as auth_router
from app.api.v1.report_routes import router as report_router
from app.api.v1.share_routes import router as share_router
from app.api.v1.rag_routes import router as rag_router

app.include_router(auth_router, prefix="/api/v1")
app.include_router(report_router, prefix="/api/v1")
app.include_router(share_router, prefix="/api/v1")
app.include_router(rag_router, prefix="/api/v1")

