from flask import Blueprint, jsonify
from api.utils.database import execute_query

temporal_bp = Blueprint('temporal', __name__)

@temporal_bp.route('/api/temporal/summary')
def get_temporal_summary():
    try:
        # Yearly summary
        yearly_query = """
            SELECT 
                year,
                COUNT(*) as total_accidents,
                AVG(severity)::numeric(10,2) as avg_severity
            FROM accidents
            GROUP BY year
            ORDER BY year
        """
        yearly_stats = execute_query(yearly_query)
        
        # Monthly summary
        monthly_query = """
            SELECT 
                month,
                COUNT(*) as total_accidents,
                AVG(severity)::numeric(10,2) as avg_severity
            FROM accidents
            GROUP BY month
            ORDER BY month
        """
        monthly_stats = execute_query(monthly_query)
        
        return jsonify({
            'yearly': yearly_stats,
            'monthly': monthly_stats
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500