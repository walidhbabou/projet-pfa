from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.chat_service import ChatService

chat_bp = Blueprint('chat', __name__)
chat_service = None

def init_chat_routes(chat_history_collection):
    global chat_service
    chat_service = ChatService(chat_history_collection)

@chat_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required"}), 400

        user_id = get_jwt_identity()
        message = data['message']
        session_id = data.get('session_id')

        # Get response from Rasa
        response = chat_service.get_rasa_response(message)

        # Save to chat history
        session_id = chat_service.save_to_chat_history(
            user_id=user_id,
            message=message,
            response=response,
            session_id=session_id
        )

        return jsonify({
            "response": response,
            "session_id": session_id
        })

    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"error": "Failed to process message"}), 500

@chat_bp.route('/chat/history', methods=['GET'])
@jwt_required()
def get_user_chat_history():
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 50, type=int)
        history = chat_service.get_user_chat_history(user_id, limit)
        return jsonify(history)
    except Exception as e:
        print(f"Get chat history error: {e}")
        return jsonify({"error": "Failed to get chat history"}), 500

@chat_bp.route('/chat/sessions', methods=['GET'])
@jwt_required()
def get_user_sessions():
    try:
        user_id = get_jwt_identity()
        sessions = chat_service.get_user_sessions(user_id)
        return jsonify(sessions)
    except Exception as e:
        print(f"Get sessions error: {e}")
        return jsonify({"error": "Failed to get chat sessions"}), 500

@chat_bp.route('/chat/history/<session_id>', methods=['GET'])
@jwt_required()
def get_session_history(session_id):
    try:
        user_id = get_jwt_identity()
        history = chat_service.get_session_history(session_id, user_id)
        return jsonify(history)
    except Exception as e:
        print(f"Get session history error: {e}")
        return jsonify({"error": "Failed to get session history"}), 500 