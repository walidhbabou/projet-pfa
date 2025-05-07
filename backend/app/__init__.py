from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config.config import Config
from app.database.mongodb import init_db
from .routes.auth_routes import auth_bp, init_auth_routes
from .routes.chat_routes import chat_bp, init_chat_routes
from .routes.faq_routes import faq_bp, init_faq_routes
from .routes.admin_routes import admin_routes
from .routes.announcement_routes import announcement_bp, init_announcement_routes

def create_app():
    app = Flask(__name__)
    
    # Configuration de l'application
    app.config.from_object(Config)
    
    # Configuration CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:8081", "http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "expose_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # Initialize database and get collections
    client, collections = init_db()
    print("Collections initialisées:", collections.keys())
    
    # Initialize routes with collections
    init_auth_routes(collections['users'])
    init_chat_routes(collections['chat_history'])
    init_faq_routes(collections)
    init_announcement_routes(collections)
    
    # Register blueprints with /api prefix
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(chat_bp, url_prefix='/api')
    app.register_blueprint(faq_bp, url_prefix='/api')
    app.register_blueprint(admin_routes, url_prefix='/api')
    app.register_blueprint(announcement_bp, url_prefix='/api')
    
    @app.route('/api/health')
    def health_check():
        return jsonify({"status": "ok"}), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Route not found"}), 404
    
    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"error": "Internal server error"}), 500
    
    return app