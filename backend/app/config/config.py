import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # Flask configuration
    SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-secret-key-change-me")
    
    # JWT configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-secret-key-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_EXPIRE_HOURS", 24)))
    JWT_TOKEN_LOCATION = ['headers']
    
    # MongoDB configuration
    # Dans votre configuration Flask
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongo:27017/fsts_assistance")  # Docker
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "fsts_assistance")
    
    # CORS configuration
    CORS_ORIGINS = [
        'http://localhost:8080',  # Frontend Vue.js/React en développement
        'http://localhost:3000',  # Frontend alternatif
        'http://localhost:5173',  # Vite dev server
        'http://127.0.0.1:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
    ]
    
    # Debug mode
    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    
    # Rasa configuration
    RASA_API_URL = os.getenv("RASA_API_URL", "http://localhost:5005")
    
    @classmethod
    def init_app(cls, app):
        print("Current configuration:")
        print(f"MongoDB URI: {cls.MONGO_URI}")
        print(f"MongoDB Database: {cls.MONGO_DB_NAME}")
        print(f"CORS Origins: {cls.CORS_ORIGINS}")
        print(f"Debug Mode: {cls.DEBUG}") 