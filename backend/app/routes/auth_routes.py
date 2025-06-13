from flask import Blueprint, request, jsonify
from ..services.auth_service import AuthService
import jwt
from datetime import datetime, timedelta
from ..config.config import Config
from ..database.mongodb import get_users_collection
from ..middleware.auth_middleware import token_required

auth_bp = Blueprint('auth', __name__)
auth_service = None

def init_auth_routes(users_collection):
    global auth_service
    auth_service = AuthService(users_collection)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({
                "success": False,
                "message": "Email et mot de passe requis"
            }), 400

        # Validation stricte des formats
        if not isinstance(data['email'], str) or not isinstance(data['password'], str):
            return jsonify({
                "success": False,
                "message": "Email et mot de passe doivent être des chaînes de caractères"
            }), 400

        token, user = auth_service.register_user(
            email=data['email'],
            password=data['password'],
            name=data.get('name', '')
        )

        return jsonify({
            "success": True,
            "message": "Utilisateur créé avec succès",
            "token": token,
            "user": user.to_dict()
        }), 201

    except ValueError as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400
    except Exception as e:
        print(f"Erreur d'inscription: {e}")
        return jsonify({
            "success": False,
            "message": "Échec de l'inscription"
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email et mot de passe requis'
            }), 400

        try:
            print(f"Tentative de connexion pour l'email: {email}")
            token, user = auth_service.login_user(email, password)
            print(f"Connexion réussie pour l'utilisateur: {email}")
            
            return jsonify({
                'success': True,
                'message': 'Connexion réussie',
                'token': token,
                'user': {
                    'id': str(user._id) if user._id else None,
                    'email': user.email,
                    'name': user.name,
                    'role': user.role
                }
            }), 200
            
        except ValueError as e:
            print(f"Erreur de validation lors de la connexion: {str(e)}")
            return jsonify({
                'success': False,
                'message': str(e)
            }), 401

    except Exception as e:
        print(f"Erreur lors de la connexion: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la connexion'
        }), 500

@auth_bp.route('/create-admin', methods=['POST'])
@token_required
def create_admin(current_user):
    try:
        if not auth_service.is_admin(current_user):
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({"error": "Email and password required"}), 400

        token, admin = auth_service.create_admin(
            email=data['email'],
            password=data['password'],
            name=data.get('name', ''),
            created_by=current_user['email']
        )

        return jsonify({
            "message": "Admin user created successfully",
            "token": token,
            "user": admin.to_dict()
        }), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Admin creation error: {e}")
        return jsonify({"error": "Admin creation failed"}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    try:
        if not current_user:
            return jsonify({
                'success': False,
                'message': 'Utilisateur non trouvé'
            }), 401

        return jsonify({
            'success': True,
            'data': {
                'id': str(current_user['_id']),
                'email': current_user['email'],
                'name': current_user['name'],
                'role': current_user['role']
            }
        }), 200
    except Exception as e:
        print(f"Erreur lors de la récupération de l'utilisateur: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération de l\'utilisateur'
        }), 500

@auth_bp.route('/update-profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    try:
        data = request.get_json()
        if not data or 'name' not in data or 'email' not in data:
            return jsonify({"error": "Name and email required"}), 400

        if data['email'] != current_user['email']:
            existing_user = auth_service.get_user_by_email(data['email'])
            if existing_user:
                return jsonify({"error": "Email already in use"}), 400

        updated_user = auth_service.update_user_profile(
            current_email=current_user['email'],
            new_email=data['email'],
            new_name=data['name']
        )

        return jsonify({
            "user": updated_user
        }), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print(f"Update profile error: {e}")
        return jsonify({"error": "Failed to update profile"}), 500

@auth_bp.route('/change-password', methods=['PUT'])
@token_required
def change_password(current_user):
    try:
        data = request.get_json()
        if not data or 'currentPassword' not in data or 'newPassword' not in data:
            return jsonify({"error": "Current password and new password required"}), 400

        if not current_user.check_password(data['currentPassword']):
            return jsonify({"error": "Current password is incorrect"}), 400

        auth_service.update_user_password(
            email=current_user['email'],
            new_password=data['newPassword']
        )

        return jsonify({"message": "Password updated successfully"})

    except Exception as e:
        print(f"Change password error: {e}")
        return jsonify({"error": "Failed to change password"}), 500

@auth_bp.route('/refresh-token', methods=['POST'])
@token_required
def refresh_token(current_user):
    try:
        if not current_user:
            return jsonify({
                'success': False,
                'message': 'Utilisateur non trouvé'
            }), 401

        token = jwt.encode({
            'email': current_user['email'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, Config.JWT_SECRET_KEY, algorithm='HS256')

        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': str(current_user['_id']),
                'email': current_user['email'],
                'name': current_user['name'],
                'role': current_user['role']
            }
        }), 200
    except Exception as e:
        print(f"Erreur lors du rafraîchissement du token: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors du rafraîchissement du token'
        }), 500