import httpx
from app.config import settings


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of texts using Ollama's embedding API."""
    embeddings = []
    async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
        for text in texts:
            resp = await client.post(
                f"{settings.llm_base_url}/api/embeddings",
                json={"model": settings.embedding_model, "prompt": text},
            )
            resp.raise_for_status()
            embeddings.append(resp.json()["embedding"])
    return embeddings


async def embed_text(text: str) -> list[float]:
    """Embed a single text using Ollama's embedding API."""
    results = await embed_texts([text])
    return results[0]