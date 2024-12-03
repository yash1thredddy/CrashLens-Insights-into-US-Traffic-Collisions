from flask import Blueprint, request, jsonify
from api.utils.database import execute_query
import traceback

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/api/analysis/cities')
def get_city_analysis():
    try:
        # Get parameters
        county = request.args.get('county')
        state = request.args.get('state')
        time_type = request.args.get('timeType')
        start_time = request.args.get('startTime')
        end_time = request.args.get('endTime')
        
        # Get filter parameters
        years = request.args.getlist('years[]')
        months = request.args.getlist('months[]')
        days = request.args.getlist('days[]')
        
        if not all([county, state, time_type, start_time, end_time]):
            return jsonify({'error': 'Missing required parameters'}), 400

        # Build base conditions
        conditions = ["county = %s", "state = %s"]
        params = [county, state]

        # Add time range condition based on time_type
        # Since we have hour, day, month columns directly, we can use them
        if time_type == 'hour':
            conditions.append("hour BETWEEN %s AND %s")
        elif time_type == 'day':
            conditions.append("dayofweek BETWEEN %s AND %s")
        elif time_type == 'month':
            conditions.append("month BETWEEN %s AND %s")
        
        params.extend([int(start_time), int(end_time)])

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

        where_clause = " AND ".join(conditions)

        query = f"""
            SELECT 
                city as name,
                COUNT(*) as accidents,
                AVG(CAST(severity AS FLOAT))::numeric(10,2) as avg_severity
            FROM accidents
            WHERE {where_clause}
            AND city IS NOT NULL
            GROUP BY city
            ORDER BY accidents DESC
            LIMIT 10
        """

        results = execute_query(query, params)
        
        return jsonify([{
            'name': row['name'],
            'accidents': int(row['accidents']),
            'avgSeverity': float(row['avg_severity'])
        } for row in results])

    except Exception as e:
        print(f"Error in get_city_analysis: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@analysis_bp.route('/api/county/time-analysis')
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
        dayOfWeek = request.args.getlist('selectedDayOfWeek[]')  # Add this line
        
        if not all([county, state, time_type]):
            return jsonify({'error': 'Missing required parameters'}), 400
            
        # Build base conditions
        conditions = ["county = %s", "state = %s"]
        params = [county, state]

        # Add time range condition based on time_type
        if time_type == 'hour':
            conditions.append("EXTRACT(HOUR FROM start_time) = ANY(%s)")
            params.append([int(hour) for hour in hours] if hours else list(range(24)))
        elif time_type == 'day':
            # For day of week analysis
            conditions.append("EXTRACT(DOW FROM start_time) = ANY(%s)")
            params.append([int(day) for day in dayOfWeek] if dayOfWeek else list(range(7)))
        elif time_type == 'month':
            conditions.append("EXTRACT(MONTH FROM start_time) = ANY(%s)")
            params.append([int(month) for month in months] if months else list(range(1, 13)))

        # Add other filters
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

        where_clause = " AND ".join(conditions)

        # Your existing query logic but modified for day of week
        if time_type == 'day':
            query = f"""
                SELECT 
                    EXTRACT(DOW FROM start_time)::integer as time_value,
                    COUNT(*) as accident_count
                FROM accidents
                WHERE {where_clause}
                GROUP BY time_value
                ORDER BY time_value
            """
        else:
            # Your existing query for hour and month remains the same
            query = f"""
                SELECT 
                    CASE 
                        WHEN %s = 'hour' THEN EXTRACT(HOUR FROM start_time)::integer
                        WHEN %s = 'month' THEN EXTRACT(MONTH FROM start_time)::integer
                    END as time_value,
                    COUNT(*) as accident_count
                FROM accidents
                WHERE {where_clause}
                GROUP BY time_value
                ORDER BY time_value
            """
            params = [time_type, time_type] + params

        results = execute_query(query, params)
        
        return jsonify({
            'success': True,
            'data': {
                'timeValues': [row['time_value'] for row in results],
                'accidentCounts': [row['accident_count'] for row in results]
            },
            'metadata': {
                'county': county,
                'state': state,
                'timeType': time_type,
                'filters': {
                    'years': years,
                    'months': months,
                    'days': days,
                    'dayOfWeek': dayOfWeek  # Add this line
                }
            }
        })

    except Exception as e:
        print(f"Error in get_county_time_analysis: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@analysis_bp.route('/api/analysis/streets')
def get_street_analysis():
    try:
        # Get parameters
        city = request.args.get('city')
        county = request.args.get('county')
        state = request.args.get('state')
        time_type = request.args.get('timeType')
        start_time = request.args.get('startTime')
        end_time = request.args.get('endTime')
        
        # Get filter parameters
        years = request.args.getlist('years[]')
        months = request.args.getlist('months[]')
        days = request.args.getlist('days[]')
        
        if not all([city, county, state, time_type, start_time, end_time]):
            return jsonify({'error': 'Missing required parameters'}), 400

        # Build base conditions
        conditions = ["city = %s", "county = %s", "state = %s"]
        params = [city, county, state]

        # Add time range condition based on time_type
        if time_type == 'hour':
            conditions.append("hour BETWEEN %s AND %s")
        elif time_type == 'day':
            conditions.append("dayofweek BETWEEN %s AND %s")
        elif time_type == 'month':
            conditions.append("month BETWEEN %s AND %s")
        
        params.extend([int(start_time), int(end_time)])

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

        where_clause = " AND ".join(conditions)

        # Note: Since your sample data doesn't show a street column, 
        # you'll need to add that to your database. For now, using a placeholder query.
        query = f"""
            SELECT 
                street as name,
                COUNT(*) as accidents,
                AVG(CAST(severity AS FLOAT))::numeric(10,2) as avg_severity
            FROM accidents
            WHERE {where_clause}
            AND street IS NOT NULL
            GROUP BY street
            ORDER BY accidents DESC
            LIMIT 15
        """

        results = execute_query(query, params)
        
        return jsonify([{
            'name': row['name'],
            'accidents': int(row['accidents']),
            'avgSeverity': float(row['avg_severity'])
        } for row in results])

    except Exception as e:
        print(f"Error in get_street_analysis: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500