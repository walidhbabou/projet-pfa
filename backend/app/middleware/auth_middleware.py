from functools import wraps
from flask import request, jsonify
import jwt
from ..config.config import Config
from ..database.mongodb import get_users_collection

def get_token_from_header():
    """Extrait le token du header Authorization"""
    if 'Authorization' not in request.headers:
        return None
        
    auth_header = request.headers['Authorization']
    if not auth_header.startswith('Bearer '):
        return None
        
    return auth_header.split(' ')[1]

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({
                'success': False,
                'message': 'Token manquant'
            }), 401

        try:
            data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            users_collection = get_users_collection()
            current_user = users_collection.find_one({"email": data.get('email')})
            
            if not current_user:
                return jsonify({
                    'success': False,
                    'message': 'Utilisateur non trouvé'
                }), 401
                
            # Convertir l'ObjectId en string
            current_user['_id'] = str(current_user['_id'])
            # Supprimer le mot de passe
            if 'password' in current_user:
                del current_user['password']
                
            return f(current_user, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({
                'success': False,
                'message': 'Token expiré'
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'success': False,
                'message': 'Token invalide'
            }), 401
        except Exception as e:
            print(f"Erreur d'authentification: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Erreur d\'authentification'
            }), 401
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({
                'success': False,
                'message': 'Token manquant'
            }), 401

        try:
            data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            users_collection = get_users_collection()
            current_user = users_collection.find_one({"email": data.get('email')})
            
            if not current_user:
                return jsonify({
                    'success': False,
                    'message': 'Utilisateur non trouvé'
                }), 401
                
            if current_user.get('role') != 'admin':
                return jsonify({
                    'success': False,
                    'message': 'Accès non autorisé'
                }), 403
                
            # Convertir l'ObjectId en string
            current_user['_id'] = str(current_user['_id'])
            # Supprimer le mot de passe
            if 'password' in current_user:
                del current_user['password']
                
            return f(current_user, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({
                'success': False,
                'message': 'Token expiré'
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'success': False,
                'message': 'Token invalide'
            }), 401
        except Exception as e:
            print(f"Erreur d'authentification admin: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Erreur d\'authentification'
            }), 401
    return decorated 