from flask import Blueprint, request, jsonify
from api.utils.database import execute_query
import traceback

spatial_bp = Blueprint('spatial', __name__)

US_BOUNDS = {
    'min_lat': 24.396308,
    'max_lat': 49.384358,
    'min_lng': -125.000000,
    'max_lng': -66.934570
}

@spatial_bp.route('/api/spatial/map-data')
def get_map_data():
    try:
        # Get filter parameters as lists
        years = request.args.getlist('years[]')
        months = request.args.getlist('months[]')
        days = request.args.getlist('days[]')

        # Build query conditions
        conditions = [
            f"start_lat BETWEEN {US_BOUNDS['min_lat']} AND {US_BOUNDS['max_lat']}",
            f"start_lng BETWEEN {US_BOUNDS['min_lng']} AND {US_BOUNDS['max_lng']}",
            "start_lat IS NOT NULL",
            "start_lng IS NOT NULL"
        ]
        params = []

        # Add year conditions if specified
        if years:
            year_placeholders = ','.join(['%s' for _ in years])
            conditions.append(f"year::bigint IN ({year_placeholders})")
            params.extend(years)

        # Add month conditions if specified
        if months:
            month_placeholders = ','.join(['%s' for _ in months])
            conditions.append(f"month::bigint IN ({month_placeholders})")
            params.extend(months)

        # Add day conditions if specified
        if days:
            day_placeholders = ','.join(['%s' for _ in days])
            conditions.append(f"day::bigint IN ({day_placeholders})")
            params.extend(days)

        where_clause = " AND ".join(conditions)
        
        print(f"Query conditions: {where_clause}")
        print(f"Parameters: {params}")

        # Get accident points
        points_query = f"""
            SELECT 
                start_lat as lat,
                start_lng as lng,
                severity,
                state,
                year::bigint as year,
                month::bigint as month,
                day::bigint as day,
                weather_condition
            FROM accidents
            WHERE {where_clause}
            ORDER BY severity DESC
            LIMIT 7500000  -- Add limit to prevent overwhelming the frontend
        """
        
        points = execute_query(points_query, params)
        print(f"Retrieved {len(points)} points")
        
        # Get summary statistics
        summary_query = f"""
            SELECT 
                COUNT(*) as total_accidents,
                AVG(severity)::numeric(10,2) as avg_severity,
                COUNT(DISTINCT state) as states_affected,
                MODE() WITHIN GROUP (ORDER BY weather_condition) as common_weather,
                COUNT(DISTINCT year) as years_count,
                COUNT(DISTINCT month) as months_count,
                COUNT(DISTINCT day) as days_count
            FROM accidents
            WHERE {where_clause}
        """
        
        summary = execute_query(summary_query, params, fetch_all=False)

        # Get time distribution
        time_dist_query = f"""
            SELECT 
                year::bigint as year,
                month::bigint as month,
                COUNT(*) as count
            FROM accidents
            WHERE {where_clause}
            GROUP BY year, month
            ORDER BY year, month
        """

        time_distribution = execute_query(time_dist_query, params)
        
        return jsonify({
            'points': points,
            'summary': summary,
            'timeDistribution': time_distribution,
            'metadata': {
                'total_points': len(points),
                'query_params': {
                    'years': years,
                    'months': months,
                    'days': days
                }
            }
        })
        
    except Exception as e:
        print(f"Error in get_map_data: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500