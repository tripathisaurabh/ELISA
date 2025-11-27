from openai import OpenAI
from app.core.config import get_settings

settings = get_settings()
client = OpenAI(api_key=settings.OPENAI_API_KEY)


def ask_gpt(prompt: str) -> str:
    """
    Simple wrapper for chat completion.
    """
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful medical assistant. You never give final diagnosis, only insights and suggestions."},
            {"role": "user", "content": prompt},
        ],
    )
    return response.choices[0].message.content
