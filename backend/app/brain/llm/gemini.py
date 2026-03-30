import os
from google import genai

# Initialize the client globally
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class GeminiLLM:
    def embed(self, text: str) -> list[float]:
        # text-embedding-004 is correct and was in your debug list
        result = client.models.embed_content(
            model="text-embedding-004",
            contents=text,
        )
        return result.embeddings[0].values

    def generate(self, prompt: str) -> str:
        # Use the alias you found in your logs
        response = client.models.generate_content(
            model="gemini-flash-latest", 
            contents=prompt,
        )
        return response.text