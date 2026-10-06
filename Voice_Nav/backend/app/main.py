from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router as assistant_router

app = FastAPI(
    title=settings.APP_NAME,
    description="Multilingual Voice Navigation AI Assistant supporting English and Marathi.",
    version="1.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assistant_router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "supported_languages": ["en", "mr", "hi"],
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
# Reload trigger v1.2

