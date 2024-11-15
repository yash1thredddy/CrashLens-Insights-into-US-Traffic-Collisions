# backend/fast_api/models.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AccidentPoint(BaseModel):
    lat: float
    lng: float
    severity: int
    state: str

class StateSummary(BaseModel):
    state: str
    accident_count: int
    avg_severity: float

class MapData(BaseModel):
    points: List[AccidentPoint]
    summary: List[StateSummary]