from pymongo import MongoClient, ASCENDING, TEXT
from ..config.config import Config

# Global MongoDB client and database instances
client = None
db = None

def init_db():
    """Initialize MongoDB connection and create collections if they don't exist"""
    global client, db
    try:
        # Connect to MongoDB
        client = MongoClient(Config.MONGO_URI)
        db = client.get_default_database()
        
        # Ensure collections exist and create them if they don't
        if 'faqs' not in db.list_collection_names():
            print("Creating FAQs collection...")
            db.create_collection('faqs')
            # Create indexes for FAQs
            db.faqs.create_index([("id", ASCENDING)], unique=True)
            db.faqs.create_index([("question", TEXT)])
            db.faqs.create_index([("category", ASCENDING)])
            print("FAQs collection created successfully")
        
        if 'announcements' not in db.list_collection_names():
            print("Creating announcements collection...")
            db.create_collection('announcements')
            # Create indexes for announcements
            db.announcements.create_index([("created_at", ASCENDING)])
            db.announcements.create_index([("author_id", ASCENDING)])
            print("Announcements collection created successfully")
        
        print("MongoDB connection established successfully")
        
        # Return client and collections dictionary
        return client, {
            'users': db.users,
            'chat_history': db.chat_history,
            'faqs': db.faqs,
            'announcements': db.announcements
        }
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise

def get_db():
    """Get database instance"""
    global db
    if db is None:
        init_db()
    return db

def get_users_collection():
    """Get users collection"""
    db = get_db()
    return db.users

def get_chat_history_collection():
    """Get chat history collection"""
    db = get_db()
    return db.chat_history

def get_faqs_collection():
    """Get FAQs collection"""
    db = get_db()
    if 'faqs' not in db.list_collection_names():
        print("Creating FAQs collection...")
        db.create_collection('faqs')
        db.faqs.create_index([("id", ASCENDING)], unique=True)
        db.faqs.create_index([("question", TEXT)])
        db.faqs.create_index([("category", ASCENDING)])
    return db.faqs

def get_announcements_collection():
    """Get announcements collection"""
    db = get_db()
    if 'announcements' not in db.list_collection_names():
        print("Creating announcements collection on demand...")
        db.create_collection('announcements')
        db.announcements.create_index([("created_at", ASCENDING)])
        db.announcements.create_index([("author_id", ASCENDING)])
    return db.announcements 
def create_initial_admin(users_collection):
    if not users_collection.find_one({"role": "admin"}):
        from werkzeug.security import generate_password_hash
        admin_password = generate_password_hash("Admin123!")  # Changez ce mot de passe
        users_collection.insert_one({
            "email": "admin@fsts.ma",
            "password": "Admin123!",
            "name": "Admin FSTS",
            "role": "admin",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        print("✔ Admin créé avec succès")