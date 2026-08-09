import chromadb
from app.config import settings

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    return _client


def get_collection():
    return _get_client().get_or_create_collection(name=settings.collection_name)


def collection_count() -> int:
    return get_collection().count()


def add_documents(ids, documents, embeddings, metadatas):
    get_collection().add(ids=ids, documents=documents, embeddings=embeddings, metadatas=metadatas)


def query_collection(query_embedding: list[float], top_k: int):
    return get_collection().query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )