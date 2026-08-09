import re
import httpx

from app.config import settings
from app.rag.embeddings import embed_text
from app.rag.vectorstore import query_collection
from app.rag.llm import generate_answer, generate_answer_stream

FALLBACK_ANSWER = (
    "I don't have verified information on this — please consult a doctor or call "
    "emergency services (108)."
)

EMERGENCY_KEYWORDS = [
    "snake bite", "snakebite", "snake", "choking", "chest pain", "heart attack",
    "stroke", "seizure", "unconscious", "not breathing", "bleeding", "burn",
    "poison", "overdose", "emergency", "ambulance", "fracture", "drowning",
    "bitten", "bite", "attack",
]


def is_emergency_query(text: str) -> bool:
    lowered = text.lower()
    return any(kw in lowered for kw in EMERGENCY_KEYWORDS)


def strip_markdown(text: str) -> str:
    """Remove markdown formatting since small LLMs can't reliably avoid it."""
    # Remove bold: **text** or __text__
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"__(.+?)__", r"\1", text)
    # Remove italics: *text* or _text_ (but preserve bullet points)
    text = re.sub(r"(?<!\*)\*([^*\n]+?)\*(?!\*)", r"\1", text)
    text = re.sub(r"(?<!_)_([^_\n]+?)_(?!_)", r"\1", text)
    # Remove horizontal rules: --- or ***
    text = re.sub(r"^[-*]{3,}\s*$", "", text, flags=re.MULTILINE)
    # Remove headers: # Text
    text = re.sub(r"^#+\s+", "", text, flags=re.MULTILINE)
    # Clean up extra blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


async def answer_query(question: str) -> dict:
    is_emergency = is_emergency_query(question)

    # 1. Embed the question
    query_embedding = await embed_text(question)

    # 2. Retrieve top-k relevant chunks
    results = query_collection(query_embedding, settings.rag_top_k)

    context_blocks = []
    citations = []
    seen_docs = set()

    if results and results.get("documents") and results["documents"][0]:
        for doc_text, metadata in zip(results["documents"][0], results["metadatas"][0]):
            context_blocks.append({"text": doc_text, "title": metadata.get("title", "Unknown")})
            doc_id = metadata.get("docId", "")
            if doc_id and doc_id not in seen_docs:
                seen_docs.add(doc_id)
                citations.append({
                    "id": len(citations) + 1,
                    "title": metadata.get("title", "Unknown"),
                    "collection": metadata.get("collection", ""),
                    "docId": doc_id,
                })

    # 3. Generate the grounded answer
    if not context_blocks:
        answer = FALLBACK_ANSWER
    else:
        try:
            answer = await generate_answer(context_blocks, question)
        except httpx.HTTPError:
            answer = FALLBACK_ANSWER

    # 4. Post-process: strip markdown (defensive against small LLMs)
    answer = strip_markdown(answer)

    # 5. Build ADD §10.1 compliant response
    response = {
        "answer": answer,
        "citations": citations,
        "isEmergency": is_emergency,
        "disclaimer": (
            "This is general guidance, not a medical diagnosis. "
            "For emergencies, call 108 immediately."
        ),
    }

    # ADD §10.1: Emergency responses MUST include emergencyAction
    if is_emergency:
        response["classification"] = "emergency"
        response["emergencyAction"] = {
            "label": "Call Ambulance",
            "tel": "108",
        }
    else:
        # Classify as informational or staffing_recommendation based on keywords
        staffing_keywords = ["hire", "nurse", "caretaker", "professional", "booking", "which", "recommend"]
        if any(kw in question.lower() for kw in staffing_keywords):
            response["classification"] = "staffing_recommendation"
        else:
            response["classification"] = "informational"

    return response

async def answer_query_stream(question: str):
    """Stream the answer token by token."""
    # 1. Embed the question
    query_embedding = await embed_text(question)

    # 2. Retrieve top-k relevant chunks
    results = query_collection(query_embedding, settings.rag_top_k)

    context_blocks = []
    citations = []
    seen_docs = set()

    if results and results.get("documents") and results["documents"][0]:
        for doc_text, metadata in zip(results["documents"][0], results["metadatas"][0]):
            context_blocks.append({"text": doc_text, "title": metadata.get("title", "Unknown")})
            doc_id = metadata.get("docId", "")
            if doc_id and doc_id not in seen_docs:
                seen_docs.add(doc_id)
                citations.append({
                    "id": len(citations) + 1,
                    "title": metadata.get("title", "Unknown"),
                    "collection": metadata.get("collection", ""),
                    "docId": doc_id,
                })

    # 3. Yield metadata first
    yield {
        "type": "metadata",
        "citations": citations,
        "isEmergency": is_emergency_query(question),
        "disclaimer": (
            "This is general guidance, not a medical diagnosis. "
            "For emergencies, call 108 immediately."
        ),
    }

    # 4. Stream the answer
    if not context_blocks:
        yield {"type": "token", "content": FALLBACK_ANSWER}
    else:
        try:
            async for token in generate_answer_stream(context_blocks, question):
                yield {"type": "token", "content": token}
        except httpx.HTTPError:
            yield {"type": "token", "content": FALLBACK_ANSWER}

    # 5. Signal completion
    yield {"type": "done"}