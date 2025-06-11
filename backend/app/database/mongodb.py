from pymongo import MongoClient, ASCENDING, TEXT
from ..config.config import Config

# Global MongoDB client and database instances
client = None
db = None

def init_db():
    """Initialize MongoDB connection and create collections if they don't exist"""
    global client, db
    try:
        print("🔄 Initialisation de la base de données...")
        print(f"Tentative de connexion à MongoDB: {Config.MONGO_URI}")
        # Connect to MongoDB
        client = MongoClient(Config.MONGO_URI)
        # Test the connection
        client.admin.command('ping')
        print("✅ Connexion à MongoDB réussie")
        
        db = client[Config.MONGO_DB_NAME]
        print(f"📚 Base de données: {Config.MONGO_DB_NAME}")
        
        # Ensure collections exist and create them if they don't
        if 'users' not in db.list_collection_names():
            print("📦 Création de la collection users...")
            db.create_collection('users')
            print("✅ Collection users créée avec succès")
        
        if 'announcements' not in db.list_collection_names():
            print("Creating announcements collection...")
            db.create_collection('announcements')
            # Create indexes for announcements
            db.announcements.create_index([("created_at", ASCENDING)])
            db.announcements.create_index([("author_id", ASCENDING)])
            print("Announcements collection created successfully")
        
        print("MongoDB connection established successfully")
        
        # Get collections after ensuring they exist
        collections = {
            'users': db.users,
            'chat_history': db.chat_history,
            'announcements': db.announcements
        }
        
        # Create initial admin user if none exists
        create_initial_admin(collections['users'])
        
        # Return client and collections
        return client, collections
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
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

def get_announcements_collection():
    """Get announcements collection"""
    db = get_db()
    if 'announcements' not in db.list_collection_names():
        print("Creating announcements collection on demand...")
        db.create_collection('announcements')
        db.announcements.create_index([("created_at", ASCENDING)])
        db.announcements.create_index([("author_id", ASCENDING)])
    return db.announcements 

def get_conversations_collection():
    """Get conversations collection"""
    db = get_db()
    if 'conversations' not in db.list_collection_names():
        print("Creating conversations collection on demand...")
        db.create_collection('conversations')
        db.conversations.create_index([("user_id", ASCENDING)])
        db.conversations.create_index([("created_at", ASCENDING)])
    return db.conversations

def create_initial_admin(users_collection):
    try:
        print("\n=== Vérification de l'admin initial ===")
        # Vérifier si un utilisateur avec le rôle 'admin' existe
        admin_count = users_collection.count_documents({"role": "admin"})
        print(f"Nombre d'admins trouvés: {admin_count}")
        
        if admin_count == 0:
            print("📝 Création d'un nouvel admin...")
            from werkzeug.security import generate_password_hash
            from datetime import datetime
            
            # Définir les informations de l'admin initial
            admin_email = "admin@fsts.ma"
            admin_password_raw = "Admin123!"
            admin_name = "Admin FSTS"
            
            # Hasher le mot de passe
            hashed_password = generate_password_hash(admin_password_raw)
            print(f"Hash du mot de passe généré: {hashed_password}")
            
            # Créer le document utilisateur pour l'admin
            admin_user = {
                "email": admin_email,
                "password": hashed_password,
                "name": admin_name,
                "role": "admin",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "is_active": True
            }
            
            print("📤 Tentative d'insertion de l'admin dans la base de données...")
            # Insérer l'utilisateur admin dans la collection
            result = users_collection.insert_one(admin_user)
            if result.inserted_id:
                print(f"✅ Utilisateur admin initial créé avec succès!")
                print(f"   Email: {admin_email}")
                print(f"   Mot de passe: {admin_password_raw}")
                print(f"   ID: {result.inserted_id}")
                
                # Vérifier que l'admin a bien été créé
                created_admin = users_collection.find_one({"email": admin_email})
                print(f"Vérification de l'admin créé: {created_admin}")
            else:
                print("❌ Échec de la création de l'utilisateur admin initial")
        else:
            print("✅ Un utilisateur admin existe déjà")
            # Afficher les informations de l'admin existant
            admin = users_collection.find_one({"role": "admin"})
            print(f"Informations de l'admin existant: {admin}")
    except Exception as e:
        print(f"❌ Erreur lors de la création de l'utilisateur admin initial: {str(e)}")
        print(f"   Type d'erreur: {type(e)}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        raise

def get_errors_collection():
    from . import db  # ou adapte selon ton import de la variable db
    return db['app_errors']  # ou le nom de ta collection d'erreurs