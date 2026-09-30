class GeminiServiceError(Exception):
    """Erreur générale du service Gemini."""
    pass


class GeminiUnavailableError(GeminiServiceError):
    """Gemini est temporairement indisponible."""
    pass


class GeminiQuotaError(GeminiServiceError):
    """Le quota Gemini est dépassé."""
    pass