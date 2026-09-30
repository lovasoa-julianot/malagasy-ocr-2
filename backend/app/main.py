from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.admin_fokontany import router as admin_fokontany_router
from app.api.agent_access import router as agent_access_router
from app.api.ocr import router as ocr_router
from app.api.recensement import router as recensement_router
from app.api.agent_dashboard import router as agent_dashboard_router
from app.api.verification import router as verification_router
from app.api.chef_fokontany import router as chef_fokontany_router
from app.api.chef_portal import router as chef_portal_router
from app.api.admin import router as admin_router


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "Backend API pour le système de recensement "
        "et d'OCR de cartes nationales d'identité malgaches."
    ),
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(health_router)
app.include_router(auth_router)
app.include_router(admin_fokontany_router)
app.include_router(agent_access_router)
app.include_router(ocr_router)
app.include_router(recensement_router)
app.include_router(agent_dashboard_router)
app.include_router(verification_router)
app.include_router(chef_fokontany_router)
app.include_router(chef_portal_router)
app.include_router(admin_router)

@app.get("/")
def root():
    return {
        "message": "OCR CIN Madagascar API",
        "status": "running",
        "version": "1.0.0",
    }