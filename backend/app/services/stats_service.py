from datetime import datetime, timedelta
from ..database.mongodb import get_users_collection, get_chat_history_collection, get_faqs_collection

class StatsService:
    def __init__(self):
        self.users_collection = get_users_collection()
        self.chat_history_collection = get_chat_history_collection()
        self.faq_collection = get_faqs_collection()

    def get_user_stats(self, period='month'):
        """Récupère les statistiques des utilisateurs pour une période donnée"""
        if period == 'week':
            since = datetime.utcnow() - timedelta(days=7)
        elif period == 'month':
            since = datetime.utcnow() - timedelta(days=30)
        elif period == 'year':
            since = datetime.utcnow() - timedelta(days=365)
        else:
            since = datetime.utcnow() - timedelta(days=30)

        # Statistiques des utilisateurs
        total_users = self.users_collection.count_documents({})
        
        # Nombre de conversations uniques
        chat_count = len(self.chat_history_collection.distinct("session_id"))
        
        # Nombre de réponses FAQ
        faq_count = self.faq_collection.count_documents({})

        # Distribution des types d'utilisateurs
        user_types = list(self.users_collection.aggregate([
            {"$group": {
                "_id": "$role",
                "count": {"$sum": 1}
            }},
            {"$project": {
                "name": "$_id",
                "value": "$count",
                "_id": 0
            }}
        ]))

        # Activité des utilisateurs
        activity_data = list(self.chat_history_collection.aggregate([
            {"$match": {
                "timestamp": {"$gte": since}
            }},
            {"$group": {
                "_id": {
                    "year": {"$year": "$timestamp"},
                    "month": {"$month": "$timestamp"},
                    "day": {"$dayOfMonth": "$timestamp"}
                },
                "messages": {"$sum": 1},
                "users": {"$addToSet": "$user_id"}
            }},
            {"$sort": {"_id": 1}},
            {"$project": {
                "date": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": {
                            "$dateFromParts": {
                                "year": "$_id.year",
                                "month": "$_id.month",
                                "day": "$_id.day"
                            }
                        }
                    }
                },
                "messages": 1,
                "users": {"$size": "$users"},
                "_id": 0
            }}
        ]))

        return {
            "total_users": total_users,
            "chat_count": chat_count,
            "faq_count": faq_count,
            "user_types": user_types,
            "activity_data": activity_data
        }

    def get_detailed_stats(self, period='month'):
        """Récupère des statistiques détaillées pour une période donnée"""
        if period == 'week':
            since = datetime.utcnow() - timedelta(days=7)
        elif period == 'month':
            since = datetime.utcnow() - timedelta(days=30)
        elif period == 'year':
            since = datetime.utcnow() - timedelta(days=365)
        else:
            since = datetime.utcnow() - timedelta(days=30)

        # Statistiques détaillées
        daily_stats = list(self.chat_history_collection.aggregate([
            {"$match": {
                "timestamp": {"$gte": since}
            }},
            {"$group": {
                "_id": {
                    "year": {"$year": "$timestamp"},
                    "month": {"$month": "$timestamp"},
                    "day": {"$dayOfMonth": "$timestamp"}
                },
                "messageCount": {"$sum": 1},
                "userCount": {"$addToSet": "$user_id"},
                "responseTimes": {"$push": "$response_time"}
            }},
            {"$sort": {"_id": 1}},
            {"$project": {
                "date": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": {
                            "$dateFromParts": {
                                "year": "$_id.year",
                                "month": "$_id.month",
                                "day": "$_id.day"
                            }
                        }
                    }
                },
                "messageCount": 1,
                "userCount": {"$size": "$userCount"},
                "avgResponseTime": {"$avg": "$responseTimes"},
                "_id": 0
            }}
        ]))

        return {
            "dailyStats": daily_stats
        }

    def get_stats(self, period='month'):
        try:
            # Calculer la date de début en fonction de la période
            if period == 'day':
                start_date = datetime.now() - timedelta(days=1)
            elif period == 'week':
                start_date = datetime.now() - timedelta(weeks=1)
            else:  # month par défaut
                start_date = datetime.now() - timedelta(days=30)

            # Récupérer les statistiques
            total_users = self.users_collection.count_documents({})
            chat_count = self.chat_history_collection.count_documents({
                'timestamp': {'$gte': start_date}
            })
            faq_count = self.faq_collection.count_documents({})

            # Récupérer la répartition des types d'utilisateurs
            user_types = self.users_collection.aggregate([
                {'$group': {'_id': '$role', 'count': {'$sum': 1}}}
            ])
            user_types = {doc['_id']: doc['count'] for doc in user_types}

            # Récupérer les données d'activité
            activity_data = self.chat_history_collection.aggregate([
                {
                    '$match': {
                        'timestamp': {'$gte': start_date}
                    }
                },
                {
                    '$group': {
                        '_id': {
                            '$dateToString': {
                                'format': '%Y-%m-%d',
                                'date': '$timestamp'
                            }
                        },
                        'count': {'$sum': 1}
                    }
                },
                {'$sort': {'_id': 1}}
            ])
            activity_data = [{'date': doc['_id'], 'count': doc['count']} for doc in activity_data]

            return {
                'total_users': total_users,
                'chat_count': chat_count,
                'faq_count': faq_count,
                'user_types': user_types,
                'activity_data': activity_data
            }

        except Exception as e:
            print(f"Erreur dans get_stats: {str(e)}")
            raise 