from flask import Blueprint, jsonify
from ..middleware.auth_middleware import admin_required
from ..services.stats_service import StatsService
from ..services.auth_service import AuthService

stats_bp = Blueprint('stats', __name__)
stats_service = StatsService()
auth_service = AuthService()

@stats_bp.route('/api/stats', methods=['GET'])
@admin_required
def get_stats():
    try:
        period = request.args.get('period', 'month')
        stats = stats_service.get_stats(period)
        return jsonify({
            'success': True,
            'data': stats
        })
    except Exception as e:
        print(f"Erreur lors de la récupération des statistiques: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des statistiques'
        }), 500 