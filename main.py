from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import OceanData
from schemas import OceanDataResponse

app = FastAPI(title="Ocean Data API")

# Get all data or filter by year/parameter_name
@app.get("/ocean-data/", response_model=List[OceanDataResponse])
def get_ocean_data(year: Optional[int] = None, parameter_name: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(OceanData)
    
    if year:
        query = query.filter(OceanData.year == year)
    if parameter_name:
        query = query.filter(OceanData.parameter_name == parameter_name)
    
    results = query.all()
    if not results:
        raise HTTPException(status_code=404, detail="Data not found")
    return results

# Get single data by id
@app.get("/ocean-data/{data_id}", response_model=OceanDataResponse)
def get_ocean_data_by_id(data_id: int, db: Session = Depends(get_db)):
    data = db.query(OceanData).filter(OceanData.id == data_id).first()
    if not data:
        raise HTTPException(status_code=404, detail="Data not found")
    return data
