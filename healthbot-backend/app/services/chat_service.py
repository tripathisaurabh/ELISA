from app.core.supabase_clients import supabase_auth, supabase_db
import uuid
from datetime import datetime

# Save chat messages for doctor ↔ bot chat
def save_chat_message(share_id: str, sender: str, message: str):
    data = {
        "id": str(uuid.uuid4()),
        "share_id": share_id,
        "sender": sender,
        "message": message,
        "created_at": datetime.utcnow().isoformat()
    }

    supabase.table("chat_messages").insert(data).execute()
    return True


# Fetch full chat history
def get_chat_history(share_id: str):
    res = (
        supabase.table("chat_messages")
        .select("*")
        .eq("share_id", share_id)
        .order("created_at")
        .execute()
    )
    return res.data or []
