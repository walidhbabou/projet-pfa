from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
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
            return jsonify({"error": "Email and password required"}), 400

        token, user = auth_service.register_user(
            email=data['email'],
            password=data['password'],
            name=data.get('name', '')
        )

        return jsonify({
            "message": "User created successfully",
            "token": token,
            "user": user.to_dict()
        }), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"error": "Registration failed"}), 500

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
            token, user = auth_service.login_user(email, password)
            
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'email': user.email,
                    'name': user.name,
                    'role': user.role
                }
            }), 200
            
        except ValueError as e:
            return jsonify({
                'success': False,
                'message': str(e)
            }), 401

    except Exception as e:
        print(f"Erreur lors de la connexion: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la connexion'
        }), 500

@auth_bp.route('/create-admin', methods=['POST'])
@jwt_required()
def create_admin():
    try:
        if not auth_service.is_admin(get_jwt_identity()):
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({"error": "Email and password required"}), 400

        token, admin = auth_service.create_admin(
            email=data['email'],
            password=data['password'],
            name=data.get('name', ''),
            created_by=get_jwt_identity()
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
    return jsonify({
        'success': True,
        'data': current_user
    }), 200

@auth_bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        data = request.get_json()
        if not data or 'name' not in data or 'email' not in data:
            return jsonify({"error": "Name and email required"}), 400

        current_user_email = get_jwt_identity()
        user = auth_service.get_user_by_email(current_user_email)
        
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Vérifier si le nouvel email est déjà utilisé par un autre utilisateur
        if data['email'] != current_user_email:
            existing_user = auth_service.get_user_by_email(data['email'])
            if existing_user:
                return jsonify({"error": "Email already in use"}), 400

        # Mettre à jour l'utilisateur
        updated_user = auth_service.update_user_profile(
            current_email=current_user_email,
            new_email=data['email'],
            new_name=data['name']
        )

        # Créer un nouveau token si l'email a changé
        token = None
        if data['email'] != current_user_email:
            token = create_access_token(identity=data['email'])

        response = {"user": updated_user.to_dict()}
        if token:
            response["token"] = token

        return jsonify(response)

    except Exception as e:
        print(f"Update profile error: {e}")
        return jsonify({"error": "Failed to update profile"}), 500

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    try:
        data = request.get_json()
        if not data or 'currentPassword' not in data or 'newPassword' not in data:
            return jsonify({"error": "Current password and new password required"}), 400

        current_user_email = get_jwt_identity()
        user = auth_service.get_user_by_email(current_user_email)
        
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Vérifier l'ancien mot de passe
        if not user.check_password(data['currentPassword']):
            return jsonify({"error": "Current password is incorrect"}), 400

        # Mettre à jour le mot de passe
        auth_service.update_user_password(
            email=current_user_email,
            new_password=data['newPassword']
        )

        return jsonify({"message": "Password updated successfully"})

    except Exception as e:
        print(f"Change password error: {e}")
        return jsonify({"error": "Failed to change password"}), 500 