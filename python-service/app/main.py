from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import export, health, analyze
from .services.longcat import longcat
from .utils.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    init_db()
    yield
    # shutdown
    await longcat.close()


app = FastAPI(
    title="Pioneer Code Quality Analyzer",
    description="Python微服务，通过LongCat API分析TypeScript代码质量",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(export.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.SERVICE_HOST,
        port=settings.SERVICE_PORT,
        reload=True,
    )
