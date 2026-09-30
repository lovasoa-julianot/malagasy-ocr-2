from app.services.gemini_service import GeminiService

service = GeminiService()

result = service.extraire_recto("CIN-front.jpg")

# result = service.extraire_cin("CIN-front.jpg","CIN-back.jpg")

print(result.model_dump_json(indent=2))