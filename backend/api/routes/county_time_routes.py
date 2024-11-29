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
        
        if months and time_type != 'month':  # Don't apply month filter when viewing monthly breakdown
            months = [int(month) for month in months]
            conditions.append("month = ANY(%s)")
            params.append(months)
        
        if days and time_type != 'day':  # Don't apply day filter when viewing daily breakdown
            days = [int(day) for day in days]
            conditions.append("day = ANY(%s)")
            params.append(days)

        # Combine conditions
        where_clause = " AND ".join(conditions)

        # Build query based on time type
        if time_type == 'hour':
            query = f"""
                SELECT 
                    EXTRACT(HOUR FROM start_time) as time_value,
                    COUNT(*) as accident_count
                FROM accidents
                WHERE {where_clause}
                GROUP BY time_value
                ORDER BY time_value
            """
        elif time_type == 'day':
            query = f"""
                SELECT 
                    EXTRACT(DOW FROM start_time) as time_value,
                    COUNT(*) as accident_count
                FROM accidents
                WHERE {where_clause}
                GROUP BY time_value
                ORDER BY time_value
            """
        else:  # month
            query = f"""
                SELECT 
                    EXTRACT(MONTH FROM start_time) as time_value,
                    COUNT(*) as accident_count
                FROM accidents
                WHERE {where_clause}
                GROUP BY time_value
                ORDER BY time_value
            """

        results = execute_query(query, params)

        # Process results
        data = {
            'timeValues': [],
            'accidentCounts': []
        }

        # Fill in missing values with zeros
        max_values = {'hour': 24, 'day': 7, 'month': 12}
        value_map = {row['time_value']: row['accident_count'] for row in results}
        
        for i in range(max_values[time_type]):
            data['timeValues'].append(i)
            data['accidentCounts'].append(value_map.get(i, 0))

        return jsonify({
            'success': True,
            'data': data,
            'metadata': {
                'county': county,
                'state': state,
                'timeType': time_type,
                'filters': {
                    'years': years,
                    'months': months,
                    'days': days
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