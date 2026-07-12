"""
FastAPI application factory.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup: Create SQLite tables and seed data if not present
    from app.database.session import engine
    from app.models.base import Base
    from app.database.seed import seed_db
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    try:
        await seed_db()
    except Exception as e:
        print(f"Startup seeding error: {e}")
        
    yield
    # Shutdown: cleanup resources


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-Powered ESG Management Platform",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Logging Middleware (Disabled to allow real-time StreamingResponse chunks)
    # from app.middleware.middleware import LoggingMiddleware
    # app.add_middleware(LoggingMiddleware)

    # Register API routers
    from app.api.auth import router as auth_router
    from app.api.admin import router as admin_router
    from app.api.environmental import router as environmental_router
    from app.api.social import router as social_router
    from app.api.governance import router as governance_router
    from app.api.gamification import router as gamification_router
    from app.api.dashboard import router as dashboard_router
    from app.api.reports import router as reports_router
    from app.api.notifications import router as notifications_router
    from app.api.ai_copilot import router as ai_router
    from app.api.upload import router as upload_router

    prefix = settings.API_PREFIX
    app.include_router(auth_router, prefix=f"{prefix}/auth", tags=["Authentication"])
    app.include_router(admin_router, prefix=f"{prefix}/admin", tags=["Admin"])
    app.include_router(environmental_router, prefix=f"{prefix}/environmental", tags=["Environmental"])
    app.include_router(social_router, prefix=f"{prefix}/social", tags=["Social"])
    app.include_router(governance_router, prefix=f"{prefix}/governance", tags=["Governance"])
    app.include_router(gamification_router, prefix=f"{prefix}/gamification", tags=["Gamification"])
    app.include_router(dashboard_router, prefix=f"{prefix}/dashboard", tags=["Dashboard"])
    app.include_router(reports_router, prefix=f"{prefix}/reports", tags=["Reports"])
    app.include_router(notifications_router, prefix=f"{prefix}/notifications", tags=["Notifications"])
    app.include_router(ai_router, prefix=f"{prefix}/ai", tags=["AI Copilot"])
    app.include_router(upload_router, prefix=f"{prefix}/upload", tags=["File Upload"])

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}

    return app


app = create_app()
