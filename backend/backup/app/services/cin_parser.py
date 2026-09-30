import re

from app.schemas.cin_schema import (
    InformationsRecto,
    InformationsVerso,
    PersonneExtraite,
)


class CINParser:

    # ============================================================
    # OUTILS GENERAUX
    # ============================================================

    @staticmethod
    def clean_text(text: str) -> str:
        """
        Nettoie le texte OCR sans supprimer les informations utiles.
        """
        text = text.replace("\r", "\n")
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{2,}", "\n", text)

        return text.strip()

    @staticmethod
    def normalize(text: str) -> str:
        """
        Normalisation utilisée uniquement pour comparer les libellés.
        """
        text = text.upper()

        replacements = {
            "À": "A",
            "Â": "A",
            "Ä": "A",
            "É": "E",
            "È": "E",
            "Ê": "E",
            "Ë": "E",
            "Î": "I",
            "Ï": "I",
            "Ô": "O",
            "Ö": "O",
            "Ù": "U",
            "Û": "U",
            "Ü": "U",
            "Ç": "C",
        }

        for old, new in replacements.items():
            text = text.replace(old, new)

        return text

    @staticmethod
    def lines(text: str) -> list[str]:
        """
        Retourne les lignes OCR nettoyées.
        """
        text = CINParser.clean_text(text)

        return [
            line.strip()
            for line in text.split("\n")
            if line.strip()
        ]

    # ============================================================
    # EXTRACTION APRES UN LIBELLE
    # ============================================================

    @staticmethod
    def extract_after_label(
        text: str,
        labels: list[str],
    ) -> str | None:
        """
        Cherche un libellé et récupère la valeur située après celui-ci.

        Exemple :

        ANARANA / Nom : FENONANTENAIKO

        -> FENONANTENAIKO
        """

        lines = CINParser.lines(text)

        normalized_labels = [
            CINParser.normalize(label)
            for label in labels
        ]

        for index, line in enumerate(lines):
            normalized_line = CINParser.normalize(line)

            for label in normalized_labels:

                # Le libellé doit apparaître dans la ligne
                position = normalized_line.find(label)

                if position == -1:
                    continue

                # Récupérer ce qui se trouve après le libellé
                value = line[position + len(label):]

                # Nettoyage des séparateurs OCR
                value = re.sub(
                    r"^[\s:;=\-_/.,]+",
                    "",
                    value,
                ).strip()

                if value:
                    return value

                # Si aucune valeur n'est sur la même ligne,
                # essayer la ligne suivante.
                if index + 1 < len(lines):
                    next_line = lines[index + 1].strip()

                    if next_line:
                        return next_line

        return None

    # ============================================================
    # DATE
    # ============================================================

    @staticmethod
    def extract_date(
        text: str,
        labels: list[str],
    ) -> str | None:
        """
        Extrait une date après un libellé.

        Exemple :

        TERAKA TAMIN'NY / Né(e) le : 18 Janvier 2000

        -> 18 Janvier 2000
        """

        value = CINParser.extract_after_label(
            text,
            labels,
        )

        if not value:
            return None

        months = (
            "janvier|février|fevrier|mars|avril|mai|juin|"
            "juillet|août|aout|septembre|octobre|novembre|décembre|decembre"
        )

        match = re.search(
            rf"\b\d{{1,2}}\s+(?:{months})\s+\d{{4}}\b",
            value,
            flags=re.IGNORECASE,
        )

        if match:
            return match.group(0)

        # Format numérique éventuel : 18/01/2000
        match = re.search(
            r"\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b",
            value,
        )

        if match:
            return match.group(0)

        return value.strip()

    # ============================================================
    # NUMERO CIN
    # ============================================================

    @staticmethod
    def extract_cin_number(text: str) -> str | None:
        """
        Recherche le numéro CIN uniquement après :

        LAHARANA / N
        """

        lines = CINParser.lines(text)

        for index, line in enumerate(lines):
            normalized = CINParser.normalize(line)

            # Plusieurs formes possibles dues à l'OCR
            if (
                "LAHARANA" in normalized
                or "LAHARANA / N" in normalized
            ):
                # Chercher d'abord sur la même ligne
                match = re.search(
                    r"\b\d{7,12}\b",
                    line,
                )

                if match:
                    return match.group(0)

                # Puis sur les lignes suivantes
                for next_index in range(
                    index + 1,
                    min(index + 3, len(lines)),
                ):
                    match = re.search(
                        r"\b\d{7,12}\b",
                        lines[next_index],
                    )

                    if match:
                        return match.group(0)

        return None

    # ============================================================
    # RECTO
    # ============================================================

    @staticmethod
    def extract_front_fields(
        text: str,
    ) -> InformationsRecto:

        nom = CINParser.extract_after_label(
            text,
            [
                "ANARANA / Nom",
                "ANARANA/Nom",
                "ANARANA / NOM",
            ],
        )

        prenoms = CINParser.extract_after_label(
            text,
            [
                "FANAMPIN'ANARANA / Prenoms",
                "FANAMPIN'ANARANA / Prénoms",
                "FANAMPIN ANARANA / Prenoms",
                "FANAMPIN ANARANA",
                "FANAMPIN' ANARANA / Prenoms",
                "FANAMPIN' ANARANA / Prénoms",
            ],
        )

        date_naissance = CINParser.extract_date(
            text,
            [
                "TERAKA TAMIN'NY / Ne(e) le",
                "TERAKA TAMIN'NY / Né(e) le",
                "TERAKA TAMIN NY / Ne(e) le",
            ],
        )

        lieu_naissance = CINParser.extract_after_label(
            text,
            [
                "TAO / a",
                "TAO / à",
                "TAO/A",
                "TOERANA",
                "TOERANA :",
                "TOERANA /",
            ],
        )

        numero_cin = CINParser.extract_cin_number(text)

        sexe = CINParser.extract_after_label(
            text,
            [
                "SEXE / Sex",
                "SEXE/Sexe",
                "SEXE",
            ],
        )

        return InformationsRecto(
            nom=nom,
            prenoms=prenoms,
            dateNaissance=date_naissance,
            lieuNaissance=lieu_naissance,
            numeroCin=numero_cin,
            sexe=sexe,
        )

    # ============================================================
    # VERSO
    # ============================================================

    @staticmethod
    def extract_back_fields(
        text: str,
    ) -> InformationsVerso:

        nom_pere = CINParser.extract_after_label(
            text,
            [
                "RAY NITERAKA / Pere",
                "RAY NITERAKA / Père",
                "RAY NITERAKA/Pere",
                "RAY NITERAKA",
                "RAY :",
                "RAY",
            ],
        )

        nom_mere = CINParser.extract_after_label(
            text,
            [
                "RENY NITERAKA / Mere",
                "RENY NITERAKA / Mère",
                "RENY NITERAKA/Mere",
                "RENY NITERAKA",
                "RENY :",
                "RENY",
            ],
        )

        return InformationsVerso(
            nomPere=nom_pere,
            nomMere=nom_mere,
        )

    # ============================================================
    # PARSE COMPLETE
    # ============================================================

    @staticmethod
    def parse(
        front_text: str,
        back_text: str,
    ) -> PersonneExtraite:

        # IMPORTANT :
        # Le recto est analysé uniquement avec les champs du recto.
        front = CINParser.extract_front_fields(
            front_text
        )

        # Le verso est analysé uniquement avec les champs
        # nomPere et nomMere.
        back = CINParser.extract_back_fields(
            back_text
        )

        return PersonneExtraite(
            nom=front.nom,
            prenoms=front.prenoms,
            dateNaissance=front.dateNaissance,
            lieuNaissance=front.lieuNaissance,
            numeroCin=front.numeroCin,
            sexe=front.sexe,
            nomPere=back.nomPere,
            nomMere=back.nomMere,
        )