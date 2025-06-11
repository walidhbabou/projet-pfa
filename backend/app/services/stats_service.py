from datetime import datetime, timedelta
from ..database.mongodb import get_users_collection, get_chat_history_collection

class StatsService:
    def __init__(self):
        self.users_collection = get_users_collection()
        self.chat_history_collection = get_chat_history_collection()

    def get_stats(self):
        try:
            total_users = self.users_collection.count_documents({})

            # Get active users (users who have logged in within the last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            active_users = self.users_collection.count_documents({
                "last_login": {"$gte": thirty_days_ago}
            })

            # Get total conversations
            total_conversations = self.chat_history_collection.count_documents({})

            # Get total announcements
            total_announcements = self.users_collection.count_documents({
                "type": "announcement"
            })

            return {
                "total_users": total_users,
                "active_users": active_users,
                "total_conversations": total_conversations,
                "total_announcements": total_announcements
            }
        except Exception as e:
            raise Exception(f"Error getting stats: {str(e)}")

    def get_activity_data(self, days=30):
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Get user activity
            user_activity = list(self.users_collection.aggregate([
                {
                    "$match": {
                        "last_login": {"$gte": start_date}
                    }
                },
                {
                    "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                                "date": "$last_login"
                            }
                        },
                        "users": {"$sum": 1}
                    }
                }
            ]))

            # Get conversation activity
            conversation_activity = list(self.chat_history_collection.aggregate([
                {
                    "$match": {
                        "created_at": {"$gte": start_date}
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$created_at"
                            }
                        },
                        "messages": {"$sum": 1}
                    }
                }
            ]))

            # Combine the data
            activity_data = []
            current_date = start_date
            while current_date <= datetime.utcnow():
                date_str = current_date.strftime("%Y-%m-%d")
                activity_data.append({
                    "date": date_str,
                    "users": 0,
                    "messages": 0
                })
                current_date += timedelta(days=1)

            # Fill in the actual data
            for user in user_activity:
                for activity in activity_data:
                    if activity["date"] == user["_id"]:
                        activity["users"] = user["users"]
                        break

            for conv in conversation_activity:
                for activity in activity_data:
                    if activity["date"] == conv["_id"]:
                        activity["messages"] = conv["messages"]
                        break

            return activity_data
        except Exception as e:
            raise Exception(f"Error getting activity data: {str(e)}")

    def get_user_types(self):
        try:
            # Get user types distribution
            user_types = list(self.users_collection.aggregate([
                {
                    "$group": {
                        "_id": "$role",
                        "value": {"$sum": 1}
                    }
                },
                {
                    "$project": {
                        "name": "$_id",
                        "value": 1,
                        "_id": 0
                    }
                }
            ]))

            return user_types
        except Exception as e:
            raise Exception(f"Error getting user types: {str(e)}") 