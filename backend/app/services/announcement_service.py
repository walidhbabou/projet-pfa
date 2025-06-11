from datetime import datetime
from bson import ObjectId
from ..database.mongodb import get_announcements_collection

class AnnouncementService:
    def __init__(self, announcements_collection):
        self.announcements_collection = announcements_collection
        print(f"AnnouncementService initialized with collection: {announcements_collection}")

    def create_announcement(self, data, author_id, author_name):
        try:
            # Validation des données
            if not all(k in data for k in ["title", "content"]):
                raise ValueError("Données incomplètes pour la création de l'annonce")

            # Vérifier si le titre existe déjà
            existing_announcement = self.announcements_collection.find_one({
                "title": {"$regex": f"^{data['title']}$", "$options": "i"}
            })
            if existing_announcement:
                raise ValueError("Une annonce avec ce titre existe déjà")

            # Préparer les données
            announcement = {
                "title": data["title"],
                "content": data["content"],
                "type": data.get("type", "info"),
                "author_id": author_id,
                "author_name": author_name,
                "created_at": datetime.utcnow(),
                "updated_at": None,
                "status": "active"
            }

            # Insérer l'annonce
            result = self.announcements_collection.insert_one(announcement)
            if not result.inserted_id:
                raise Exception("Erreur lors de l'insertion de l'annonce")

            # Récupérer l'annonce créée
            created_announcement = self.announcements_collection.find_one({"_id": result.inserted_id})
            if not created_announcement:
                raise Exception("Erreur lors de la récupération de l'annonce créée")

            # Convertir l'ObjectId en string
            created_announcement["_id"] = str(created_announcement["_id"])
            return created_announcement

        except ValueError as ve:
            print(f"Erreur de validation: {str(ve)}")
            raise
        except Exception as e:
            print(f"Erreur lors de la création de l'annonce: {str(e)}")
            raise

    def get_all_announcements(self):
        try:
            announcements = list(self.announcements_collection.find().sort("created_at", -1))
            for a in announcements:
                a["_id"] = str(a["_id"])
            return announcements
        except Exception as e:
            print(f"Error in get_all_announcements: {str(e)}")
            raise

    def get_announcements_paginated(self, page=1, limit=10, filter_query=None):
        """Récupère les annonces avec pagination et filtrage"""
        try:
            # Calculer le skip pour la pagination
            skip = (page - 1) * limit
            
            # Construire la requête
            query = filter_query or {}
            
            # Récupérer le nombre total d'annonces
            total = self.announcements_collection.count_documents(query)
            
            # Récupérer les annonces avec pagination
            announcements = list(self.announcements_collection.find(query)
                               .sort("created_at", -1)
                               .skip(skip)
                               .limit(limit))
            
            # Convertir les ObjectId en string
            for announcement in announcements:
                announcement['_id'] = str(announcement['_id'])
            
            return {
                "data": announcements,
                "total": total,
                "page": page,
                "limit": limit
            }
        except Exception as e:
            print(f"Error in get_announcements_paginated: {str(e)}")
            raise

    def get_announcement_by_id(self, announcement_id):
        """Récupère une annonce par son ID"""
        try:
            announcement = self.announcements_collection.find_one({"_id": ObjectId(announcement_id)})
            if announcement:
                announcement['_id'] = str(announcement['_id'])
            return announcement
        except Exception as e:
            print(f"Error in get_announcement_by_id: {str(e)}")
            raise

    def update_announcement(self, announcement_id, data):
        try:
            update_data = {
                "title": data["title"],
                "content": data["content"],
                "priority": data.get("priority", "normal"),
                "is_important": data.get("is_important", False),
                "updated_at": datetime.utcnow()
            }
            result = self.announcements_collection.update_one(
                {"_id": ObjectId(announcement_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error in update_announcement: {str(e)}")
            raise

    def delete_announcement(self, announcement_id):
        try:
            result = self.announcements_collection.delete_one({"_id": ObjectId(announcement_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error in delete_announcement: {str(e)}")
            raise

    def get_announcements_by_author(self, author_id):
        try:
            announcements = list(self.announcements_collection.find({"author_id": author_id}).sort("created_at", -1))
            for announcement in announcements:
                announcement["_id"] = str(announcement["_id"])
            return announcements
        except Exception as e:
            print(f"Error getting announcements by author: {str(e)}")
            raise 