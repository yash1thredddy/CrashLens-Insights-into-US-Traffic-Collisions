from flask import Blueprint, request, jsonify
from api.utils.database import execute_query
import traceback

spatial_bp = Blueprint('spatial', __name__)

@spatial_bp.route('/api/spatial/map-data')
def get_map_data():
    try:
        # Get filter parameters as lists
        selected_state = request.args.get('state')
        years = request.args.getlist('years[]')
        months = request.args.getlist('months[]')
        days = request.args.getlist('days[]')

        # Convert years to integers to avoid type mismatch
        if years:
            years = [int(year) for year in years]
        if months:
            months = [int(month) for month in months]
        if days:
            days = [int(day) for day in days]

        # Build base conditions
        conditions = ["start_lat IS NOT NULL", "start_lng IS NOT NULL"]
        params = []

        if years:
            conditions.append("year = ANY(%s)")
            params.append(years)
        if months:
            conditions.append("month = ANY(%s)")
            params.append(months)
        if days:
            conditions.append("day = ANY(%s)")
            params.append(days)

        # Add state filter if selected
        if selected_state:
            conditions.append("state = %s")
            params.append(selected_state)

        where_clause = " AND ".join(conditions)

        # Choose query based on view type
        if selected_state:
            # County-level aggregated data for state view
            points_query = f"""
                SELECT 
                    county,
                    COUNT(*) as total_accidents,
                    AVG(severity)::numeric(10,2) as avg_severity,
                    AVG(start_lat) as lat,
                    AVG(start_lng) as lng,
                    string_agg(DISTINCT weather_condition, ', ') as weather_conditions
                FROM accidents 
                WHERE {where_clause}
                AND county IS NOT NULL
                GROUP BY county
                ORDER BY total_accidents DESC
            """
        else:
            # National view query optimized for hexagon layer
            points_query = f"""
                SELECT 
                    start_lat as lat,
                    start_lng as lng,
                    severity,
                    state,
                    weather_condition
                FROM accidents 
                WHERE {where_clause}
                ORDER BY severity DESC
                LIMIT 300000
            """
        
        points = execute_query(points_query, params)

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
        time_query = f"""
            SELECT 
                year,
                month,
                COUNT(*) as count,
                AVG(severity)::numeric(10,2) as avg_severity
            FROM accidents 
            WHERE {where_clause}
            GROUP BY year, month
            ORDER BY year, month
        """
        time_distribution = execute_query(time_query, params)

        # Process points for HexagonLayer compatibility
        processed_points = []
        for point in points:
            processed_points.append({
                'lat': float(point['lat']),
                'lng': float(point['lng']),
                'severity': float(point['severity']) if point.get('severity') else 1.0,
                'state': point['state'],
                'weather_condition': point.get('weather_condition')
            })

        return jsonify({
            'points': processed_points,
            'summary': {
                'total_accidents': summary['total_accidents'],
                'avg_severity': float(summary['avg_severity']) if summary['avg_severity'] else 0,
                'states_affected': summary['states_affected'],
                'common_weather': summary['common_weather'],
                'years_count': summary['years_count'],
                'months_count': summary['months_count'],
                'days_count': summary['days_count']
            },
            'timeDistribution': time_distribution,
            'metadata': {
                'total_points': len(processed_points),
                'query_params': {
                    'state': selected_state,
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
        
# Add this to spatial_routes.py
@spatial_bp.route('/api/spatial/top-accidents')
def get_top_accidents():
    try:
        # Get filter parameters
        view_type = request.args.get('view_type', 'state')
        selected_state = request.args.get('state')
        selected_county = request.args.get('county')
        years = request.args.getlist('years[]')
        months = request.args.getlist('months[]')
        days = request.args.getlist('days[]')

        # Build base conditions
        conditions = ["1=1"]  # Always true condition as base
        params = []

        # Add time-based filters
        if years:
            years = [int(year) for year in years]
            conditions.append("year = ANY(%s)")
            params.append(years)
        
        if months:
            months = [int(month) for month in months]
            conditions.append("month = ANY(%s)")
            params.append(months)
        
        if days:
            days = [int(day) for day in days]
            conditions.append("day = ANY(%s)")
            params.append(days)

        # Add hierarchy filters
        if selected_state:
            conditions.append("state = %s")
            params.append(selected_state)
        
        if selected_county:
            conditions.append("county = %s")
            params.append(selected_county)

        where_clause = " AND ".join(conditions)

        # Build query based on view type
        if view_type == 'state':
            query = f"""
                SELECT 
                    state as name,
                    COUNT(*) as accidents,
                    ROUND(AVG(CAST(severity AS FLOAT))::numeric, 2) as avg_severity
                FROM accidents
                WHERE {where_clause}
                GROUP BY state
                ORDER BY accidents DESC
                LIMIT 10
            """
        elif view_type == 'county':
            query = f"""
                SELECT 
                    county as name,
                    COUNT(*) as accidents,
                    ROUND(AVG(CAST(severity AS FLOAT))::numeric, 2) as avg_severity
                FROM accidents
                WHERE {where_clause}
                AND county IS NOT NULL
                GROUP BY county
                ORDER BY accidents DESC
                LIMIT 10
            """
        else:  # city view
            query = f"""
                SELECT 
                    city as name,
                    COUNT(*) as accidents,
                    ROUND(AVG(CAST(severity AS FLOAT))::numeric, 2) as avg_severity
                FROM accidents
                WHERE {where_clause}
                AND city IS NOT NULL
                GROUP BY city
                ORDER BY accidents DESC
                LIMIT 10
            """

        results = execute_query(query, params)
        
        # Ensure numeric types are properly formatted
        formatted_results = []
        for row in results:
            formatted_row = {
                'name': row['name'],
                'accidents': int(row['accidents']),
                'avg_severity': float(row['avg_severity']) if row['avg_severity'] is not None else None
            }
            formatted_results.append(formatted_row)

        return jsonify(formatted_results)

    except Exception as e:
        print(f"Error in get_top_accidents: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500
        
        # Add to spatial_routes.py

@spatial_bp.route('/api/spatial/states')
def get_states():
    try:
        query = """
            SELECT DISTINCT state 
            FROM accidents 
            WHERE state IS NOT NULL 
            ORDER BY state
        """
        results = execute_query(query)
        states = [row['state'] for row in results]
        print(f"Returning states: {states}")  # Add this log
        return jsonify(states)
    except Exception as e:
        print(f"Error in get_states: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500