import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


class GeminiLLM:
    def embed(self, text: str) -> list[float]:
        res = genai.embed_content(
            model="models/embedding-001",
            content=text,
            task_type="retrieval_document",
        )
        return res["embedding"]

    def generate(self, prompt: str) -> str:
        model = genai.GenerativeModel("gemini-1.5-pro")
        response = model.generate_content(prompt)
        return response.text
