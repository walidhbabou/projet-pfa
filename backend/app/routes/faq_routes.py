from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.faq_service import FAQService
from ..services.auth_service import AuthService

faq_bp = Blueprint('faq', __name__)
faq_service = None
auth_service = None

def init_faq_routes(collections):
    global faq_service, auth_service
    faq_service = FAQService(collections['faqs'])
    auth_service = AuthService(collections['users'])
    print("Initialisation des routes FAQ...")
    faq_service.init_faq_database()

@faq_bp.route('/faq', methods=['GET'])
def get_faqs():
    try:
        print("=== Début de la requête GET /faq ===")
        print("Récupération des FAQs depuis le service...")
        faqs = faq_service.get_all_faqs()
        print(f"Nombre de FAQs à renvoyer: {len(faqs)}")
        
        response = {
            "success": True,
            "faqs": faqs
        }
        print("Réponse préparée:", response)
        print("=== Fin de la requête GET /faq ===")
        return jsonify(response)
    except Exception as e:
        print(f"Erreur lors de la récupération des FAQs: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Erreur lors de la récupération des FAQs: {str(e)}"
        }), 500

@faq_bp.route('/faqs', methods=['POST'])
@jwt_required()
def add_faq(current_user):
    try:
        data = request.get_json()
        if not data or not all(k in data for k in ('question', 'answer', 'category')):
            return jsonify({'error': 'Données manquantes'}), 400
            
        # Ajout de l'utilisateur qui crée la FAQ
        data['created_by'] = current_user['email']
        
        # Création de la FAQ
        faq = faq_service.add_faq(data)
        if faq:
            return jsonify({
                'message': 'FAQ créée avec succès',
                'faq': faq
            }), 201
        return jsonify({'error': 'Erreur lors de la création de la FAQ'}), 500
    except Exception as e:
        print("Erreur lors de la création de la FAQ:", str(e))
        return jsonify({'error': str(e)}), 500

@faq_bp.route('/admin/faq/<faq_id>', methods=['PUT'])
@jwt_required()
def update_faq(faq_id):
    try:
        current_user = get_jwt_identity()
        print(f"Tentative de mise à jour de la FAQ {faq_id} par l'utilisateur: {current_user}")
        
        if not auth_service.is_admin(current_user):
            print("Accès refusé: utilisateur non admin")
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()
        print(f"Données reçues pour mise à jour: {data}")
        
        required_fields = ['question', 'answer', 'category']
        if not all(field in data for field in required_fields):
            print(f"Champs manquants: {required_fields}")
            return jsonify({"error": f"Missing fields: {required_fields}"}), 400

        updated_faq = faq_service.update_faq(
            faq_id=faq_id,
            question=data['question'],
            answer=data['answer'],
            category=data['category'],
            updated_by=current_user
        )

        if not updated_faq:
            print(f"FAQ non trouvée: {faq_id}")
            return jsonify({"error": "FAQ not found"}), 404

        print(f"FAQ mise à jour avec succès: {faq_id}")
        return jsonify({
            "message": "FAQ updated successfully",
            "faq": updated_faq
        })

    except Exception as e:
        print(f"Erreur lors de la mise à jour de la FAQ: {e}")
        return jsonify({"error": "Failed to update FAQ"}), 500

@faq_bp.route('/admin/faq/<faq_id>', methods=['DELETE'])
@jwt_required()
def delete_faq(faq_id):
    try:
        current_user = get_jwt_identity()
        print(f"Tentative de suppression de la FAQ {faq_id} par l'utilisateur: {current_user}")
        
        if not auth_service.is_admin(current_user):
            print("Accès refusé: utilisateur non admin")
            return jsonify({"error": "Unauthorized"}), 403

        result = faq_service.delete_faq(faq_id)
        if result.deleted_count == 0:
            print(f"FAQ non trouvée pour suppression: {faq_id}")
            return jsonify({"error": "FAQ not found"}), 404

        print(f"FAQ supprimée avec succès: {faq_id}")
        return jsonify({"message": "FAQ deleted successfully"})

    except Exception as e:
        print(f"Erreur lors de la suppression de la FAQ: {e}")
        return jsonify({"error": "Failed to delete FAQ"}), 500

@faq_bp.route('/faq/search', methods=['GET'])
def search_faqs():
    try:
        query = request.args.get('q', '')
        if not query:
            print("Requête de recherche vide")
            return jsonify({"error": "Search query is required"}), 400

        print(f"Recherche de FAQs avec la requête: {query}")
        results = faq_service.search_faqs(query)
        return jsonify({"results": results})

    except Exception as e:
        print(f"Erreur lors de la recherche de FAQs: {e}")
        return jsonify({"error": "Failed to search FAQs"}), 500

@faq_bp.route('/admin/faq', methods=['POST'])
@jwt_required()
def add_faq_admin():
    try:
        current_user = get_jwt_identity()
        if not auth_service.is_admin(current_user):
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()
        if not data or not all(k in data for k in ('question', 'answer', 'category')):
            return jsonify({'error': 'Données manquantes'}), 400
            
        # Ajout de l'utilisateur qui crée la FAQ
        data['created_by'] = current_user
        
        # Création de la FAQ
        faq = faq_service.add_faq(data)
        if faq:
            return jsonify({
                'message': 'FAQ créée avec succès',
                'faq': faq
            }), 201
        return jsonify({'error': 'Erreur lors de la création de la FAQ'}), 500
    except Exception as e:
        print("Erreur lors de la création de la FAQ:", str(e))
        return jsonify({'error': str(e)}), 500 