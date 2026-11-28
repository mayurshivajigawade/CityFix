import os
import sys
import random
from contextlib import asynccontextmanager
from typing import List, Optional

# Ensure backend directory is in sys.path for Vercel serverless execution
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import engine, get_db, Base
import models
import schemas

def seed_initial_data(db: Session):
    if db.query(models.WardStats).count() == 0:
        wards = [
            models.WardStats(ward_name="Ward 12 - Indiranagar", civic_score=92, allocated_budget_lakhs=65.0, utilized_budget_lakhs=54.2, active_volunteers=118),
            models.WardStats(ward_name="Ward 08 - Koramangala", civic_score=88, allocated_budget_lakhs=72.0, utilized_budget_lakhs=58.0, active_volunteers=96),
            models.WardStats(ward_name="Ward 19 - Jayanagar", civic_score=85, allocated_budget_lakhs=58.0, utilized_budget_lakhs=44.5, active_volunteers=84),
            models.WardStats(ward_name="Ward 04 - Malleshwaram", civic_score=81, allocated_budget_lakhs=50.0, utilized_budget_lakhs=37.0, active_volunteers=73),
            models.WardStats(ward_name="Ward 27 - Whitefield", civic_score=76, allocated_budget_lakhs=85.0, utilized_budget_lakhs=51.4, active_volunteers=64),
        ]
        db.add_all(wards)
        db.commit()

    if db.query(models.CivicIssue).count() == 0:
        sample_issues = [
            models.CivicIssue(
                ticket_code="CFX-2026-104",
                title="Deep crater pothole near 100ft Road Metro Pillar 64",
                description="High-risk asphalt collapse causing two-wheeler skids during evening peak traffic. Needs cold-mix patch immediately.",
                category="Pothole & Roads",
                ward="Ward 12 - Indiranagar",
                location_text="100 Feet Rd, HAL 2nd Stage",
                latitude=12.9784,
                longitude=77.6408,
                severity="Critical",
                status="In Progress",
                upvotes=47,
                reporter_name="Ananya Rao",
                ai_detected_tag="Road Surface Damage (96.4% confidence)",
                estimated_budget_inr=28000
            ),
            models.CivicIssue(
                ticket_code="CFX-2026-108",
                title="Overflowing blackspot garbage dump beside Primary School",
                description="Uncollected mixed municipal waste blocking pedestrian footpath for 48 hours.",
                category="Waste Management",
                ward="Ward 08 - Koramangala",
                location_text="4th Block, 80ft Peripheral Rd",
                latitude=12.9352,
                longitude=77.6245,
                severity="High",
                status="Verified",
                upvotes=34,
                reporter_name="Karthik Menon",
                ai_detected_tag="Unsegregated Waste Pile (93.1% confidence)",
                estimated_budget_inr=12000
            ),
            models.CivicIssue(
                ticket_code="CFX-2026-112",
                title="Non-functional LED streetlights along Park Walkway",
                description="Five consecutive poles dark since Tuesday, creating safety hazard for evening commuters and senior citizens.",
                category="Streetlight & Safety",
                ward="Ward 19 - Jayanagar",
                location_text="4th T Block Park Lane",
                latitude=12.9250,
                longitude=77.5938,
                severity="High",
                status="Resolved",
                upvotes=29,
                reporter_name="Meera Krishnan",
                ai_detected_tag="Electrical Fixture Outage (89.8% confidence)",
                estimated_budget_inr=18500
            ),
            models.CivicIssue(
                ticket_code="CFX-2026-115",
                title="Clogged stormwater drain grate causing waterlogging",
                description="Silt and plastic debris blocking primary rainwater inlet before monsoon showers.",
                category="Water & Drainage",
                ward="Ward 27 - Whitefield",
                location_text="ITPL Main Rd, Kundalahalli Gate",
                latitude=12.9698,
                longitude=77.7136,
                severity="Critical",
                status="Reported",
                upvotes=61,
                reporter_name="Rohan Deshmukh",
                ai_detected_tag="Stormwater Drain Blockage (94.7% confidence)",
                estimated_budget_inr=35000
            ),
        ]
        db.add_all(sample_issues)
        db.commit()

    if db.query(models.VolunteerDrive).count() == 0:
        drives = [
            models.VolunteerDrive(
                title="Ulsoor Lake Perimeter Zero-Plastic Cleanup Drive",
                ward="Ward 12 - Indiranagar",
                drive_date="Sunday, Dec 6 • 7:00 AM",
                spots_total=40,
                spots_filled=31,
                organizer="GreenWard Citizens Collective"
            ),
            models.VolunteerDrive(
                title="Tactile Footpath & Ramp Accessibility Audit",
                ward="Ward 19 - Jayanagar",
                drive_date="Saturday, Dec 12 • 8:30 AM",
                spots_total=25,
                spots_filled=18,
                organizer="WalkableCity Youth Fellows"
            ),
            models.VolunteerDrive(
                title="Stormwater Drain Desilting & Citizen Watch",
                ward="Ward 27 - Whitefield",
                drive_date="Sunday, Dec 13 • 7:30 AM",
                spots_total=50,
                spots_filled=27,
                organizer="Whitefield Rising Civic Guild"
            ),
        ]
        db.add_all(drives)
        db.commit()

_db_initialized = False

def init_db_safe():
    global _db_initialized
    if _db_initialized:
        return
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed_initial_data(db)
        _db_initialized = True
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db_safe()
    except Exception:
        pass
    yield

