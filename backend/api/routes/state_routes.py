
# state_routes.py
from flask import Blueprint, request, jsonify
from api.utils.database import execute_query
import traceback

state_bp = Blueprint('state', __name__)

@state_bp.route('/api/state/details')
def get_state_details():
    try:
        # Get filter parameters
        state = request.args.get('state')
        years = request.args.getlist('years[]')
        months = request.args.getlist('months[]')
        days = request.args.getlist('days[]')

        if not state:
            return jsonify({'error': 'State parameter is required'}), 400

        # Convert to integers
        if years:
            years = [int(year) for year in years]
        if months:
            months = [int(month) for month in months]
        if days:
            days = [int(day) for day in days]

        # Build conditions
        conditions = ["state = %s"]
        params = [state]

        if years:
            conditions.append("year = ANY(%s)")
            params.append(years)
        if months:
            conditions.append("month = ANY(%s)")
            params.append(months)
        if days:
            conditions.append("day = ANY(%s)")
            params.append(days)

        where_clause = " AND ".join(conditions)

        # Get county data with proper coordinates
        county_query = f"""
            WITH county_stats AS (
                SELECT 
                    county,
                    COUNT(*) as accident_count,
                    AVG(severity)::numeric(10,2) as avg_severity,
                    array_agg(DISTINCT city) as cities,
                    MODE() WITHIN GROUP (ORDER BY weather_condition) as common_weather,
                    MIN(start_lat) as min_lat,
                    MAX(start_lat) as max_lat,
                    MIN(start_lng) as min_lng,
                    MAX(start_lng) as max_lng
                FROM accidents 
                WHERE {where_clause}
                AND county IS NOT NULL
                GROUP BY county
            )
            SELECT 
                county as name,
                accident_count,
                avg_severity,
                cities,
                common_weather,
                min_lat,
                max_lat,
                min_lng,
                max_lng,
                ROUND(100.0 * accident_count / SUM(accident_count) OVER (), 2) as percentage_of_total
            FROM county_stats
            ORDER BY accident_count DESC
        """

        counties = execute_query(county_query, params)

        # Get state summary
        summary_query = f"""
            SELECT 
                COUNT(*) as total_accidents,
                AVG(severity)::numeric(10,2) as avg_severity,
                COUNT(DISTINCT county) as counties_affected,
                MODE() WITHIN GROUP (ORDER BY weather_condition) as common_weather,
                array_agg(DISTINCT weather_condition) as weather_conditions,
                MIN(start_lat) as min_lat,
                MAX(start_lat) as max_lat,
                MIN(start_lng) as min_lng,
                MAX(start_lng) as max_lng
            FROM accidents 
            WHERE {where_clause}
        """

        summary = execute_query(summary_query, params, fetch_all=False)

        # Process counties into GeoJSON format
        features = []
        for county in counties:
            feature = {
                "type": "Feature",
                "properties": {
                    "name": county['name'],
                    "accident_count": int(county['accident_count']),
                    "avg_severity": float(county['avg_severity']),
                    "cities": county['cities'],
                    "common_weather": county['common_weather'],
                    "percentage_of_total": float(county['percentage_of_total'])
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [float(county['min_lng']), float(county['min_lat'])],
                        [float(county['min_lng']), float(county['max_lat'])],
                        [float(county['max_lng']), float(county['max_lat'])],
                        [float(county['max_lng']), float(county['min_lat'])],
                        [float(county['min_lng']), float(county['min_lat'])]
                    ]]
                }
            }
            features.append(feature)

        return jsonify({
            'geojson': {
                "type": "FeatureCollection",
                "features": features
            },
            'summary': {
                'total_accidents': summary['total_accidents'],
                'avg_severity': float(summary['avg_severity']),
                'counties_affected': summary['counties_affected'],
                'common_weather': summary['common_weather'],
                'weather_conditions': summary['weather_conditions'],
                'bounds': {
                    'min_lat': float(summary['min_lat']),
                    'max_lat': float(summary['max_lat']),
                    'min_lng': float(summary['min_lng']),
                    'max_lng': float(summary['max_lng'])
                }
            }
        })

    except Exception as e:
        print(f"Error in get_state_details: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500
