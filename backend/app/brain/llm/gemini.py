import os
from google import genai

# Initialize client outside the class for efficiency
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class GeminiLLM:
    def embed(self, text: str) -> list[float]:
        result = client.models.embed_content(
            model="text-embedding-004",
            contents=text,
        )
        return result.embeddings[0].values

    def generate(self, prompt: str) -> str:
        # Trigger the list so you can see valid names in your Render logs
        self.list_my_models()

        # TRY THIS: Use the short slug without 'models/'
        # Use 'gemini-1.5-flash' (standard) or 'gemini-2.0-flash' (latest)
        response = client.models.generate_content(
            model="gemini-1.5-flash", 
            contents=prompt,
        )
        return response.text
    
    # FIXED: Added 'self' parameter
    def list_my_models(self):
        print("--- STARTING MODEL LIST ---")
        try:
            for m in client.models.list():
                # This prints to your terminal/Render logs
                print(f"DEBUG: Found Model -> {m.name}")
        except Exception as e:
            print(f"DEBUG: Failed to list models: {e}")
        print("--- END MODEL LIST ---")