from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    service_name: str = "ai-service"

    # --- LLM (swappable via .env) ---
    llm_base_url: str = "http://host.docker.internal:11434"
    llm_model: str = "qwen3:1.7b"
    llm_timeout_seconds: int = 120

    # --- Embeddings (swappable via .env) ---
    embedding_model: str = "nomic-embed-text"

    # --- RAG tuning ---
    rag_top_k: int = 4

    # --- ChromaDB ---
    chroma_persist_dir: str = "/app/chroma_data"
    collection_name: str = "jeevan108_kb"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()