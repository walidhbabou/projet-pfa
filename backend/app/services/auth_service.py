from app.models.user import User
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import jwt
from flask_jwt_extended import create_access_token, create_refresh_token
from ..config.config import Config

class AuthService:
    def __init__(self, users_collection):
        self.users_collection = users_collection

    def register_user(self, email, password, name=""):
        if self.users_collection.find_one({"email": email}):
            raise ValueError("Email already exists")

        user = User(email=email, password=password, name=name)
        user_dict = user.to_dict()
        if "_id" in user_dict and user_dict["_id"] is None:
            del user_dict["_id"]
        self.users_collection.insert_one(user_dict)
        
        access_token = create_access_token(identity=str(user._id), additional_claims={"email": user.email, "role": user.role, "name": user.name})
        return access_token, user

    def login_user(self, email, password):
        print(f"\n=== Tentative de connexion ===")
        print(f"Email: {email}")
        try:
            if self.users_collection is None:
                print("❌ ERREUR: Collection users non initialisée")
                raise ValueError("Erreur de configuration de la base de données")

            user_data = self.users_collection.find_one({"email": email})
            
            if not user_data:
                print(f"❌ Aucun utilisateur trouvé pour l'email: {email}")
                raise ValueError("Email ou mot de passe incorrect")

            print(f"✅ Utilisateur trouvé dans la base de données")
            print(f"Données utilisateur: {user_data}")
            
            user = User.from_dict(user_data)
            print(f"Rôle de l'utilisateur: {user.role}")
            
            if not user.check_password(password):
                print(f"❌ Mot de passe incorrect pour l'utilisateur: {email}")
                raise ValueError("Email ou mot de passe incorrect")

            print(f"✅ Mot de passe correct")
            
            access_token = create_access_token(identity=str(user._id), additional_claims={"email": user.email, "role": user.role, "name": user.name})
            print(f"✅ Token JWT généré avec succès")
            
            return access_token, user
            
        except Exception as e:
            print(f"❌ Erreur lors de la connexion: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise

    def create_admin(self, email, password, name="", created_by=None):
        if self.users_collection.find_one({"email": email}):
            raise ValueError("Email already exists")

        admin = User(email=email, password=password, name=name, role="admin")
        admin_dict = admin.to_dict()
        if created_by:
            admin_dict["created_by"] = created_by

        self.users_collection.insert_one(admin_dict)
        
        access_token = create_access_token(identity=str(admin._id), additional_claims={"email": admin.email, "role": admin.role, "name": admin.name})
        return access_token, admin

    def get_user_by_email(self, email):
        user_data = self.users_collection.find_one({"email": email})
        if user_data:
            return User.from_dict(user_data)
        return None

    def is_admin(self, email):
        user = self.get_user_by_email(email)
        return user and user.role == "admin"

    def update_user_profile(self, current_email: str, new_email: str, new_name: str) -> dict:
        """
        Met à jour le profil de l'utilisateur avec un nouvel email et un nouveau nom.
        Retourne un dictionnaire sérialisable pour l'API.
        """
        user = self.get_user_by_email(current_email)
        if not user:
            raise ValueError("User not found")

        update_data = {
            "email": new_email,
            "name": new_name,
            "updated_at": datetime.utcnow()
        }

        result = self.users_collection.update_one(
            {"email": current_email},
            {"$set": update_data}
        )

        # On considère la modification comme réussie même si les données sont identiques
        updated_user = self.users_collection.find_one({"email": new_email})
        if not updated_user:
            raise ValueError("Failed to update user profile")

        # Convertir l'ObjectId en string et retirer le mot de passe
        updated_user["_id"] = str(updated_user["_id"])
        updated_user.pop("password", None)
        if "created_at" in updated_user and hasattr(updated_user["created_at"], "isoformat"):
            updated_user["created_at"] = updated_user["created_at"].isoformat()
        if "updated_at" in updated_user and hasattr(updated_user["updated_at"], "isoformat"):
            updated_user["updated_at"] = updated_user["updated_at"].isoformat()
        return updated_user

    def update_user_password(self, email: str, new_password: str) -> None:
        """
        Met à jour le mot de passe de l'utilisateur.
        """
        user = self.get_user_by_email(email)
        if not user:
            raise ValueError("User not found")

        hashed_password = generate_password_hash(new_password)
        result = self.users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "password": hashed_password,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        if result.modified_count == 0:
            raise ValueError("Failed to update password")