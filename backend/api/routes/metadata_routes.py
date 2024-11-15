from flask import Blueprint, jsonify
from api.utils.database import execute_query

metadata_bp = Blueprint('metadata', __name__)

@metadata_bp.route('/api/metadata')
def get_metadata():
    try:
        # Get column information
        columns_query = """
            SELECT 
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns
            WHERE table_name = 'accidents'
            ORDER BY ordinal_position;
        """
        columns = execute_query(columns_query)
        
        # Get basic statistics
        stats_query = """
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT state) as total_states,
                COUNT(DISTINCT weather_condition) as weather_conditions,
                MIN(start_time) as date_range_start,
                MAX(start_time) as date_range_end
            FROM accidents
        """
        stats = execute_query(stats_query, fetch_all=False)
        
        return jsonify({
            'columns': columns,
            'statistics': stats
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500