app = FastAPI(
    title=os.getenv("APP_NAME", "CityFix API"),
    description="Civic Intelligence, AI Issue Triage, Ward Leaderboards & Participatory Budgeting Platform",
    version="3.0.0",
    lifespan=lifespan
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def ensure_db_ready(request: Request, call_next):
    if request.url.path.startswith("/api/") and request.url.path != "/api/health":
        init_db_safe()
    return await call_next(request)

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "CityFix Civic Intelligence API", "version": "3.0.0"}

@app.get("/api/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    issues = db.query(models.CivicIssue).all()
    wards = db.query(models.WardStats).all()
    total_issues = len(issues)
    resolved_issues = sum(1 for i in issues if i.status == "Resolved")
    critical_issues = sum(1 for i in issues if i.severity == "Critical" and i.status != "Resolved")
    total_budget = sum(w.allocated_budget_lakhs for w in wards)
    utilized_budget = sum(w.utilized_budget_lakhs for w in wards)
    total_volunteers = sum(w.active_volunteers for w in wards)

    return {
        "total_issues": total_issues,
        "resolved_issues": resolved_issues,
        "resolution_rate": round((resolved_issues / total_issues * 100) if total_issues else 0, 1),
        "critical_open": critical_issues,
        "total_budget_lakhs": round(total_budget, 1),
        "utilized_budget_lakhs": round(utilized_budget, 1),
        "active_volunteers": total_volunteers
    }

@app.get("/api/issues", response_model=List[schemas.IssueResponse])
def list_issues(
    category: Optional[str] = None,
    ward: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.CivicIssue)
    if category and category != "All":
        query = query.filter(models.CivicIssue.category == category)
    if ward and ward != "All":
        query = query.filter(models.CivicIssue.ward == ward)
    if status and status != "All":
        query = query.filter(models.CivicIssue.status == status)
    return query.order_by(desc(models.CivicIssue.upvotes), desc(models.CivicIssue.created_at)).all()

@app.post("/api/issues", response_model=schemas.IssueResponse)
def create_issue(issue: schemas.IssueCreate, db: Session = Depends(get_db)):
    ticket_num = random.randint(200, 999)
    budget_map = {
        "Pothole & Roads": 25000,
        "Waste Management": 12000,
        "Streetlight & Safety": 18000,
        "Water & Drainage": 32000,
        "Accessibility": 22000
    }
    new_issue = models.CivicIssue(
        ticket_code=f"CFX-2026-{ticket_num}",
        title=issue.title,
        description=issue.description,
        category=issue.category,
        ward=issue.ward,
        location_text=issue.location_text,
        latitude=issue.latitude or 12.9716,
        longitude=issue.longitude or 77.5946,
        severity=issue.severity or "Medium",
        status="Reported",
        upvotes=1,
        reporter_name=issue.reporter_name or "Citizen Contributor",
        ai_detected_tag=issue.ai_detected_tag or f"{issue.category} Verified (91.2% confidence)",
        image_data=issue.image_data,
        estimated_budget_inr=budget_map.get(issue.category, 20000)
    )
    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    return new_issue

@app.post("/api/issues/{issue_id}/upvote", response_model=schemas.IssueResponse)
def upvote_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(models.CivicIssue).filter(models.CivicIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue.upvotes += 1
    db.commit()
    db.refresh(issue)
    return issue

@app.patch("/api/issues/{issue_id}/status", response_model=schemas.IssueResponse)
def update_issue_status(issue_id: int, payload: schemas.IssueStatusUpdate, db: Session = Depends(get_db)):
    issue = db.query(models.CivicIssue).filter(models.CivicIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue.status = payload.status
    db.commit()
    db.refresh(issue)
    return issue

@app.post("/api/ai-triage")
async def simulate_ai_photo_triage(file: UploadFile = File(...)):
    filename = (file.filename or "").lower()
    if "pothole" in filename or "road" in filename:
        detected = ("Pothole & Roads", "High", "Asphalt Crater / Road Surface Damage (96.2% confidence)")
    elif "garbage" in filename or "trash" in filename or "waste" in filename:
        detected = ("Waste Management", "High", "Uncollected Municipal Waste Cluster (94.8% confidence)")
    elif "light" in filename or "dark" in filename or "pole" in filename:
        detected = ("Streetlight & Safety", "Medium", "Damaged Streetlight Luminaires (91.5% confidence)")
    elif "water" in filename or "flood" in filename or "drain" in filename:
        detected = ("Water & Drainage", "Critical", "Stormwater Drain Overflow / Waterlogging (95.4% confidence)")
    else:
        detected = ("Pothole & Roads", "High", "Urban Infrastructure Anomaly Detected (92.7% confidence)")

    return {
        "filename": file.filename,
        "suggested_category": detected[0],
        "suggested_severity": detected[1],
        "ai_tag": detected[2]
    }

@app.get("/api/wards", response_model=List[schemas.WardResponse])
def get_ward_leaderboard(db: Session = Depends(get_db)):
    return db.query(models.WardStats).order_by(desc(models.WardStats.civic_score)).all()

@app.get("/api/drives", response_model=List[schemas.VolunteerDriveResponse])
def get_volunteer_drives(db: Session = Depends(get_db)):
    return db.query(models.VolunteerDrive).all()

@app.post("/api/drives/{drive_id}/join", response_model=schemas.VolunteerDriveResponse)
def join_volunteer_drive(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(models.VolunteerDrive).filter(models.VolunteerDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Volunteer drive not found")
    if drive.spots_filled >= drive.spots_total:
        raise HTTPException(status_code=400, detail="Drive is already at full capacity")
    drive.spots_filled += 1
    db.commit()
    db.refresh(drive)
    return drive

if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
def serve_index():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))