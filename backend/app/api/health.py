from fastapi import APIRouter

from sqlalchemy import text

from app.db.database import SessionLocal


router = APIRouter(
    prefix="/api",
    tags=["Health"]
)


@router.get("/health")
def health_check():

    database_status = "ok"

    try:
        db = SessionLocal()

        db.execute(text("SELECT 1"))

        db.close()

    except Exception:
        database_status = "error"

    return {
        "status": "ok",
        "database": database_status
    }