# backend/fast_api/main.py
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
import asyncio
from typing import Optional
from .database import get_db_pool
from .models import MapData

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    app.state.pool = await get_db_pool()

@app.on_event("shutdown")
async def shutdown():
    await app.state.pool.close()

@app.get("/api/spatial/map-data", response_model=MapData)
async def get_map_data(
    year: int = Query(...),
    month: Optional[int] = None,
    state: Optional[str] = None
):
    try:
        async with app.state.pool.acquire() as conn:
            # Build query conditions
            conditions = ["year = $1"]
            params = [year]
            param_count = 1

            if month:
                param_count += 1
                conditions.append(f"month = ${param_count}")
                params.append(month)
            
            if state:
                param_count += 1
                conditions.append(f"state = ${param_count}")
                params.append(state)

            where_clause = " AND ".join(conditions)

            # Prepare queries
            points_query = f"""
                SELECT 
                    start_lat as lat,
                    start_lng as lng,
                    severity,
                    state
                FROM accidents 
                WHERE {where_clause}
                LIMIT 100000  -- Add limit for performance
            """

            summary_query = f"""
                SELECT 
                    state,
                    COUNT(*) as accident_count,
                    AVG(severity)::numeric(10,2) as avg_severity
                FROM accidents 
                WHERE {where_clause}
                GROUP BY state
            """

            # Execute queries concurrently
            points, summary = await asyncio.gather(
                conn.fetch(points_query, *params),
                conn.fetch(summary_query, *params)
            )

            return {
                "points": [dict(p) for p in points],
                "summary": [dict(s) for s in summary]
            }
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fast_api.main:app", host="0.0.0.0", port=8000, reload=True)