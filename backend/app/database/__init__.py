from .mongodb import (
    init_db,
    get_db,
    get_users_collection,
    get_chat_history_collection,
    get_faqs_collection,
    get_announcements_collection
)
from werkzeug.security import generate_password_hash
import os

def create_initial_admin(users_collection):
    admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@fsts.ma")
    admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "Admin123!")
    
    if not users_collection.find_one({"role": "admin"}):
        users_collection.insert_one({
            "email": admin_email,
            "password": generate_password_hash(admin_password),
            # ... autres champs ...
        })

__all__ = [
    'init_db',
    'get_db',
    'get_users_collection',
    'get_chat_history_collection',
    'get_faqs_collection',
    'get_announcements_collection'
]