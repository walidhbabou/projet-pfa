from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
import datetime
from ..services.announcement_service import AnnouncementService

announcement_bp = Blueprint("announcements", __name__)
announcement_service = None

def init_announcement_routes(db):
    global announcement_service
    print("Initializing announcement routes...")
    announcement_service = AnnouncementService(db['announcements'])

    def is_admin(email):
        user = db['users'].find_one({"email": email})
        is_admin_user = user and user.get("role") == "admin"
        print(f"Checking admin status for {email}: {is_admin_user}")
        return is_admin_user

    @announcement_bp.route("/announcements", methods=["POST"])
    @jwt_required()
    def create_announcement():
        try:
            print("Received POST request to create announcement")
            email = get_jwt_identity()
            print(f"User email: {email}")
            
            user = db['users'].find_one({"email": email})
            print(f"Found user: {user}")
            
            if not user or user.get("role") != "admin":
                print(f"Access denied for user {email}")
                return jsonify({"error": "Only admins can create announcements"}), 403

            data = request.get_json()
            print(f"Received data: {data}")
            
            if not data or not all(k in data for k in ["title", "content"]):
                print("Missing required fields in request")
                return jsonify({"error": "Missing required fields"}), 400

            announcement = announcement_service.create_announcement(
                data,
                str(user["_id"]),
                user.get("name", "")
            )
            print(f"Created announcement: {announcement}")
            
            return jsonify(announcement), 201
        except Exception as e:
            print(f"Error in create_announcement route: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    @announcement_bp.route("/announcements", methods=["GET"])
    def list_announcements():
        try:
            announcements = announcement_service.get_all_announcements()
            return jsonify(announcements)
        except Exception as e:
            print(f"Error listing announcements: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    @announcement_bp.route("/announcements/<announcement_id>", methods=["PUT"])
    @jwt_required()
    def update_announcement(announcement_id):
        try:
            email = get_jwt_identity()
            if not is_admin(email):
                return jsonify({"error": "Only admins can update announcements"}), 403

            data = request.get_json()
            if not data or not all(k in data for k in ["title", "content"]):
                return jsonify({"error": "Missing required fields"}), 400

            success = announcement_service.update_announcement(announcement_id, data)
            if not success:
                return jsonify({"error": "Announcement not found"}), 404

            return jsonify({"message": "Announcement updated"})
        except Exception as e:
            print(f"Error updating announcement: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    @announcement_bp.route("/announcements/<announcement_id>", methods=["DELETE"])
    @jwt_required()
    def delete_announcement(announcement_id):
        try:
            email = get_jwt_identity()
            if not is_admin(email):
                return jsonify({"error": "Only admins can delete announcements"}), 403

            success = announcement_service.delete_announcement(announcement_id)
            if not success:
                return jsonify({"error": "Announcement not found"}), 404

            return jsonify({"message": "Announcement deleted"})
        except Exception as e:
            print(f"Error deleting announcement: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    return announcement_bp 