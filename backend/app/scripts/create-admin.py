from sqlalchemy import select

from app.db.database import SessionLocal
from app.models.utilisateur import Utilisateur
from app.core.security import hash_password


email = "admin@ocr-cin.mg"
password = "Admin@2026"

db = SessionLocal()

try:
    existing = db.scalar(
        select(Utilisateur).where(
            Utilisateur.email == email
        )
    )

    if existing:
        print("L'administrateur existe déjà.")
    else:
        admin = Utilisateur(
            email=email,
            password_hash=hash_password(password),
            nom="Administrateur",
            prenoms="Système",
            role="ADMIN",
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print("Administrateur créé avec succès.")

finally:
    db.close()