import psycopg2
from psycopg2.extras import RealDictCursor
from config.config import Config

def get_db_connection():
    """Create a database connection"""
    return psycopg2.connect(**Config.DATABASE_CONFIG)

def execute_query(query, params=None, fetch_all=True):
    """Execute a query and return results"""
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            if fetch_all:
                return cur.fetchall()
            return cur.fetchone()