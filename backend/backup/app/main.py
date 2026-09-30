from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.services.ocr_service import OCRService
from app.services.cin_parser import CINParser
from app.schemas.cin_schema import CINOCRResponse


app = FastAPI(
    title="Malagasy OCR API",
    description="API OCR pour les cartes d'identité malgaches",
    version="1.0.0",
)

# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Malagasy OCR API is running"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health_check():
    return {
        "status": "ok"
    }


# ============================================================
# OCR CIN - RECTO + VERSO
# ============================================================

@app.post(
    "/api/ocr/cin",
    response_model=CINOCRResponse
)
async def scan_cin(
    front: UploadFile = File(...),
    back: UploadFile = File(...)
):
    # --------------------------------------------------------
    # Vérification des fichiers
    # --------------------------------------------------------

    if not front.filename:
        raise HTTPException(
            status_code=400,
            detail="L'image du recto est obligatoire."
        )

    if not back.filename:
        raise HTTPException(
            status_code=400,
            detail="L'image du verso est obligatoire."
        )

    # --------------------------------------------------------
    # Vérification du type de fichier
    # --------------------------------------------------------

    if (
        not front.content_type
        or not front.content_type.startswith("image/")
    ):
        raise HTTPException(
            status_code=400,
            detail="Le fichier recto doit être une image."
        )

    if (
        not back.content_type
        or not back.content_type.startswith("image/")
    ):
        raise HTTPException(
            status_code=400,
            detail="Le fichier verso doit être une image."
        )

    # --------------------------------------------------------
    # Lecture des images
    # --------------------------------------------------------

    front_bytes = await front.read()
    back_bytes = await back.read()

    if not front_bytes:
        raise HTTPException(
            status_code=400,
            detail="L'image du recto est vide."
        )

    if not back_bytes:
        raise HTTPException(
            status_code=400,
            detail="L'image du verso est vide."
        )

    # --------------------------------------------------------
    # OCR DU RECTO
    # --------------------------------------------------------

    try:
        front_text = OCRService.extract_text_from_bytes(
            front_bytes
        )
    except Exception as error:
        raise HTTPException(
            status_code=422,
            detail=f"Erreur OCR du recto : {str(error)}"
        )

    # --------------------------------------------------------
    # OCR DU VERSO
    # --------------------------------------------------------

    try:
        back_text = OCRService.extract_text_from_bytes(
            back_bytes
        )
    except Exception as error:
        raise HTTPException(
            status_code=422,
            detail=f"Erreur OCR du verso : {str(error)}"
        )

    # --------------------------------------------------------
    # EXTRACTION STRUCTURÉE
    # --------------------------------------------------------

    try:
        person = CINParser.parse(
            front_text=front_text,
            back_text=back_text
        )

    except Exception as error:
        raise HTTPException(
            status_code=422,
            detail=f"Erreur lors de l'extraction des informations : {str(error)}"
        )

    # --------------------------------------------------------
    # WARNINGS
    # --------------------------------------------------------

    warnings = []

    if not person.nom:
        warnings.append(
            "Le nom n'a pas pu être reconnu sur le recto."
        )

    if not person.prenoms:
        warnings.append(
            "Les prénoms n'ont pas pu être reconnus sur le recto."
        )

    if not person.dateNaissance:
        warnings.append(
            "La date de naissance n'a pas pu être reconnue."
        )

    if not person.lieuNaissance:
        warnings.append(
            "Le lieu de naissance n'a pas pu être reconnu."
        )

    if not person.numeroCin:
        warnings.append(
            "Le numéro CIN n'a pas pu être reconnu."
        )

    if not person.nomPere:
        warnings.append(
            "Le nom du père n'a pas pu être reconnu sur le verso."
        )

    if not person.nomMere:
        warnings.append(
            "Le nom de la mère n'a pas pu être reconnu sur le verso."
        )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return CINOCRResponse(
        success=True,
        frontText=front_text,
        backText=back_text,
        person=person,
        warnings=warnings
    )