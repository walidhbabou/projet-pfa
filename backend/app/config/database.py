from pymongo import MongoClient
from .config import Config

def init_db():
    try:
        client = MongoClient(
            Config.MONGO_URI,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            serverSelectionTimeoutMS=5000,
            retryWrites=True,
            w="majority"
        )
        
        # Verify connection
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB!")
        
        db = client.get_database()
        
        # Initialize collections
        collections = {
            'users': db.users,
            'chat_history': db.chat_history,
            'faqs': db.faqs
        }
        
        # Create indexes
        collections['users'].create_index([("email", 1)], unique=True)
        collections['chat_history'].create_index([("user_id", 1)])
        collections['chat_history'].create_index([("timestamp", -1)])
        collections['faqs'].create_index([("question", "text")])
        
        return db, collections
        
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")
        raise 