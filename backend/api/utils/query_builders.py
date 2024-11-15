class QueryBuilder:
    @staticmethod
    def build_filter_conditions(params):
        """Build WHERE clause from parameters"""
        conditions = []
        query_params = []
        
        # Handle specific filters
        if params.get('state'):
            conditions.append("state = %s")
            query_params.append(params['state'])
            
        if params.get('severity'):
            conditions.append("severity = %s")
            query_params.append(int(params['severity']))
            
        if params.get('weather_condition'):
            conditions.append("weather_condition = %s")
            query_params.append(params['weather_condition'])
            
        if params.get('year'):
            conditions.append("year = %s")
            query_params.append(int(params['year']))
            
        if params.get('month'):
            conditions.append("month = %s")
            query_params.append(int(params['month']))
            
        if params.get('day'):
            conditions.append("day = %s")
            query_params.append(int(params['day']))

        where_clause = " AND ".join(conditions) if conditions else "1=1"
        return where_clause, query_params