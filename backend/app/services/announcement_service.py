from datetime import datetime
from bson import ObjectId

class AnnouncementService:
    def __init__(self, collection):
        self.collection = collection
        print(f"AnnouncementService initialized with collection: {collection}")

    def create_announcement(self, data, author_id, author_name):
        try:
            print(f"Creating announcement with data: {data}")
            announcement = {
                "title": data["title"],
                "content": data["content"],
                "type": data.get("type", "info"),
                "priority": data.get("priority", "normal"),
                "is_important": data.get("is_important", False),
                "author_id": author_id,
                "author_name": author_name,
                "created_at": datetime.utcnow(),
                "updated_at": None
            }
            print(f"Prepared announcement object: {announcement}")
            result = self.collection.insert_one(announcement)
            print(f"Insert result: {result.inserted_id}")
            announcement["_id"] = str(result.inserted_id)
            return announcement
        except Exception as e:
            print(f"Error in create_announcement: {str(e)}")
            raise

    def get_all_announcements(self):
        announcements = list(self.collection.find().sort("created_at", -1))
        for a in announcements:
            a["_id"] = str(a["_id"])
        return announcements

    def get_announcement_by_id(self, announcement_id):
        announcement = self.collection.find_one({"_id": ObjectId(announcement_id)})
        if announcement:
            announcement["_id"] = str(announcement["_id"])
        return announcement

    def update_announcement(self, announcement_id, data):
        update_data = {
            "title": data["title"],
            "content": data["content"],
            "priority": data.get("priority", "normal"),
            "is_important": data.get("is_important", False),
            "updated_at": datetime.utcnow()
        }
        result = self.collection.update_one(
            {"_id": ObjectId(announcement_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    def delete_announcement(self, announcement_id):
        result = self.collection.delete_one({"_id": ObjectId(announcement_id)})
        return result.deleted_count > 0

    def get_announcements_by_author(self, author_id):
        try:
            announcements = list(self.collection.find({"author_id": author_id}).sort("created_at", -1))
            for announcement in announcements:
                announcement["_id"] = str(announcement["_id"])
            return announcements
        except Exception as e:
            print(f"Error getting announcements by author: {str(e)}")
            return [] 