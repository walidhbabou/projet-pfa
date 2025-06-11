import requests
import uuid
from datetime import datetime, timedelta
from bson import ObjectId, errors as bson_errors
from ..config.config import Config

class ChatService:
    def __init__(self, chat_history_collection, users_collection):
        self.chat_history_collection = chat_history_collection
        self.users_collection = users_collection

    def get_rasa_response(self, message):
        try:
            if not message or not isinstance(message, str):
                return "Message invalide. Veuillez réessayer."

            print(f"\n=== Communication avec Rasa ===")
            print(f"Message à envoyer: {message}")
            print(f"URL Rasa: {Config.RASA_API_URL}/webhooks/rest/webhook")
            
            # Configuration de la requête
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            payload = {
                "sender": "user",
                "message": message
            }
            
            print(f"Payload: {payload}")
            print(f"Headers: {headers}")
            
            # Envoi de la requête
            response = requests.post(
                f"{Config.RASA_API_URL}/webhooks/rest/webhook",
                json=payload,
                headers=headers,
                timeout=15
            )
            
            print(f"Réponse de Rasa - Status: {response.status_code}")
            print(f"Réponse de Rasa - Headers: {response.headers}")
            print(f"Réponse de Rasa - Contenu: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Données parsées: {data}")
                
                if data and len(data) > 0:
                    if "text" in data[0]:
                        return data[0]["text"]
                    elif "custom" in data[0]:
                        return data[0]["custom"]
                    else:
                        print(f"Format de réponse inattendu: {data[0]}")
                        return "Je suis désolé, je n'ai pas compris votre message."
                else:
                    print("Réponse vide de Rasa")
                return "Je suis désolé, je n'ai pas compris votre message."
            else:
                print(f"Erreur HTTP: {response.status_code}")
            return "Désolé, je rencontre des problèmes techniques."
                
        except requests.Timeout:
            print("Timeout lors de la communication avec Rasa")
            return "Désolé, le service est temporairement indisponible. Veuillez réessayer plus tard."
        except requests.RequestException as e:
            print(f"Erreur de communication avec Rasa: {e}")
            return "Désolé, je rencontre des problèmes techniques."
        except Exception as e:
            print(f"Erreur inattendue: {e}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return "Désolé, une erreur inattendue s'est produite."

    def save_to_chat_history(self, user_id, message, response, session_id=None):
        try:
            if not user_id or not message or not response:
                raise ValueError("Données manquantes pour l'enregistrement du chat")

            if not session_id:
                session_id = str(uuid.uuid4())
            elif not isinstance(session_id, str):
                raise ValueError("Format de session_id invalide")

            chat_entry = {
                "user_id": user_id,
                "session_id": session_id,
                "message": message,
                "response": response,
                "timestamp": datetime.utcnow()
            }
            
            result = self.chat_history_collection.insert_one(chat_entry)
            if not result.inserted_id:
                raise Exception("Échec de l'insertion dans l'historique")
                
            print(f"Message enregistré dans l'historique pour la session {session_id}")
            return session_id
        except ValueError as e:
            print(f"Erreur de validation: {e}")
            raise
        except Exception as e:
            print(f"Erreur lors de l'enregistrement dans l'historique: {e}")
            raise

    def get_user_chat_history(self, user_id_obj, limit=50):
        try:
            if not user_id_obj:
                return []
                
            if not isinstance(limit, int) or limit < 1:
                limit = 50
            
            # Find the user by ObjectId to get their email (for older entries)
            user_data = self.users_collection.find_one({"_id": user_id_obj})
            user_email = user_data['email'] if user_data and 'email' in user_data else None

            # Query for chat history using either the ObjectId or the email
            query = {"$or": [{'user_id': user_id_obj}]}
            if user_email:
                query['$or'].append({'user_id': user_email})

            history = list(self.chat_history_collection
                .find(query)
                .sort("timestamp", -1)
                .limit(limit))
            
            for entry in history:
                if '_id' in entry:
                    entry['_id'] = str(entry['_id'])
            
            return history
        except Exception as e:
            print(f"Erreur lors de la récupération de l'historique: {e}")
            return []

    def get_user_sessions(self, user_id_obj):
        try:
            if not user_id_obj:
                return []
                
            # Find the user by ObjectId to get their email (for older entries)
            user_data = self.users_collection.find_one({"_id": user_id_obj})
            user_email = user_data['email'] if user_data and 'email' in user_data else None

            # Query for sessions using either the ObjectId or the email
            query = {"$or": [{'user_id': user_id_obj}]}
            if user_email:
                query['$or'].append({'user_id': user_email})

            pipeline = [
                {"$match": query},
                {"$group": {
                    "_id": "$session_id",
                    "last_message": {"$last": "$message"},
                    "last_timestamp": {"$last": "$timestamp"},
                    "message_count": {"$sum": 1}
                }},
                {"$sort": {"last_timestamp": -1}},
                {"$project": {
                    "session_id": "$_id",
                    "last_message": 1,
                    "last_timestamp": 1,
                    "message_count": 1,
                    "_id": 0
                }}
            ]
            sessions = list(self.chat_history_collection.aggregate(pipeline))
            print(f"Récupération de {len(sessions)} sessions pour l'utilisateur {user_id_obj}")
            return sessions
        except Exception as e:
            print(f"Erreur lors de la récupération des sessions: {e}")
            return []

    def get_session_history(self, session_id: str, user_id_input):
        try:
            if not session_id:
                print("Erreur: session_id manquant.")
                return []
            if not user_id_input:
                print("Erreur: user_id_input manquant.")
                return []

            user_id_obj = None
            if isinstance(user_id_input, ObjectId):
                user_id_obj = user_id_input
            elif isinstance(user_id_input, str):
                try:
                    user_id_obj = ObjectId(user_id_input)
                except bson_errors.InvalidId:
                    print(f"Erreur: user_id_input '{user_id_input}' n'est pas un ObjectId valide.")
                    return []
            else:
                print(f"Erreur: Type de user_id_input ({type(user_id_input)}) non supporté.")
                return []

            # Find the user by ObjectId to get their email (for older entries, if needed)
            user_data = self.users_collection.find_one({"_id": user_id_obj})
            user_email = None
            if user_data and 'email' in user_data:
                user_email = user_data['email']
            
            user_match_conditions = [{'user_id': user_id_obj}]
            if user_email:
                # Ensure user_email is not the same as user_id_obj if user_id was stored as string email previously
                if str(user_id_obj) != user_email: 
                    user_match_conditions.append({'user_id': user_email})
            
            mongo_query = {
                "session_id": session_id,
                "$or": user_match_conditions
            }

            history = list(self.chat_history_collection
                           .find(mongo_query)
                           .sort("timestamp", 1))
            
            processed_history = []
            for entry in history:
                if '_id' in entry:
                    entry['_id'] = str(entry['_id']) # Convert ObjectId to string for JSON serialization
                if 'user_id' in entry and isinstance(entry['user_id'], ObjectId):
                    entry['user_id'] = str(entry['user_id'])
                processed_history.append(entry)
            
            print(f"Récupération de {len(processed_history)} messages pour la session {session_id} et utilisateur {user_id_obj}")
            return processed_history
        except Exception as e:
            import traceback # Import traceback here for locality
            print(f"Erreur détaillée lors de la récupération de l'historique de session pour session_id='{session_id}', user_id_input='{user_id_input}': {e}")
            print(traceback.format_exc())
            return []

    def count_conversations(self):
        return len(self.chat_history_collection.distinct("session_id"))

    def count_active_users(self, since):
        return len(self.chat_history_collection.distinct("user_id", 
            {"timestamp": {"$gte": since}}))

    def average_response_time(self, since):
        pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {"$group": {
                "_id": "$session_id",
                "avg_time": {"$avg": {"$subtract": ["$timestamp", "$timestamp"]}}
            }},
            {"$group": {
                "_id": None,
                "overall_avg": {"$avg": "$avg_time"}
            }}
        ]
        result = list(self.chat_history_collection.aggregate(pipeline))
        return result[0]["overall_avg"] if result else 0

    def calculate_resolution_rate(self, since):
        pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {"$group": {
                "_id": None,
                "total": {"$sum": 1},
                "resolved": {
                    "$sum": {
                        "$cond": [
                            {"$ne": ["$response", "Désolé, je rencontre des problèmes techniques."]},
                            1,
                            0
                        ]
                    }
                }
            }}
        ]
        result = list(self.chat_history_collection.aggregate(pipeline))
        if not result:
            return 0
        total = result[0]["total"]
        resolved = result[0]["resolved"]
        return (resolved / total * 100) if total > 0 else 0

    def get_activity_data(self, since):
        pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {"$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$timestamp"
                    }
                },
                "users": {"$addToSet": "$user_id"},
                "messages": {"$sum": 1}
            }},
            {"$project": {
                "date": "$_id",
                "users": {"$size": "$users"},
                "messages": 1,
                "_id": 0
            }},
            {"$sort": {"date": 1}}
        ]
        return list(self.chat_history_collection.aggregate(pipeline))

    def get_user_type_distribution(self):
        pipeline = [
            {"$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "_id",
                "as": "user"
            }},
            {"$unwind": "$user"},
            {"$group": {
                "_id": "$user.role",
                "count": {"$sum": 1}
            }},
            {"$project": {
                "name": "$_id",
                "value": "$count",
                "_id": 0
            }}
        ]
        return list(self.chat_history_collection.aggregate(pipeline))