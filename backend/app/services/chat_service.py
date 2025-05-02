import requests
import uuid
from datetime import datetime, timedelta
from bson import ObjectId
from ..config.config import Config

class ChatService:
    def __init__(self, chat_history_collection):
        self.chat_history_collection = chat_history_collection

    def get_rasa_response(self, message):
        try:
            response = requests.post(
                f"{Config.RASA_API_URL}/webhooks/rest/webhook",
                json={"message": message}
            )
            if response.status_code == 200:
                return response.json()[0]["text"] if response.json() else "Je suis désolé, je n'ai pas compris votre message."
            return "Désolé, je rencontre des problèmes techniques."
        except Exception as e:
            print(f"Rasa error: {e}")
            return "Désolé, je rencontre des problèmes techniques."

    def save_to_chat_history(self, user_id, message, response, session_id=None):
        if not session_id:
            session_id = str(uuid.uuid4())

        chat_entry = {
            "user_id": user_id,
            "session_id": session_id,
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow()
        }
        
        try:
            self.chat_history_collection.insert_one(chat_entry)
            print(f"Message saved to chat history for session {session_id}")
            return session_id
        except Exception as e:
            print(f"Error saving to chat history: {e}")
            raise

    def get_user_chat_history(self, user_id, limit=50):
        try:
            history = list(self.chat_history_collection
                .find({"user_id": user_id})
                .sort("timestamp", -1)
                .limit(limit))
            
            # Convertir les ObjectId en str pour la sérialisation JSON
            for entry in history:
                if '_id' in entry:
                    entry['_id'] = str(entry['_id'])
            
            return history
        except Exception as e:
            print(f"Error getting user chat history: {e}")
            return []

    def get_user_sessions(self, user_id):
        try:
            pipeline = [
                {"$match": {"user_id": user_id}},
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
            print(f"Retrieved {len(sessions)} sessions for user {user_id}")
            return sessions
        except Exception as e:
            print(f"Error getting user sessions: {e}")
            return []

    def get_session_history(self, session_id, user_id):
        try:
            history = list(self.chat_history_collection
                .find({"session_id": session_id, "user_id": user_id})
                .sort("timestamp", 1))
            
            # Convertir les ObjectId en str pour la sérialisation JSON
            for entry in history:
                if '_id' in entry:
                    entry['_id'] = str(entry['_id'])
            
            print(f"Retrieved {len(history)} messages for session {session_id}")
            return history
        except Exception as e:
            print(f"Error getting session history: {e}")
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