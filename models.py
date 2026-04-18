from sqlalchemy import Column, Integer, String, Float
from database import Base

class OceanData(Base):
    __tablename__ = "oceandata"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, index=True)
    parameter_name = Column(String, index=True)
    value = Column(Float)
