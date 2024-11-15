from flask import Blueprint, request, jsonify
from api.utils.database import execute_query
from api.utils.query_builders import QueryBuilder

accident_bp = Blueprint('accidents', __name__)

@accident_bp.route('/api/accidents')
def get_accidents():
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 1000))
        
        # Build filter conditions
        where_clause, params = QueryBuilder.build_filter_conditions(request.args)
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Get paginated data
        query = f"""
            SELECT *
            FROM accidents 
            WHERE {where_clause}
            ORDER BY start_time DESC
            LIMIT %s OFFSET %s
        """
        
        data = execute_query(query, params + [per_page, offset])
        
        # Get total count
        count_query = f"SELECT COUNT(*) as count FROM accidents WHERE {where_clause}"
        total = execute_query(count_query, params, fetch_all=False)['count']
        
        return jsonify({
            'data': data,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500