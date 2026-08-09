from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import router
from app.kb.seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed the KB on startup if it's empty
    await seed_if_empty()
    yield


app = FastAPI(title="Jeevan108 AI Knowledge Service", lifespan=lifespan)
app.include_router(router,prefix="/api/v1/ai")


@app.get("/health")
async def health():
    return {"data": {"status": "ok", "service": "ai-service"}, "error": None}