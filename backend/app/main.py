from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_routes, announcement_routes, chat_routes
from app.database.mongodb import init_db
from app.config.config import Config

app = FastAPI(title="FSTS API", version="1.0.0")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation de la base de données
@app.on_event("startup")
async def startup_event():
    try:
        client, collections = init_db()
        print("Collections initialized:", collections.keys())
        # Vérifier que la collection announcements existe
        if 'announcements' in collections:
            print("Announcements collection is ready")
        else:
            print("Warning: Announcements collection not found")
    except Exception as e:
        print(f"Error during startup: {e}")
        raise

# Enregistrement des routes
app.include_router(auth_routes.router, prefix="/api", tags=["Authentication"])
app.include_router(announcement_routes.router, prefix="/api", tags=["Announcements"])
app.include_router(chat_routes.router, prefix="/api", tags=["Chat"])

@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API FSTS"} 