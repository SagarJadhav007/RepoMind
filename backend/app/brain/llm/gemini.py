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
        list_my_models()
        response = client.models.generate_content(
            model="gemini-1.5-flash-latest", 
            contents=prompt,
        )
        return response.text
    
    def list_my_models():
        for model in client.models.list():
            print(f"Model Name: {model.name} - Supported Actions: {model.supported_actions}")
