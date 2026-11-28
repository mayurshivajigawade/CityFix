from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class IssueCreate(BaseModel):
    title: str = Field(..., min_length=4, max_length=150)
    description: str = Field(..., min_length=10)
    category: str
    ward: str
    location_text: str
    latitude: Optional[float] = 12.9716
    longitude: Optional[float] = 77.5946
    severity: Optional[str] = "Medium"
    reporter_name: Optional[str] = "Citizen Contributor"
    ai_detected_tag: Optional[str] = None
    image_data: Optional[str] = None

class IssueStatusUpdate(BaseModel):
    status: str

class IssueResponse(BaseModel):
    id: int
    ticket_code: str
    title: str
    description: str
    category: str
    ward: str
    location_text: str
    latitude: float
    longitude: float
    severity: str
    status: str
    upvotes: int
    reporter_name: str
    ai_detected_tag: Optional[str]
    image_data: Optional[str]
    estimated_budget_inr: int
    created_at: datetime

    class Config:
        from_attributes = True

class WardResponse(BaseModel):
    id: int
    ward_name: str
    civic_score: int
    allocated_budget_lakhs: float
    utilized_budget_lakhs: float
    active_volunteers: int

    class Config:
        from_attributes = True

class VolunteerDriveResponse(BaseModel):
    id: int
    title: str
    ward: str
    drive_date: str
    spots_total: int
    spots_filled: int
    organizer: str

    class Config:
        from_attributes = True
