# backend/fast_api/database.py
import asyncpg
from typing import Optional

async def get_db_pool():
    return await asyncpg.create_pool(
        user='postgres',
        password='1234',
        database='accidents_db',
        host='localhost',
        port=5432
    )