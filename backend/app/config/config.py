import os
from datetime import timedelta
from dotenv import load_dotenv
import secrets

# Load environment variables
load_dotenv()

class Config:
    # Flask configuration
    SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_hex(32))
    
    # JWT configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_hex(32))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_EXPIRE_HOURS", 24)))
    JWT_TOKEN_LOCATION = ['headers']
    
    # MongoDB configuration
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/fsts_chatbot")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "fsts_chatbot")
    
    # CORS configuration
    CORS_ORIGINS = [
        "http://localhost:8081",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5000",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5000",
        "http://localhost",
        "http://127.0.0.1"
    ]
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOW_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
    CORS_ALLOW_HEADERS = [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Credentials',
        'Accept-Language',
        'Content-Language'
    ]
    CORS_EXPOSE_HEADERS = [
        'Content-Type',
        'Authorization',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Credentials'
    ]
    CORS_MAX_AGE = 3600
    
    # Debug mode
    DEBUG = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
    
    # Rasa configuration
    RASA_API_URL = os.getenv("RASA_API_URL", "http://localhost:5005")
    
    @classmethod
    def init_app(cls, app):
        print("\n=== Configuration de l'application ===")
        print(f"MongoDB URI: {cls.MONGO_URI}")
        print(f"MongoDB Database: {cls.MONGO_DB_NAME}")
        print(f"CORS Origins: {cls.CORS_ORIGINS}")
        print(f"Debug Mode: {cls.DEBUG}")
        print(f"JWT Secret Key: {'*' * 10}{cls.JWT_SECRET_KEY[-5:] if cls.JWT_SECRET_KEY else 'Non défini'}")
        print("✅ Configuration terminée") 