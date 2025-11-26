# This file is no longer needed because we're using Supabase instead of SQLAlchemy.
# Keeping an empty get_db() for compatibility if any router imports it.

from fastapi import Depends

def get_db():
    # Dummy placeholder so routes don't break
    return None
