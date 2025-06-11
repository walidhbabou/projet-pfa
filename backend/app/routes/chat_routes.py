from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from bson.errors import InvalidId
from ..services.chat_service import ChatService

chat_bp = Blueprint('chat', __name__)
chat_service = None

def init_chat_routes(chat_history_collection, users_collection):
    global chat_service
    chat_service = ChatService(chat_history_collection, users_collection)

@chat_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        if 'message' not in data or not isinstance(data['message'], str):
            return jsonify({"success": False, "error": "Valid message is required"}), 400

        current_user_id = get_jwt_identity()
        print(f"[chat_routes.py] chat(): current_user_id from JWT: {current_user_id}")
        if not current_user_id:
            return jsonify({"success": False, "error": "User not authenticated"}), 401
        
        try:
            user_id_obj = ObjectId(current_user_id)
            print(f"[chat_routes.py] chat(): Converted user_id_obj: {user_id_obj}")
        except InvalidId:
            print(f"[chat_routes.py] chat(): Invalid ObjectId received for user_id: {current_user_id}")
            return jsonify({"success": False, "error": "Invalid user ID format"}), 422

        message = data['message'].strip()
        session_id = data.get('session_id')
        if session_id and not isinstance(session_id, str):
            return jsonify({"success": False, "error": "Invalid session_id format"}), 400

        response = chat_service.get_rasa_response(message)

        session_id = chat_service.save_to_chat_history(
            user_id=user_id_obj,
            message=message,
            response=response,
            session_id=session_id
        )

        return jsonify({
            "success": True,
            "data": {
                "response": response,
                "session_id": session_id
            }
        })

    except Exception as e:
        print(f"[chat_routes.py] Chat error: {e}")
        return jsonify({"success": False, "error": "Failed to process message"}), 500

@chat_bp.route('/chat/history', methods=['GET'])
@jwt_required()
def get_user_chat_history():
    try:
        current_user_id = get_jwt_identity()
        print(f"[chat_routes.py] get_user_chat_history(): current_user_id from JWT: {current_user_id}")
        if not current_user_id:
            return jsonify({"success": False, "error": "User not authenticated"}), 401
            
        try:
            user_id_obj = ObjectId(current_user_id)
            print(f"[chat_routes.py] get_user_chat_history(): Converted user_id_obj: {user_id_obj}")
        except InvalidId:
            print(f"[chat_routes.py] get_user_chat_history(): Invalid ObjectId received for user_id: {current_user_id}")
            return jsonify({"success": False, "error": "Invalid user ID format"}), 422
        
        limit = request.args.get('limit', 50, type=int)
        if limit < 1 or limit > 100:
            limit = 50
        history = chat_service.get_user_chat_history(user_id_obj, limit)
        return jsonify({
            "success": True,
            "data": history
        })
    except Exception as e:
        print(f"[chat_routes.py] Get chat history error: {e}")
        return jsonify({"success": False, "error": "Failed to get chat history"}), 500

@chat_bp.route('/chat/sessions', methods=['GET'])
@jwt_required()
def get_user_sessions():
    try:
        current_user_id = get_jwt_identity()
        print(f"[chat_routes.py] get_user_sessions(): current_user_id from JWT: {current_user_id}")
        if not current_user_id:
            return jsonify({"success": False, "error": "User not authenticated"}), 401
        
        try:
            user_id_obj = ObjectId(current_user_id)
            print(f"[chat_routes.py] get_user_sessions(): Converted user_id_obj: {user_id_obj}")
        except InvalidId:
            print(f"[chat_routes.py] get_user_sessions(): Invalid ObjectId received for user_id: {current_user_id}")
            return jsonify({"success": False, "error": "Invalid user ID format"}), 422

        sessions = chat_service.get_user_sessions(user_id_obj)
        return jsonify({
            "success": True,
            "data": sessions
        })
    except Exception as e:
        print(f"[chat_routes.py] Get sessions error: {e}")
        return jsonify({"success": False, "error": "Failed to get chat sessions"}), 500

@chat_bp.route('/chat/history/<session_id>', methods=['GET'])
@jwt_required()
def get_session_history(session_id):
    try:
        if not session_id or not isinstance(session_id, str):
            return jsonify({"success": False, "error": "Invalid session_id"}), 400
            
        current_user_id = get_jwt_identity()
        print(f"[chat_routes.py] get_session_history(): current_user_id from JWT: {current_user_id}")
        if not current_user_id:
            return jsonify({"success": False, "error": "User not authenticated"}), 401
        
        try:
            user_id_obj = ObjectId(current_user_id)
            print(f"[chat_routes.py] get_session_history(): Converted user_id_obj: {user_id_obj}")
        except InvalidId:
            print(f"[chat_routes.py] get_session_history(): Invalid ObjectId received for user_id: {current_user_id}")
            return jsonify({"success": False, "error": "Invalid user ID format"}), 422

        history = chat_service.get_session_history(session_id, user_id_obj)
        return jsonify({
            "success": True,
            "data": history
        })
    except Exception as e:
        print(f"[chat_routes.py] Get session history error: {e}")
        return jsonify({"success": False, "error": "Failed to get session history"}), 500 