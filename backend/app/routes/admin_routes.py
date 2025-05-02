from flask import Blueprint, jsonify, request
from ..middleware.auth_middleware import admin_required, token_required
from ..services.stats_service import StatsService
from ..services.user_service import UserService
from ..services.faq_service import FAQService
from ..services.auth_service import AuthService
from ..database.mongodb import get_faqs_collection, get_users_collection

admin_routes = Blueprint('admin', __name__)
stats_service = StatsService()
user_service = UserService()

faq_service = FAQService(get_faqs_collection())
auth_service = AuthService(get_users_collection())

@admin_routes.route('/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    try:
        period = request.args.get('period', 'month')
        stats = stats_service.get_user_stats(period)
        return jsonify(stats), 200
    except Exception as e:
        print(f"Error getting admin stats: {str(e)}")
        return jsonify({"error": str(e)}), 500

@admin_routes.route('/admin/stats/user-types', methods=['GET'])
@admin_required
def get_user_types():
    try:
        users_collection = get_users_collection()
        pipeline = [
            {"$group": {
                "_id": "$role",
                "count": {"$sum": 1}
            }},
            {"$project": {
                "type": "$_id",
                "count": 1,
                "_id": 0
            }}
        ]
        user_types = list(users_collection.aggregate(pipeline))
        return jsonify(user_types), 200
    except Exception as e:
        print(f"Error getting user types: {str(e)}")
        return jsonify({"error": str(e)}), 500

@admin_routes.route('/admin/stats/detailed', methods=['GET'])
@admin_required
def get_detailed_stats():
    try:
        period = request.args.get('period', 'month')
        stats = stats_service.get_detailed_stats(period)
        return jsonify(stats), 200
    except Exception as e:
        print(f"Error getting detailed stats: {str(e)}")
        return jsonify({"error": str(e)}), 500

@admin_routes.route('/admin/users', methods=['GET'])
@admin_required
def get_users(current_user=None):
    try:
        users = user_service.get_all_users()
        return jsonify({
            "success": True,
            "data": users
        }), 200
    except Exception as e:
        print(f"Erreur lors de la récupération des utilisateurs: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Erreur lors de la récupération des utilisateurs"
        }), 500

@admin_routes.route('/admin/users/<user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    try:
        data = request.get_json()
        updated_user = user_service.update_user(user_id, data)
        return jsonify({
            "success": True,
            "data": updated_user
        }), 200
    except Exception as e:
        print(f"Erreur lors de la mise à jour de l'utilisateur: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Erreur lors de la mise à jour de l'utilisateur"
        }), 500

@admin_routes.route('/admin/users/<user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    try:
        user_service.delete_user(user_id)
        return jsonify({
            "success": True,
            "message": "Utilisateur supprimé avec succès"
        }), 200
    except Exception as e:
        print(f"Erreur lors de la suppression de l'utilisateur: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Erreur lors de la suppression de l'utilisateur"
        }), 500

# Handler pour les requêtes OPTIONS
@admin_routes.route('/admin/faq', methods=['OPTIONS'])
def options_admin_faq():
    return '', 200

@admin_routes.route('/admin/faq/<id>', methods=['OPTIONS'])
def options_admin_faq_id(id):
    return '', 200
