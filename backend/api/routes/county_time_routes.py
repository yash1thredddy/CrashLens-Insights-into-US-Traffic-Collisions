from flask import Blueprint, request, jsonify
import traceback
from api.utils.database import execute_query

county_time_bp = Blueprint('county_time', __name__)

@county_time_bp.route('/api/county/time-analysis')
def get_county_time_analysis():
    try:
        # Get parameters
        county = request.args.get('county')
        state = request.args.get('state')
        time_type = request.args.get('timeType')  # 'hour', 'day', or 'month'
        feature_filter = request.args.get('feature')  # new parameter for feature filtering
        
        # Get filter parameters
        years = request.args.getlist('years[]')
        months = request.args.getlist('months[]')
        days = request.args.getlist('days[]')
        
        if not all([county, state, time_type]):
            return jsonify({'error': 'Missing required parameters'}), 400
            
        if time_type not in ['hour', 'day', 'month']:
            return jsonify({'error': 'Invalid time type'}), 400

        # Build base conditions
        conditions = ["county = %s", "state = %s"]
        params = [county, state]

        # Add filter conditions
        if years:
            years = [int(year) for year in years]
            conditions.append("year = ANY(%s)")
            params.append(years)
        
        if months and time_type != 'month':
            months = [int(month) for month in months]
            conditions.append("month = ANY(%s)")
            params.append(months)
        
        if days and time_type != 'day':
            days = [int(day) for day in days]
            conditions.append("day = ANY(%s)")
            params.append(days)

        # Add feature filter if specified
        if feature_filter:
            if feature_filter in ['crossing', 'junction', 'station', 'stop', 'traffic_signal']:
                conditions.append(f"{feature_filter} = true")
            elif feature_filter in ['Day', 'Night']:
                conditions.append(f"sunrise_sunset = %s")
                params.append(feature_filter)

        # Combine conditions
        where_clause = " AND ".join(conditions)

        # Get traffic features statistics
        stats_query = f"""
            WITH filtered_data AS (
                SELECT *
                FROM accidents 
                WHERE {where_clause}
            )
            SELECT 
                COUNT(CASE WHEN crossing = true THEN id END) as crossing_count,
                COUNT(CASE WHEN junction = true THEN id END) as junction_count,
                COUNT(CASE WHEN station = true THEN id END) as station_count,
                COUNT(CASE WHEN stop = true THEN id END) as stop_count,
                COUNT(CASE WHEN traffic_signal = true THEN id END) as signal_count,
                COUNT(CASE WHEN sunrise_sunset = 'Day' THEN id END) as day_count,
                COUNT(CASE WHEN sunrise_sunset = 'Night' THEN id END) as night_count,
                COUNT(DISTINCT id) as total_accidents
            FROM filtered_data
        """

        # Build time query based on time type with filtered data
        if time_type == 'hour':
            query = f"""
                WITH filtered_data AS (
                    SELECT *
                    FROM accidents 
                    WHERE {where_clause}
                )
                SELECT 
                    EXTRACT(HOUR FROM start_time)::integer as time_value,
                    COUNT(*) as accident_count,
                    array_agg(DISTINCT street) as streets,
                    array_agg(DISTINCT city) as cities
                FROM filtered_data
                GROUP BY time_value
                ORDER BY time_value
            """
        elif time_type == 'day':
            query = f"""
                WITH filtered_data AS (
                    SELECT *
                    FROM accidents 
                    WHERE {where_clause}
                )
                SELECT 
                    EXTRACT(DOW FROM start_time)::integer as time_value,
                    COUNT(*) as accident_count,
                    array_agg(DISTINCT street) as streets,
                    array_agg(DISTINCT city) as cities
                FROM filtered_data
                GROUP BY time_value
                ORDER BY time_value
            """
        else:  # month
            query = f"""
                WITH filtered_data AS (
                    SELECT *
                    FROM accidents 
                    WHERE {where_clause}
                )
                SELECT 
                    EXTRACT(MONTH FROM start_time)::integer as time_value,
                    COUNT(*) as accident_count,
                    array_agg(DISTINCT street) as streets,
                    array_agg(DISTINCT city) as cities
                FROM filtered_data
                GROUP BY time_value
                ORDER BY time_value
            """
        results = execute_query(query, params)

        # Process results
        data = {
            'timeValues': [],
            'accidentCounts': [],
            'locationDetails': []
        }

        # Fill in missing values with zeros and process location details
        max_values = {'hour': 24, 'day': 7, 'month': 12}
        value_map = {row['time_value']: {
            'count': row['accident_count'],
            'streets': row['streets'],
            'cities': row['cities']
        } for row in results}

        start_value = 1 if time_type == 'month' else 0
        for i in range(start_value, max_values[time_type] + (1 if time_type == 'month' else 0)):
            data['timeValues'].append(i)
            data['accidentCounts'].append(value_map.get(i, {'count': 0})['count'])
            data['locationDetails'].append({
                'streets': value_map.get(i, {'streets': []})['streets'],
                'cities': value_map.get(i, {'cities': []})['cities']
            })

        # Calculate percentages for traffic features
        traffic_stats = execute_query(stats_query, params, fetch_all=False)
        total = traffic_stats['total_accidents'] or 1  # Avoid division by zero
        traffic_features = {
            'crossing': {
                'count': traffic_stats['crossing_count'],
                'percentage': round((traffic_stats['crossing_count'] / total) * 100, 2)
            },
            'junction': {
                'count': traffic_stats['junction_count'],
                'percentage': round((traffic_stats['junction_count'] / total) * 100, 2)
            },
            'station': {
                'count': traffic_stats['station_count'],
                'percentage': round((traffic_stats['station_count'] / total) * 100, 2)
            },
            'stop': {
                'count': traffic_stats['stop_count'],
                'percentage': round((traffic_stats['stop_count'] / total) * 100, 2)
            },
            'trafficSignal': {
                'count': traffic_stats['signal_count'],
                'percentage': round((traffic_stats['signal_count'] / total) * 100, 2)
            },
            'dayTime': {
                'count': traffic_stats['day_count'],
                'percentage': round((traffic_stats['day_count'] / total) * 100, 2)
            },
            'nightTime': {
                'count': traffic_stats['night_count'],
                'percentage': round((traffic_stats['night_count'] / total) * 100, 2)
            }
        }

        return jsonify({
            'success': True,
            'data': data,
            'trafficFeatures': traffic_features,
            'metadata': {
                'county': county,
                'state': state,
                'timeType': time_type,
                'filters': {
                    'years': years,
                    'months': months,
                    'days': days,
                    'feature': feature_filter
                }
            }
        })

    except Exception as e:
        print(f"Error in get_county_time_analysis: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500