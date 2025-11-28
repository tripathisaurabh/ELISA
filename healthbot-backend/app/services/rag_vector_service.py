# ============================================================
#  RAG VECTOR SEARCH DISABLED (NO report_chunks TABLE NEEDED)
# ============================================================

def search_patient_documents(patient_id: str, query: str, top_k: int = 3):
    """
    RAG vector search is disabled because the Supabase table
    'report_chunks' does not exist.

    This function safely returns an empty list so the chat
    system does not crash.
    """
    return []
