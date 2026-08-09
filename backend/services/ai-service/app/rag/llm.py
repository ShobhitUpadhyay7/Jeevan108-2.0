import httpx
import json
from app.config import settings

SYSTEM_PROMPT = (
    "You are a helpful medical information assistant for Jeevan108, a home healthcare platform. "
    "Answer questions using ONLY the provided reference context.\n\n"
    
    "CONTENT RULES:\n"
    "1. Base your answer strictly on the provided context. Do not invent or assume information.\n"
    "2. If the context does not contain enough information, respond exactly: "
    "\"I don't have verified information on this — please consult a doctor or call emergency services (108).\"\n"
    "3. Never provide medical diagnoses or medication dosages.\n"
    "4. For emergencies, advise calling emergency services (108 in India) immediately.\n\n"
    
    "FORMATTING RULES:\n"
    "5. Write in plain text only. Do NOT use markdown (no **bold**, no *italics*, no # headers).\n"
    "6. Use short paragraphs separated by blank lines.\n"
    "7. If you need to list steps, use simple numbered format like '1. Do this' or '2. Do that'.\n"
    "8. Keep answers concise — maximum 150 words unless the question specifically asks for detail.\n"
    "9. End with source references like [1] or [1][2] on a separate line.\n"
    "10. Use plain, simple language anyone can understand (avoid medical jargon).\n"
)


async def generate_answer(context_blocks: list[dict], question: str) -> str:
    context_text = "\n\n".join(
        f"[{i + 1}] {block['text']} (Source: {block['title']})"
        for i, block in enumerate(context_blocks)
    )
    user_prompt = (
        f"Reference Context:\n{context_text}\n\n"
        f"Question: {question}\n\n"
        "Answer the question using only the context above. Cite sources with [1], [2], etc."
    )

    async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
        resp = await client.post(
            f"{settings.llm_base_url}/api/chat",
            json={
                "model": settings.llm_model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": False,
            },
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"]

async def generate_answer_stream(context_blocks: list[dict], question: str):
    """Stream the LLM response token by token."""
    context_text = "\n\n".join(
        f"[{i + 1}] {block['text']} (Source: {block['title']})"
        for i, block in enumerate(context_blocks)
    )
    user_prompt = (
        f"Reference Context:\n{context_text}\n\n"
        f"Question: {question}\n\n"
        "Answer the question using only the context above. Cite sources with [1], [2], etc."
    )

    async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
        async with client.stream(
            "POST",
            f"{settings.llm_base_url}/api/chat",
            json={
                "model": settings.llm_model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": True,  # Enable streaming
            },
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line:
                    data = json.loads(line)
                    if "message" in data and "content" in data["message"]:
                        token = data["message"]["content"]
                        if token:  # Skip empty tokens
                            yield token