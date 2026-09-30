from io import BytesIO
import cv2
import numpy as np
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter


class OCRService:

    @staticmethod
    def prepare_variants(image: Image.Image) -> list[Image.Image]:
        """
        Génère plusieurs versions optimisées de l'image pour l'OCR de CIN.
        """
        image_rgb = image.convert("RGB")
        image_np = np.array(image_rgb)

        variants = []

        # 1. Image originale
        variants.append(image_rgb)

        # 2. Conversion en niveaux de gris
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        variants.append(Image.fromarray(gray))

        # 3. Agrandissement 2x avec interpolation cubique
        enlarged = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        variants.append(Image.fromarray(enlarged))

        # 4. CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        clahe_img = clahe.apply(gray)
        variants.append(Image.fromarray(clahe_img))

        # 5. CLAHE + agrandissement
        clahe_enlarged = cv2.resize(clahe_img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        variants.append(Image.fromarray(clahe_enlarged))

        # 6. Seuillage adaptatif (adaptive threshold) - très efficace pour texte sur fond
        adaptive_thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        variants.append(Image.fromarray(adaptive_thresh))

        # 7. Seuillage Otsu
        _, otsu_thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        variants.append(Image.fromarray(otsu_thresh))

        # 8. Amélioration PIL : netteté + contraste
        pil_enhanced = OCRService._enhance_with_pil(image_rgb)
        variants.append(pil_enhanced)

        return variants

    @staticmethod
    def _deskew(image: np.ndarray) -> np.ndarray:
        """
        Redresse l'image en détectant l'angle de rotation du texte.
        """
        # Seuillage pour détecter les contours
        _, thresh = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        # Trouver les contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return image

        # Filtrer les contours trop petits ou trop grands
        angles = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if 100 < area < image.shape[0] * image.shape[1] * 0.5:
                rect = cv2.minAreaRect(contour)
                angle = rect[-1]
                if angle < -45:
                    angle += 90
                if abs(angle) < 45:  # Ignorer les angles extrêmes
                    angles.append(angle)

        if not angles:
            return image

        # Médiane des angles pour robustesse
        median_angle = np.median(angles)

        # Ne corriger que si l'angle est significatif
        if abs(median_angle) > 0.5:
            (h, w) = image.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
            rotated = cv2.warpAffine(
                image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
            )
            return rotated

        return image

    @staticmethod
    def _enhance_with_pil(image: Image.Image) -> Image.Image:
        """
        Amélioration avec PIL : netteté, contraste, luminosité.
        """
        # Netteté
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(2.0)

        # Contraste
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.5)

        # Légère amélioration de la luminosité
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(1.1)

        return image

    @staticmethod
    def extract_text(image: Image.Image) -> str:
        """
        Lance plusieurs OCR avec différentes configurations et retourne le meilleur résultat.
        """
        variants = OCRService.prepare_variants(image)

        best_text = ""
        best_score = 0

        # Configurations Tesseract optimisées pour documents d'identité
        configs = [
            # PSM 6: Bloc de texte uniforme (par défaut pour documents)
            "--oem 3 --psm 6 -l fra+eng",
            # PSM 4: Colonne de texte unique
            "--oem 3 --psm 4 -l fra+eng",
            # PSM 3: Auto (détection automatique)
            "--oem 3 --psm 3 -l fra+eng",
            # Français seul
            "--oem 3 --psm 6 -l fra",
        ]

        for variant in variants:
            # Convertir en RGB si nécessaire pour Tesseract
            if variant.mode not in ("RGB", "L"):
                variant = variant.convert("RGB")

            for config in configs:
                try:
                    text = pytesseract.image_to_string(variant, config=config).strip()
                    score = OCRService.score_text(text)

                    if score > best_score:
                        best_score = score
                        best_text = text
                except Exception:
                    continue

        return best_text

    @staticmethod
    def score_text(text: str) -> int:
        """
        Évalue la qualité d'un résultat OCR pour une CIN malgache.
        """
        if not text or len(text.strip()) < 10:
            return 0

        normalized = text.upper()
        score = 0

        # Mots-clés très spécifiques à la CIN malgache (poids élevé)
        critical_keywords = [
            "MADAGASIKARA",  # 50 pts
            "KARA-PANONDROM",  # 50 pts
            "PANONDROM-PIRENENA",  # 50 pts
            "ANARANA",  # 40 pts
            "NOM",  # 30 pts
            "FANAMPIN",  # 40 pts
            "PRENOMS",  # 30 pts
            "PRÉNOMS",  # 30 pts
            "TERAKA",  # 40 pts
            "NÉ(E)",  # 30 pts
            "NE(E)",  # 30 pts
            "TAO",  # 30 pts
            "LIEU",  # 25 pts
            "LAHARANA",  # 40 pts
            "RAY",  # 30 pts
            "PÈRE",  # 25 pts
            "PERE",  # 25 pts
            "RENY",  # 30 pts
            "MÈRE",  # 25 pts
            "MERE",  # 25 pts
            "NITERAKA",  # 35 pts
            "PROFESSION",  # 30 pts
            "DÉLIVRANCE",  # 30 pts
            "DELIVRANCE",  # 30 pts
            "SIGNATURE",  # 20 pts
        ]

        for keyword in critical_keywords:
            if keyword in normalized:
                # Score basé sur l'importance du mot-clé
                if keyword in ["MADAGASIKARA", "KARA-PANONDROM", "PANONDROM-PIRENENA"]:
                    score += 50
                elif keyword in ["ANARANA", "FANAMPIN", "TERAKA", "LAHARANA", "NITERAKA"]:
                    score += 40
                elif keyword in ["NOM", "PRENOMS", "PRÉNOMS", "RAY", "RENY", "TAO", "PROFESSION", "DÉLIVRANCE", "DELIVRANCE"]:
                    score += 30
                else:
                    score += 20

        # Bonus pour les patterns de données réelles
        import re

        # Numéro CIN (7-12 chiffres)
        if re.search(r"\b\d{7,12}\b", text):
            score += 30

        # Date (format français)
        if re.search(r"\b\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}\b", text, re.IGNORECASE):
            score += 30

        # Noms propres (majuscules)
        if re.search(r"\b[A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ]{3,}\b", text):
            score += 15

        # Pénalité pour trop de caractères parasites
        noise_ratio = len(re.findall(r"[^\w\sàâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ/:\-.,']", text)) / max(len(text), 1)
        score -= int(noise_ratio * 50)

        # Bonus pour nombre de lignes exploitables
        lines = [l for l in text.split("\n") if len(l.strip()) > 3]
        score += min(len(lines), 30)

        return max(score, 0)

    @staticmethod
    def extract_text_from_bytes(contents: bytes) -> str:
        """
        Convertit les données binaires en image puis lance l'OCR.
        """
        image = Image.open(BytesIO(contents))

        # Redimensionner si trop grande (max 3000px côté long)
        max_dim = 3000
        if max(image.size) > max_dim:
            ratio = max_dim / max(image.size)
            new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)

        return OCRService.extract_text(image)