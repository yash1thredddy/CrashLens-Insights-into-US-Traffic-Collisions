from flask import Blueprint, jsonify
from api.utils.database import execute_query

weather_bp = Blueprint('weather', __name__)

@weather_bp.route('/api/weather/summary')
def get_weather_summary():
    try:
        query = """
            SELECT 
                weather_condition,
                COUNT(*) as total_accidents,
                AVG(severity)::numeric(10,2) as avg_severity,
                AVG(temperature)::numeric(10,2) as avg_temperature,
                AVG(visibility)::numeric(10,2) as avg_visibility
            FROM accidents
            WHERE weather_condition IS NOT NULL
            GROUP BY weather_condition
            ORDER BY total_accidents DESC
        """
        weather_stats = execute_query(query)
        
        return jsonify(weather_stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500