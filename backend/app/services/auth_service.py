from flask_jwt_extended import create_access_token
from ..models.user import User
from werkzeug.security import generate_password_hash
from datetime import datetime

class AuthService:
    def __init__(self, users_collection):
        self.users_collection = users_collection

    def register_user(self, email, password, name=""):
        if self.users_collection.find_one({"email": email}):
            raise ValueError("Email already exists")

        user = User(email=email, password=password, name=name)
        self.users_collection.insert_one(user.to_dict())
        
        access_token = create_access_token(identity=email)
        return access_token, user

    def login_user(self, email, password):
        print(f"Tentative de connexion pour l'email: {email}")
        user_data = self.users_collection.find_one({"email": email})
        
        if not user_data:
            print(f"Aucun utilisateur trouvé pour l'email: {email}")
            raise ValueError("Email ou mot de passe incorrect")

        print(f"Utilisateur trouvé: {user_data.get('email')}, rôle: {user_data.get('role')}")
        user = User.from_dict(user_data)
        
        if not user.check_password(password):
            print(f"Mot de passe incorrect pour l'utilisateur: {email}")
            raise ValueError("Email ou mot de passe incorrect")

        print(f"Connexion réussie pour l'utilisateur: {email}")
        access_token = create_access_token(
            identity=email,
            additional_claims={
                "role": user.role,
                "name": user.name
            }
        )
        return access_token, user

    def create_admin(self, email, password, name="", created_by=None):
        if self.users_collection.find_one({"email": email}):
            raise ValueError("Email already exists")

        admin = User(email=email, password=password, name=name, role="admin")
        admin_dict = admin.to_dict()
        if created_by:
            admin_dict["created_by"] = created_by

        self.users_collection.insert_one(admin_dict)
        
        access_token = create_access_token(identity=email)
        return access_token, admin

    def get_user_by_email(self, email):
        user_data = self.users_collection.find_one({"email": email})
        if user_data:
            return User.from_dict(user_data)
        return None

    def is_admin(self, email):
        user = self.get_user_by_email(email)
        return user and user.role == "admin"

    def update_user_profile(self, current_email: str, new_email: str, new_name: str) -> User:
        """
        Met à jour le profil de l'utilisateur avec un nouvel email et un nouveau nom.
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

        if result.modified_count == 0:
            raise ValueError("Failed to update user profile")

        return self.get_user_by_email(new_email)

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