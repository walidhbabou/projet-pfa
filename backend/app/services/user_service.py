from ..database.mongodb import get_users_collection
from bson import ObjectId
from datetime import datetime
from werkzeug.security import generate_password_hash
from ..models.user import User

class UserService:
    def __init__(self, users_collection=None):
        # Initialize with the provided collection or get a new one
        self.users_collection = users_collection if users_collection is not None else get_users_collection()

    def get_all_users(self):
        """Récupère tous les utilisateurs"""
        users = list(self.users_collection.find({}, {'password': 0}))
        # Convertir les ObjectId en strings
        for user in users:
            user['_id'] = str(user['_id'])
            if 'created_at' in user:
                user['created_at'] = user['created_at'].isoformat()
        return users

    def get_users_paginated(self, page=1, limit=10, filter_query=None):
        """Récupère les utilisateurs avec pagination et filtrage"""
        try:
            # Calculer le skip pour la pagination
            skip = (page - 1) * limit
            
            # Construire la requête
            query = filter_query or {}
            
            # Récupérer le nombre total d'utilisateurs
            total = self.users_collection.count_documents(query)
            
            # Récupérer les utilisateurs avec pagination
            users = list(self.users_collection.find(query)
                        .sort("created_at", -1)
                        .skip(skip)
                        .limit(limit))
            
            # Convertir les ObjectId en string
            for user in users:
                user['_id'] = str(user['_id'])
                # Ne pas renvoyer le mot de passe
                if "password" in user:
                    del user["password"]
            
            return {
                "data": users,
                "total": total,
                "page": page,
                "limit": limit
            }
        except Exception as e:
            print(f"Error in get_users_paginated: {str(e)}")
            raise

    def get_user_by_id(self, user_id):
        """Récupère un utilisateur par son ID"""
        try:
            user = self.users_collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user['_id'] = str(user['_id'])
            return user
        except Exception as e:
            print(f"Error in get_user_by_id: {str(e)}")
            raise

    def create_user(self, data):
        try:
            # Validation des données
            if not all(k in data for k in ["email", "password", "name", "role"]):
                raise ValueError("Données incomplètes pour la création de l'utilisateur")

            # Vérifier si l'email existe déjà
            existing_user = self.users_collection.find_one({"email": data["email"]})
            if existing_user:
                raise ValueError("Un utilisateur avec cet email existe déjà")

            # Valider le rôle
            valid_roles = ["user", "admin", "moderator"]
            if data["role"] not in valid_roles:
                raise ValueError(f"Rôle invalide. Les rôles valides sont: {', '.join(valid_roles)}")

            # Hasher le mot de passe
            hashed_password = generate_password_hash(data["password"])

            # Préparer les données
            user = {
                "name": data["name"],
                "email": data["email"],
                "password": hashed_password,
                "role": data["role"],
                "created_at": datetime.utcnow(),
                "updated_at": None,
                "is_active": True
            }

            # Insérer l'utilisateur
            result = self.users_collection.insert_one(user)
            if not result.inserted_id:
                raise Exception("Erreur lors de l'insertion de l'utilisateur")

            # Récupérer l'utilisateur créé
            created_user = self.users_collection.find_one({"_id": result.inserted_id})
            if not created_user:
                raise Exception("Erreur lors de la récupération de l'utilisateur créé")

            # Supprimer le mot de passe avant de retourner
            created_user.pop("password", None)
            created_user["_id"] = str(created_user["_id"])
            return created_user

        except ValueError as ve:
            print(f"Erreur de validation: {str(ve)}")
            raise
        except Exception as e:
            print(f"Erreur lors de la création de l'utilisateur: {str(e)}")
            raise

    def get_user_by_email(self, email):
        try:
            return self.users_collection.find_one({"email": email})
        except Exception as e:
            print(f"Error in get_user_by_email: {str(e)}")
            raise

    def update_user(self, user_id, data):
        """Met à jour un utilisateur"""
        try:
            update_data = {
                "name": data.get("name"),
                "email": data.get("email"),
                "role": data.get("role"),
                "is_active": data.get("is_active"),
                "updated_at": datetime.utcnow()
            }
            
            # Si un nouveau mot de passe est fourni
            if "password" in data:
                update_data["password"] = generate_password_hash(data["password"])
            
            # Supprimer les champs None
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            result = self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error in update_user: {str(e)}")
            raise

    def delete_user(self, user_id):
        """Supprime un utilisateur"""
        try:
            result = self.users_collection.delete_one({"_id": ObjectId(user_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error in delete_user: {str(e)}")
            raise

    def init_default_admin(self):
        try:
            print("\n=== Initialisation de l'admin par défaut ===")
            # Vérifier si un admin existe déjà
            admin = self.users_collection.find_one({"role": "admin"})
            
            if not admin:
                print("Création de l'admin par défaut...")
                admin_user = User(
                    email="admin@fsts.ma",
                    password="Admin123!",
                    name="Admin FSTS",
                    role="admin"
                )
                
                # Insérer l'admin dans la base de données
                result = self.users_collection.insert_one(admin_user.to_dict())
                
                if result.inserted_id:
                    print("✅ Admin par défaut créé avec succès")
                    print(f"Email: admin@fsts.ma")
                    print(f"Mot de passe: Admin123!")
                else:
                    print("❌ Échec de la création de l'admin par défaut")
            else:
                print("✅ Un admin existe déjà dans la base de données")
                print(f"Email: {admin.get('email')}")
                print(f"Rôle: {admin.get('role')}")
                
        except Exception as e:
            print(f"❌ Erreur lors de l'initialisation de l'admin: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise 