from flask import Blueprint, jsonify, request, Response
from ..middleware.auth_middleware import admin_required, token_required
from ..services.stats_service import StatsService
from ..services.user_service import UserService
from ..services.auth_service import AuthService
from ..services.announcement_service import AnnouncementService
from ..database.mongodb import get_users_collection, get_announcements_collection, get_chat_history_collection, get_errors_collection
from bson import ObjectId
from datetime import datetime, timedelta
import re
from app.services.admin_service import AdminService
import csv
from io import StringIO , BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

admin_routes = Blueprint('admin', __name__)
stats_service = StatsService()
user_service = UserService()
auth_service = AuthService(get_users_collection())
announcement_service = AnnouncementService(get_announcements_collection())
admin_service = AdminService()

def get_pagination_params():
    """Récupère les paramètres de pagination de la requête"""
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    return page, limit

@admin_routes.route('/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats(current_user):
    try:
        stats = admin_service.get_stats()
        return jsonify({
            "success": True,
            "data": stats["data"]
        }), 200
    except Exception as e:
        print(f"Error getting admin stats: {str(e)}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@admin_routes.route('/admin/stats/user-types', methods=['GET'])
@admin_required
def get_user_types(current_user):
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
def get_detailed_stats(current_user):
    try:
        period = request.args.get('period', 'month')
        stats = stats_service.get_detailed_stats(period)
        return jsonify(stats), 200
    except Exception as e:
        print(f"Error getting detailed stats: {str(e)}")
        return jsonify({"error": str(e)}), 500

@admin_routes.route('/admin/users', methods=['GET'])
@admin_required
def get_users(current_user):
    try:
        page, limit = get_pagination_params()
        search = request.args.get('search', '')
        
        # Construire le filtre de recherche
        filter_query = {}
        if search:
            filter_query = {
                "$or": [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"email": {"$regex": search, "$options": "i"}}
                ]
            }
        
        # Récupérer les utilisateurs avec pagination
        users = user_service.get_users_paginated(
            page=page,
            limit=limit,
            filter_query=filter_query
        )
        
        return jsonify({
            "success": True,
            "data": users["data"],
            "total": users["total"],
            "page": page,
            "limit": limit
        }), 200
    except Exception as e:
        print(f"Erreur lors de la récupération des utilisateurs: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Erreur lors de la récupération des utilisateurs"
        }), 500

@admin_routes.route('/admin/users/<user_id>', methods=['PUT'])
@admin_required
def update_user(current_user, user_id):
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
def delete_user(current_user, user_id):
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

@admin_routes.route('/admin/chartes', methods=['GET'])
@admin_required
def get_admin_chartes():
    try:
        # Pour l'instant, retourner une liste vide car la fonctionnalité n'est pas encore implémentée
        return jsonify({
            "success": True,
            "data": []
        }), 200
    except Exception as e:
        print(f"Error getting admin chartes: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error getting chartes"
        }), 500

# Handler pour les requêtes OPTIONS
@admin_routes.route('/admin/chartes', methods=['OPTIONS'])
def options_admin_chartes():
    return '', 200

@admin_routes.route('/admin/announcements', methods=['GET'])
@admin_required
def get_admin_announcements(current_user):
    try:
        page, limit = get_pagination_params()
        search = request.args.get('search', '')
        
        # Construire le filtre de recherche
        filter_query = {}
        if search:
            filter_query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}}
            ]
        
        # Récupérer les annonces avec pagination
        announcements = announcement_service.get_announcements_paginated(
            page=page,
            limit=limit,
            filter_query=filter_query
        )
        
        return jsonify({
            "success": True,
            "data": announcements["data"],
            "total": announcements["total"],
            "page": page,
            "limit": limit
        }), 200
    except Exception as e:
        print(f"Error getting admin announcements: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error getting announcements",
            "data": []
        }), 500

@admin_routes.route('/admin/announcements', methods=['POST'])
@admin_required
def create_announcement(current_user):
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "message": "Données manquantes"
            }), 400

        # Validation des données requises
        required_fields = ["title", "content"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                "success": False,
                "message": f"Champs manquants: {', '.join(missing_fields)}"
            }), 400

        # Créer l'annonce
        announcement = announcement_service.create_announcement(
            data=data,
            author_id=str(current_user['_id']),
            author_name=current_user['name']
        )

        return jsonify({
            "success": True,
            "message": "Annonce créée avec succès",
            "data": announcement
        }), 201

    except ValueError as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400
    except Exception as e:
        print(f"Erreur lors de la création de l'annonce: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Erreur lors de la création de l'annonce"
        }), 500

@admin_routes.route('/admin/users', methods=['POST'])
@admin_required
def create_user(current_user):
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "message": "Données manquantes"
            }), 400

        # Vérifier les champs requis
        required_fields = ['name', 'email', 'password', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Le champ {field} est requis"
                }), 400

        # Créer l'utilisateur
        result = admin_service.create_user(data)
        
        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
    except Exception as e:
        print(f"Erreur lors de la création de l'utilisateur: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Erreur lors de la création de l'utilisateur"
        }), 500

@admin_routes.route('/admin/announcements/<announcement_id>', methods=['PUT'])
@admin_required
def update_announcement(current_user, announcement_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "message": "Données manquantes"
            }), 400

        # Validation des données requises
        required_fields = ["title", "content"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                "success": False,
                "message": f"Champs manquants: {', '.join(missing_fields)}"
            }), 400

        updated_announcement = announcement_service.update_announcement(announcement_id, data)
        return jsonify({
            "success": True,
            "message": "Annonce mise à jour avec succès",
            "data": updated_announcement
        }), 200

    except ValueError as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400
    except Exception as e:
        print(f"Erreur lors de la mise à jour de l'annonce: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Erreur lors de la mise à jour de l'annonce"
        }), 500

@admin_routes.route('/admin/announcements/<announcement_id>', methods=['DELETE'])
@admin_required
def delete_announcement(current_user, announcement_id):
    try:
        announcement_service.delete_announcement(announcement_id)
        return jsonify({
            "success": True,
            "message": "Annonce supprimée avec succès"
        }), 200
    except Exception as e:
        print(f"Erreur lors de la suppression de l'annonce: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Erreur lors de la suppression de l'annonce"
        }), 500

@admin_routes.route('/admin/stats/activity', methods=['GET'])
@admin_required
def get_activity_stats(current_user):
    try:
        days = int(request.args.get('days', 7))
        stats = admin_service.get_activity_stats(days)
        return jsonify(stats), 200
    except Exception as e:
        print(f"Error getting activity stats: {str(e)}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@admin_routes.route('/admin/stats/user-types', methods=['GET'])
@admin_required
def get_user_types_stats(current_user):  # <-- nom unique ici !
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

@admin_routes.route('/admin/stats/user-types', methods=['OPTIONS'])
def options_user_type_stats():
    return '', 200

@admin_routes.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    try:
        # Récupérer les statistiques pour le dernier mois
        stats = stats_service.get_stats(period='month')
        
        return jsonify({
            'success': True,
            'data': {
                'activity_data': stats.get('activity_data', []),
                'user_types': stats.get('user_types', []),
                'total_users': stats.get('total_users', 0),
                'total_conversations': stats.get('chat_count', 0)
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_routes.route('/admin/chat/history', methods=['GET'])
@admin_required
def get_all_chat_history(current_user):
    try:
        chat_history_collection = get_chat_history_collection()
        users_collection = get_users_collection()
        
        # Récupérer l'historique des chats
        history = list(chat_history_collection.find().sort("timestamp", -1))
        
        # Créer un dictionnaire des utilisateurs pour une recherche rapide
        user_ids = set(str(entry['user_id']) for entry in history if 'user_id' in entry)
        users = {str(user['_id']): user for user in users_collection.find({'_id': {'$in': [ObjectId(uid) for uid in user_ids]}})}
        
        # Enrichir l'historique avec les informations des utilisateurs
        for entry in history:
            # Convertir tous les ObjectId en string
            entry['_id'] = str(entry['_id'])
            if 'user_id' in entry:
                if isinstance(entry['user_id'], ObjectId):
                    entry['user_id'] = str(entry['user_id'])
                user_id = str(entry['user_id'])
                if user_id in users:
                    entry['user_name'] = users[user_id].get('name', 'Utilisateur inconnu')
                    entry['user_email'] = users[user_id].get('email', '')
                else:
                    entry['user_name'] = 'Utilisateur inconnu'
                    entry['user_email'] = ''
            if 'session_id' in entry and isinstance(entry['session_id'], ObjectId):
                entry['session_id'] = str(entry['session_id'])
        
        return jsonify({
            "success": True,
            "data": history
        }), 200
    except Exception as e:
        print(f"Error getting chat history: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error getting chat history"
        }), 500

@admin_routes.route('/admin/stats/messages-per-user', methods=['GET'])
@admin_required
def get_messages_per_user(current_user):
    try:
        days = int(request.args.get('days', 7))
        stats = admin_service.get_user_message_stats(days)
        return jsonify(stats), 200
    except Exception as e:
        print(f"Error getting messages per user: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@admin_routes.route('/admin/users/export', methods=['GET'])
@admin_required
def export_users(current_user):
    users = list(get_users_collection().find({}, {"password": 0}))
    si = StringIO()
    writer = csv.writer(si)
    writer.writerow(['Nom', 'Email', 'Rôle'])
    for user in users:
        writer.writerow([user.get('name', ''), user.get('email', ''), user.get('role', '')])
    output = si.getvalue()
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=utilisateurs.csv"}
    )

@admin_routes.route('/admin/report/pdf', methods=['GET'])
def generate_report_pdf():
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.setFont("Helvetica", 14)
    p.drawString(100, 750, "Rapport Général de l'Application")

    # Section erreurs
    p.setFont("Helvetica", 12)
    p.drawString(100, 700, "Erreurs récentes :")
    errors = list(get_errors_collection().find().sort("date", -1).limit(10))
    y = 680
    for err in errors:
        p.drawString(100, y, f"{err.get('date', '')} - {err.get('message', '')}")
        y -= 20
        if y < 100:
            p.showPage()
            y = 750

    p.showPage()
    p.save()
    buffer.seek(0)
    return Response(
        buffer,
        mimetype='application/pdf',
        headers={"Content-Disposition": "attachment;filename=rapport_fsts.pdf"}
    )
