from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.agent import Agent


def generate_agent_matricule(db: Session) -> str:
    year = datetime.now().year

    prefix = f"AGT-{year}-"

    agents = db.scalars(
        select(Agent.matricule)
        .where(Agent.matricule.like(f"{prefix}%"))
    ).all()

    numbers = []

    for matricule in agents:
        try:
            numbers.append(
                int(matricule.split("-")[-1])
            )
        except ValueError:
            continue

    next_number = max(numbers, default=0) + 1

    return f"{prefix}{next_number:06d}"