from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.routes import health
from app.api.v1 import assets, categories, locations, dashboard, copilot, reports, procurement, seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.app_name,
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

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(assets.router, prefix="/api/v1/assets", tags=["assets"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["categories"])
app.include_router(locations.router, prefix="/api/v1/locations", tags=["locations"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(copilot.router, prefix="/api/v1/copilot", tags=["copilot"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])
app.include_router(procurement.router, prefix="/api/v1/procurement", tags=["procurement"])
app.include_router(seed.router, prefix="/api/v1/seed", tags=["seed"])
