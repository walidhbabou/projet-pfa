from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import datetime
from bson import json_util
import json

announcement_bp = Blueprint('announcement_bp', __name__)

def init_announcement_routes(db_instance):
    global db
    db = db_instance

def json_response(data, status_code=200):
    """Return JSON response with proper headers"""
    from flask import current_app
    return current_app.response_class(
        response=json.dumps(data, default=json_util.default),
        status=status_code,
        mimetype='application/json'
    )

def is_admin(email):
    """Check if user is admin"""
    user = db.users.find_one({"email": email})
    return user and user.get("role") == "admin"

# Route pour créer une annonce
@announcement_bp.route('/api/announcements', methods=['POST'])
@jwt_required()
def create_announcement():
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        # Vérifier si l'utilisateur est admin
        if not is_admin(current_user):
            return json_response({"error": "Accès non autorisé"}, 403)
        
        # Validation des données requises
        required_fields = ['title', 'content', 'type']
        for field in required_fields:
            if field not in data:
                return json_response({"error": f"Le champ {field} est requis"}, 400)
        
        # Création de l'annonce
        announcement = {
            'title': data['title'],
            'content': data['content'],
            'type': data['type'],
            'created_at': datetime.datetime.utcnow(),
            'created_by': current_user,
            'is_active': True
        }
        
        # Insertion dans la base de données
        result = db.announcements.insert_one(announcement)
        
        return json_response({
            "message": "Annonce créée avec succès",
            "announcement_id": str(result.inserted_id)
        }, 201)
        
    except Exception as e:
        print(f"Erreur lors de la création de l'annonce: {e}")
        return json_response({"error": str(e)}, 500)

# Route pour récupérer les annonces
@announcement_bp.route('/api/announcements', methods=['GET'])
@jwt_required()
def get_announcements():
    try:
        # Récupérer les paramètres de requête
        announcement_type = request.args.get('type')
        is_active = request.args.get('is_active', 'true').lower() == 'true'
        
        # Construire la requête
        query = {'is_active': is_active}
        if announcement_type:
            query['type'] = announcement_type
        
        # Récupérer les annonces
        announcements = list(db.announcements.find(query).sort('created_at', -1))
        
        # Convertir les ObjectId en strings
        for announcement in announcements:
            announcement['_id'] = str(announcement['_id'])
        
        return json_response({"announcements": announcements})
        
    except Exception as e:
        print(f"Erreur lors de la récupération des annonces: {e}")
        return json_response({"error": str(e)}, 500) 