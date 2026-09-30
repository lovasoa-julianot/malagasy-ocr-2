
from app.services.cin_parser import CINParser


front_text = """
REPOBLIKAN'I MADAGASIKARA
KARA-PANONDROM-PIRENENA

ANARANA / Nom : FENONANTENAIKO
FANAMPIN' ANARANA / Prénoms : LOVASOA Gilbert Julianot
TERAKA TAMIN'NY / Né(e) le : 18 janvier 2000
TOERANA : BEZAHA
LAHARANA N° : 501111028691
"""


back_text = """
RAY : FENONANTENAIKO GILBERT RODRIGUE
RENY : RASOAVAHINY CHRISTALAINNE
"""


result = CINParser.parse(
    front_text,
    back_text
)

print(result.model_dump())