from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from fastapi import HTTPException, status
from pwdlib import PasswordHash

from app.core.config import settings


password_hash = PasswordHash.recommended()

# Nom du cookie contenant le JWT
ACCESS_TOKEN_COOKIE = "access_token"


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    password: str,
    hashed_password: str,
) -> bool:
    return password_hash.verify(
        password,
        hashed_password,
    )


def create_access_token(
    user_id: UUID,
    role: str,
    token_type: str,
    expires_minutes: int | None = None,
) -> str:

    minutes = (
        expires_minutes
        or settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=minutes
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "type": token_type,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expiré",
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
        )