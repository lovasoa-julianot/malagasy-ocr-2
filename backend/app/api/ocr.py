import time

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Request,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.api.dependancy import get_current_agent
from app.db.database import get_db
from app.models.agent import Agent
from app.schemas.ocr import OCRResult
from app.services.audit_service import (
    OUTCOME_FAILURE,
    OUTCOME_SUCCESS,
    log_action,
)
from app.services.ocr_service import ocr_service


router = APIRouter(
    prefix="/api/ocr",
    tags=["OCR"],
)


MAX_FILE_SIZE = 15 * 1024 * 1024


async def read_image(
    file: UploadFile,
) -> bytes:

    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="Type de fichier manquant",
        )

    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Le fichier doit être une image",
        )

    data = await file.read()

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image trop volumineuse. Maximum 15 MB.",
        )

    if not data:
        raise HTTPException(
            status_code=400,
            detail="Image vide",
        )

    return data


@router.post(
    "/cin",
    response_model=OCRResult,
)
async def ocr_cin(
    request: Request,
    recto: UploadFile = File(...),
    verso: UploadFile = File(...),
    current_agent: Agent = Depends(
        get_current_agent
    ),
    db: Session = Depends(get_db),
):

    recto_bytes = await read_image(recto)
    verso_bytes = await read_image(verso)

    started_at = time.perf_counter()

    try:

        result = await ocr_service.process(
            recto_bytes=recto_bytes,
            verso_bytes=verso_bytes,
            recto_mime_type=recto.content_type,
            verso_mime_type=verso.content_type,
        )

        duration_ms = int(
            (time.perf_counter() - started_at) * 1000
        )

        log_action(
            db,
            action="OCR",
            resource_type="OCR",
            agent_id=current_agent.id,
            fokontany_id=current_agent.fokontany_id,
            outcome=OUTCOME_SUCCESS,
            duration_ms=duration_ms,
            details=(
                f"Lecture OCR de la CIN par l'agent "
                f"{current_agent.matricule} "
                f"{current_agent.nom} {current_agent.prenoms} "
                f"terminée en {duration_ms} ms."
            ),
            request=request,
        )

        db.commit()

        return OCRResult(
            success=True,
            data=result,
            message="OCR effectué avec succès",
        )

    except Exception as error:

        duration_ms = int(
            (time.perf_counter() - started_at) * 1000
        )

        log_action(
            db,
            action="OCR",
            resource_type="OCR",
            agent_id=current_agent.id,
            fokontany_id=current_agent.fokontany_id,
            outcome=OUTCOME_FAILURE,
            duration_ms=duration_ms,
            details=(
                f"Échec de la lecture OCR pour l'agent "
                f"{current_agent.matricule} après "
                f"{duration_ms} ms : {str(error)[:200]}"
            ),
            request=request,
        )

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Erreur OCR : {str(error)}",
        )