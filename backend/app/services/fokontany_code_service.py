"""
Génération des codes Fokontany.

Norme appliquée : ``FKT-<lettre du district>-<7 chiffres>``

Exemple : le Fokontany « Ambatobeeni », situé dans le
district AMBATO BOENI, reçoit le code ``FKT-A-0000042``
où ``A`` est la première lettre du district et ``42`` la
séquence globale des Fokontany.

La séquence est gérée par PostgreSQL : deux inscriptions
simultanées ne peuvent pas obtenir le même suffixe, ce que
ne garantit pas une lecture du maximum en base.
"""

import re
import unicodedata

from sqlalchemy import text
from sqlalchemy.orm import Session


CODE_PREFIX = "FKT"
CODE_SEQUENCE_NAME = "fokontany_code_seq"
CODE_SUFFIX_LENGTH = 7

# Nombre d'essais de génération avant abandon. La séquence
# rend une collision quasi impossible ; cette boucle couvre
# les saisies manuelles antérieures à l'automatisation.
MAX_ATTEMPTS = 50

CODE_PATTERN = re.compile(
    rf"^{CODE_PREFIX}-(?P<lettre>[A-Z])-"
    rf"(?P<suffixe>[0-9]{{{CODE_SUFFIX_LENGTH}}})$"
)

# Lettre de repli lorsque le district ne commence pas par
# une lettre ASCII (district vide, valeur non alphabétique).
LETTRE_REPLI = "X"


def lettre_depuis_district(district: str | None) -> str:
    """
    Première lettre ASCII du district, en majuscule.

    Les accents et cédilles sont retirés : « ANALAMANGA »
    comme « Antananarivo » produisent une lettre exploitable
    et le code reste lisible.
    """

    if not district:
        return LETTRE_REPLI

    normalise = unicodedata.normalize(
        "NFKD",
        district.strip().upper(),
    )

    for caractere in normalise:
        if "A" <= caractere <= "Z":
            return caractere

    return LETTRE_REPLI


def formater_code(district: str | None, numero: int) -> str:
    """
    Assemble le code à partir du district et du numéro de
    séquence.
    """

    return (
        f"{CODE_PREFIX}-"
        f"{lettre_depuis_district(district)}-"
        f"{numero:0{CODE_SUFFIX_LENGTH}d}"
    )


def code_deja_attribue(db: Session, code: str) -> bool:
    """
    Un code est considéré comme déjà pris s'il est porté par
    un Fokontany existant ou par une demande d'inscription en
    attente d'approbation.
    """

    dans_fokontany = db.scalar(
        text("SELECT 1 FROM fokontany WHERE code = :code LIMIT 1"),
        {"code": code},
    )

    if dans_fokontany:
        return True

    dans_demande = db.scalar(
        text(
            "SELECT 1 FROM chef_fokontany_requests "
            "WHERE code_fokontany = :code "
            "AND statut = 'EN_ATTENTE' LIMIT 1"
        ),
        {"code": code},
    )

    return bool(dans_demande)


def generer_code_fokontany(
    db: Session,
    district: str | None,
) -> str:
    """
    Attribue le prochain code disponible.

    Le numéro provient de la séquence PostgreSQL, ce qui rend
    l'attribution atomique. Les codes déjà portés en base sont
    ignorés plutôt que de faire échouer l'inscription : la
    génération reste utilisable sur un terrain où des saisies
    manuelles coexistent avec l'attribution automatique.
    """

    lettre = lettre_depuis_district(district)

    for _ in range(MAX_ATTEMPTS):
        numero = db.scalar(
            text(f"SELECT nextval('{CODE_SEQUENCE_NAME}')")
        )

        code = (
            f"{CODE_PREFIX}-{lettre}-"
            f"{int(numero):0{CODE_SUFFIX_LENGTH}d}"
        )

        if not code_deja_attribue(db, code):
            return code

    raise RuntimeError(
        "Impossible d'attribuer un code Fokontany unique "
        f"après {MAX_ATTEMPTS} tentatives."
    )


def est_code_normalise(code: str | None) -> bool:
    """
    Indique si un code respecte la norme officielle.

    Permet de distinguer les codes attribués automatiquement
    des saisies historiques.
    """

    if not code:
        return False

    return bool(CODE_PATTERN.match(code.strip().upper()))


__all__ = [
    "CODE_PATTERN",
    "CODE_PREFIX",
    "CODE_SUFFIX_LENGTH",
    "code_deja_attribue",
    "est_code_normalise",
    "formater_code",
    "generer_code_fokontany",
    "lettre_depuis_district",
]
