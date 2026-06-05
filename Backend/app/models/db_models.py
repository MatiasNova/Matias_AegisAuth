from sqlalchemy import Column, Integer ,String,Float, Boolean , DateTime,Text
from sqlalchemy.sql import func 
from app.database import Base

class PasswordAnalysis(Base):
    __tablename__ = "password_analysis"

    id = Column(Integer,primary_key=True,index=True)
    score = Column(Integer)
    risk_level = Column(String)
    entropy_log10 = Column(Float)
    crack_time_display = Column(String)
    crack_time_seconds = Column(Float)
    length = Column(Integer)
    patterns_detected = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class HashAnalysis(Base):
    __tablename__ = "hash_analysis"
    id = Column(Integer,primary_key=True,index=True)
    algorithm = Column(String)
    secure = Column(Boolean, nullable=True)
    risk_level = Column(String)
    recommendations = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

