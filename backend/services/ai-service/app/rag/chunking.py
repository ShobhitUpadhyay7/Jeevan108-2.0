def chunk_document(doc: dict, max_chunk_size: int = 600) -> list[dict]:
    """Split a document into chunks, preserving metadata for citations."""
    paragraphs = [p.strip() for p in doc["body"].split("\n") if p.strip()]

    chunks = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) + 1 <= max_chunk_size:
            current = f"{current}\n{para}".strip()
        else:
            if current:
                chunks.append(current)
            current = para
    if current:
        chunks.append(current)
    if not chunks:
        chunks = [doc["body"]]

    return [
        {
            "id": f"{doc['docId']}_chunk{i}",
            "text": chunk,
            "metadata": {
                "docId": doc["docId"],
                "title": doc["title"],
                "collection": doc["collection"],
            },
        }
        for i, chunk in enumerate(chunks)
    ]