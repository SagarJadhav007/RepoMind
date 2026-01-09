from google import genai
import os

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def embed_text(text: str) -> list[float]:
    response = client.embeddings.create(
        model="text-embedding-004",
        input=text,
    )
    return response.data[0].embedding