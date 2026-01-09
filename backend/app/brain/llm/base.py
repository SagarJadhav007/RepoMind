from abc import ABC, abstractmethod

class LLMProvider(ABC):

    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        pass

    @abstractmethod
    async def generate(self, prompt: str) -> dict:
        pass
