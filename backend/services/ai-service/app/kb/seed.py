from app.kb.documents import KB_DOCUMENTS
from app.rag.chunking import chunk_document
from app.rag.embeddings import embed_texts
from app.rag.vectorstore import add_documents, collection_count


async def seed_if_empty():
    """Seed the knowledge base on startup if the collection is empty."""
    if collection_count() > 0:
        print("[Seed] Knowledge base already seeded, skipping.")
        return

    try:
        print(f"[Seed] Seeding knowledge base with {len(KB_DOCUMENTS)} documents...")

        all_chunks = []
        for doc in KB_DOCUMENTS:
            all_chunks.extend(chunk_document(doc))

        texts = [c["text"] for c in all_chunks]
        ids = [c["id"] for c in all_chunks]
        metadatas = [c["metadata"] for c in all_chunks]

        embeddings = await embed_texts(texts)

        add_documents(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)
        print(f"[Seed] Done. Stored {len(all_chunks)} chunks in ChromaDB.")
    except Exception as e:
        # Don't crash the service if Ollama is temporarily unavailable.
        print(f"[Seed] ERROR: failed to seed KB: {e}")
        print("[Seed] Restart the service once Ollama is reachable to retry.")