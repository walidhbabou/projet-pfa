from ..database.mongodb import get_chat_history_collection, get_users_collection, get_conversations_collection, get_announcements_collection
from datetime import datetime, timedelta

class AdminService:
    def __init__(self):
        self.users_collection = get_users_collection()
        self.chat_history_collection = get_chat_history_collection() 
        self.announcements_collection = get_announcements_collection()  # <-- ajoute ceci

    def get_stats(self):
        try:
            # Get total users
            total_users = self.users_collection.count_documents({})
            
            # Get active users (users who have logged in within the last 30 days)
            active_users = self.users_collection.count_documents({
                "last_login": {"$exists": True}
            })
            
            # Get total conversations
            total_conversations = self.chat_history_collection.count_documents({})

            # Get total announcements
            total_announcements = self.announcements_collection.count_documents({})  # <-- corrige ici

            return {
                "success": True,
                "data": {
                    "total_users": total_users,
                    "active_users": active_users,
                    "total_conversations": total_conversations,
                    "total_announcements": total_announcements  # <-- Ajout ici
                }
            }
        except Exception as e:
            return {
                "success": False,
                "message": str(e)
            }

    def get_users_paginated(self, page=1, limit=10, search=None):
        try:
            # Build query
            query = {}
            if search:
                query = {
                    "$or": [
                        {"name": {"$regex": search, "$options": "i"}},
                        {"email": {"$regex": search, "$options": "i"}}
                    ]
                }

            # Get total count
            total = self.users_collection.count_documents(query)

            # Get paginated users
            users = list(self.users_collection.find(
                query,
                {"password": 0}  # Exclude password field
            ).skip((page - 1) * limit).limit(limit))

            return {
                "success": True,
                "data": users,
                "total": total
            }
        except Exception as e:
            return {
                "success": False,
                "message": str(e)
            }

    def get_announcements_paginated(self, page=1, limit=10, search=None):
        try:
            # Build query
            query = {}
            if search:
                query = {
                    "$or": [
                        {"title": {"$regex": search, "$options": "i"}},
                        {"content": {"$regex": search, "$options": "i"}}
                    ]
                }

            # Get total count
            total = self.users_collection.count_documents({
                "type": "announcement",
                **query
            })

            # Get paginated announcements
            announcements = list(self.users_collection.find(
                {"type": "announcement", **query}
            ).skip((page - 1) * limit).limit(limit))

            return {
                "success": True,
                "data": announcements,
                "total": total
            }
        except Exception as e:
            return {
                "success": False,
                "message": str(e)
            }

    def create_user(self, user_data):
        try:
            # Vérifier si l'utilisateur existe déjà
            existing_user = self.users_collection.find_one({"email": user_data["email"]})
            if existing_user:
                return {
                    "success": False,
                    "message": "Un utilisateur avec cet email existe déjà"
                }

            # Créer le nouvel utilisateur
            result = self.users_collection.insert_one({
                "name": user_data["name"],
                "email": user_data["email"],
                "password": user_data["password"],  # Note: Le mot de passe devrait être hashé
                "role": user_data["role"],
                "created_at": datetime.utcnow(),
                "last_login": None
            })

            if result.inserted_id:
                return {
                    "success": True,
                    "message": "Utilisateur créé avec succès",
                    "data": {
                        "_id": str(result.inserted_id),
                        "name": user_data["name"],
                        "email": user_data["email"],
                        "role": user_data["role"]
                    }
                }
            else:
                return {
                    "success": False,
                    "message": "Erreur lors de la création de l'utilisateur"
                }
        except Exception as e:
            return {
                "success": False,
                "message": str(e)
            }

    def get_activity_stats(self, days=7):
        print(">>> get_activity_stats appelé avec days =", days)
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days-1)
            
            pipeline = [
                {
                    "$match": {
                        "timestamp": {
                            "$gte": start_date,
                            "$lte": end_date
                        }
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "date": { "$dateToString": { "format": "%Y-%m-%d", "date": "$timestamp" } },
                            "user_id": "$user_id"
                        },
                        "message_count": { "$sum": 1 }
                    }
                },
                {
                    "$group": {
                        "_id": "$_id.date",
                        "users": { "$addToSet": "$_id.user_id" },
                        "messages": { "$sum": "$message_count" }
                    }
                },
                {
                    "$project": {
                        "date": "$_id",
                        "users": { "$size": "$users" },
                        "messages": 1,
                        "_id": 0
                    }
                },
                {
                    "$sort": { "date": 1 }
                }
            ]
            
            # Correction ici : utiliser chat_history_collection
            results = list(self.chat_history_collection.aggregate(pipeline))

            # Générer toutes les dates de la période
            date_list = [
                (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
                for i in range(days)
            ]
            result_by_date = {r["date"]: r for r in results}

            activity_data = []
            for date in date_list:
                r = result_by_date.get(date, {})
                activity_data.append({
                    "date": date,
                    "users": r.get("users", 0),
                    "messages": r.get("messages", 0)
                })

            print("\n=== Données d'activité retenues ===")
            for entry in activity_data:
                print(entry)
            print("=== Fin des données d'activité ===\n")

            return {
                "success": True,
                "data": {
                    "activity_data": activity_data
                }
            }
        except Exception as e:
            return {
                "success": False,
                "message": str(e)
            }

    def get_user_message_stats(self, days=7):
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days-1)
        pipeline = [
            {"$match": {
                "timestamp": {"$gte": start_date, "$lte": end_date}
            }},
            {"$group": {
                "_id": "$user_id",
                "message_count": {"$sum": 1}
            }},
            {"$sort": {"message_count": -1}}
        ]
        results = list(self.chat_history_collection.aggregate(pipeline))
        # Récupérer les infos utilisateurs
        user_ids = [r["_id"] for r in results if r["_id"]]
        users = {str(u["_id"]): u for u in self.users_collection.find({"_id": {"$in": user_ids}})}
        # Fusionner
        stats = []
        for r in results:
            user = users.get(str(r["_id"]))
            stats.append({
                "user_id": str(r["_id"]),
                "name": user["name"] if user else "Inconnu",
                "email": user["email"] if user else "",
                "message_count": r["message_count"]
            })
        return {
            "success": True,
            "data": stats
        }

