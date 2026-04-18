from pydantic import BaseModel

class OceanDataBase(BaseModel):
    year: int
    parameter_name: str  
    value: float

class OceanDataResponse(OceanDataBase):
    id: int

    class Config:
        from_attributes = True
