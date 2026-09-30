from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)

from app.api.dependancy import get_current_agent
from app.models.agent import Agent
from app.schemas.ocr import OCRResult
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
    recto: UploadFile = File(...),
    verso: UploadFile = File(...),
    current_agent: Agent = Depends(
        get_current_agent
    ),
):

    recto_bytes = await read_image(recto)
    verso_bytes = await read_image(verso)

    try:

        result = await ocr_service.process(
            recto_bytes=recto_bytes,
            verso_bytes=verso_bytes,
            recto_mime_type=recto.content_type,
            verso_mime_type=verso.content_type,
        )

        return OCRResult(
            success=True,
            data=result,
            message="OCR effectué avec succès",
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Erreur OCR : {str(error)}",
        )