from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
from app.config.config import Config
from app.database.mongodb import init_db, get_users_collection
from app.models.user import User # Import the User model explicitly
from .routes.auth_routes import auth_bp, init_auth_routes
from .routes.chat_routes import chat_bp, init_chat_routes
from .routes.admin_routes import admin_routes
from .routes.announcement_routes import announcement_bp, init_announcement_routes
from .services.user_service import UserService

def create_app(config_class=Config):
    app = Flask(__name__)
    
    # Configuration de l'application
    app.config.from_object(config_class)
    Config.init_app(app)
    
    # Configuration CORS simplifiée
    CORS(app, 
         resources={r"/*": {
             "origins": ["http://localhost:8081", "http://127.0.0.1:8081"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "Accept", "Accept-Language", "Content-Language"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "max_age": 3600
         }}
    )
    
    # Middleware pour gérer les requêtes OPTIONS
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = app.make_default_options_response()
            response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "http://localhost:8081")
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Accept-Language, Content-Language"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = "3600"
            return response
    
    # Configuration JWT
    jwt = JWTManager(app)
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    
    try:
        print("\n=== Initialisation de l'application ===")
        # Initialize database and get collections
        print("Connexion à MongoDB...")
        client, collections = init_db()
        print("✅ Connexion à MongoDB établie")
        print("Collections disponibles:", collections.keys())
        
        # Initialize routes with collections
        print("\nInitialisation des routes...")
        init_auth_routes(collections['users'])
        init_chat_routes(collections['chat_history'], collections['users'])
        init_announcement_routes(collections)
        print("✅ Routes initialisées")
        
        # Register blueprints with /api prefix
        app.register_blueprint(auth_bp, url_prefix='/api')
        app.register_blueprint(chat_bp, url_prefix='/api')
        app.register_blueprint(admin_routes, url_prefix='/api')
        app.register_blueprint(announcement_bp, url_prefix='/api')
        print("✅ Blueprints enregistrés")
        
        # Initialiser l'admin par défaut
        print("\nInitialisation de l'admin par défaut...")
        user_service = UserService(collections['users'])
        user_service.init_default_admin()
        print("✅ Initialisation terminée")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise
    
    @app.route('/api/health')
    def health_check():
        return jsonify({"status": "ok"}), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "message": "Route non trouvée"
        }), 404
    
    @app.errorhandler(500)
    def server_error(error):
        print(f"Erreur serveur: {str(error)}")
        return jsonify({
            "success": False,
            "message": "Erreur interne du serveur"
        }), 500
    
    return app