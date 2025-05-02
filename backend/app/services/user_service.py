from ..database.mongodb import get_users_collection
from bson import ObjectId
from datetime import datetime

class UserService:
    def __init__(self):
        self.users_collection = get_users_collection()

    def get_all_users(self):
        """Récupère tous les utilisateurs"""
        users = list(self.users_collection.find({}, {'password': 0}))
        # Convertir les ObjectId en strings
        for user in users:
            user['_id'] = str(user['_id'])
            if 'created_at' in user:
                user['created_at'] = user['created_at'].isoformat()
        return users

    def update_user(self, user_id, data):
        """Met à jour un utilisateur"""
        # Vérifier que l'utilisateur existe
        user = self.users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            raise Exception("Utilisateur non trouvé")

        # Mettre à jour les champs autorisés
        update_data = {
            'name': data.get('name', user.get('name')),
            'email': data.get('email', user.get('email')),
            'role': data.get('role', user.get('role')),
            'updated_at': datetime.utcnow()
        }

        # Mettre à jour l'utilisateur
        result = self.users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )

        if result.modified_count == 0:
            raise Exception("Échec de la mise à jour de l'utilisateur")

        # Récupérer l'utilisateur mis à jour
        updated_user = self.users_collection.find_one(
            {'_id': ObjectId(user_id)},
            {'password': 0}
        )
        updated_user['_id'] = str(updated_user['_id'])
        if 'created_at' in updated_user:
            updated_user['created_at'] = updated_user['created_at'].isoformat()
        return updated_user

    def delete_user(self, user_id):
        """Supprime un utilisateur"""
        # Vérifier que l'utilisateur existe
        user = self.users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            raise Exception("Utilisateur non trouvé")

        # Supprimer l'utilisateur
        result = self.users_collection.delete_one({'_id': ObjectId(user_id)})
        if result.deleted_count == 0:
            raise Exception("Échec de la suppression de l'utilisateur") 