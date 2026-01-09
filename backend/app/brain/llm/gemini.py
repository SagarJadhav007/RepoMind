import os
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


class GeminiLLM:
    def embed(self, text: str) -> list[float]:
        result = client.models.embed_content(
            model="text-embedding-004",
            contents=text,
        )
        return result.embeddings[0].values

    def generate(self, prompt: str) -> str:
        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=prompt,
        )
        return response.text
