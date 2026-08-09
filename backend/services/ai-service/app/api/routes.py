import uuid
import json
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.rag.pipeline import answer_query, answer_query_stream

router = APIRouter()

class QueryRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    sessionId: str | None = None


@router.post("/query")
async def ai_query(req: QueryRequest, request: Request):
    try:
        result = await answer_query(req.text)
        return {
            "data": {
                "queryId": f"aiq_{uuid.uuid4().hex[:8]}",
                **result,
            },
            "meta": {"requestId": request.headers.get("x-request-id", str(uuid.uuid4()))},
            "error": None,
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI_SERVICE_DEGRADED: {e}")


@router.post("/query/stream")
async def ai_query_stream(req: QueryRequest, request: Request):
    """Stream the AI response token by token."""
    
    async def event_generator():
        try:
            # Send query ID first
            query_id = f"aiq_{uuid.uuid4().hex[:8]}"
            yield f"data: {json.dumps({'type': 'queryId', 'queryId': query_id})}\n\n"
            
            # Stream the answer
            async for chunk in answer_query_stream(req.text):
                yield f"data: {json.dumps(chunk)}\n\n"
                
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )