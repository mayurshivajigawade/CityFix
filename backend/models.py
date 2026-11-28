from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from database import Base

class CivicIssue(Base):
    __tablename__ = "civic_issues"

    id = Column(Integer, primary_key=True, index=True)
    ticket_code = Column(String(20), unique=True, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    ward = Column(String(80), nullable=False)
    location_text = Column(String(200), nullable=False)
    latitude = Column(Float, default=12.9716)
    longitude = Column(Float, default=77.5946)
    severity = Column(String(20), default="Medium")
    status = Column(String(30), default="Reported")
    upvotes = Column(Integer, default=1)
    reporter_name = Column(String(100), default="Anonymous Citizen")
    ai_detected_tag = Column(String(80), nullable=True)
    image_data = Column(Text, nullable=True)
    estimated_budget_inr = Column(Integer, default=15000)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WardStats(Base):
    __tablename__ = "ward_stats"

    id = Column(Integer, primary_key=True, index=True)
    ward_name = Column(String(80), unique=True, nullable=False)
    civic_score = Column(Integer, default=75)
    allocated_budget_lakhs = Column(Float, default=45.0)
    utilized_budget_lakhs = Column(Float, default=31.5)
    active_volunteers = Column(Integer, default=42)

class VolunteerDrive(Base):
    __tablename__ = "volunteer_drives"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    ward = Column(String(80), nullable=False)
    drive_date = Column(String(50), nullable=False)
    spots_total = Column(Integer, default=30)
    spots_filled = Column(Integer, default=12)
    organizer = Column(String(100), nullable=False)
