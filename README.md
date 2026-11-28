# CityFix — Civic Intelligence & Participatory Urban Governance

> **TuteDude Buildathon 2026 Submission** • `#TutedudeBuildathon` `#BuildForMyCity`

CityFix transforms passive neighborhood complaints into verifiable civic action. Instead of leaving citizens with static ticket numbers, CityFix combines **AI photo triage**, **community upvote prioritization**, **ward-level budget transparency**, and **volunteer clean-up drives** into a unified civic platform.

---

## Key Features
- **AI Photo Triage (`/api/ai-triage`)**: Automatically classifies uploaded hazard photos (potholes, uncollected waste, broken streetlights, blocked storm drains) and assigns severity levels.
- **Community Upvote Prioritization**: Residents upvote urgent issues in their ward to push high-impact hazards to the top of the municipal queue.
- **Ward-Wise Leaderboard & Open Budget Tracker**: Tracks Civic Health Scores alongside ward-level budget allocation vs. actual spend.
- **Citizen Action & Volunteer Drives**: Connects residents with weekend lake cleanups, drain desilting, and accessibility audits.
- **Live Status Lifecycle**: Tracks issues from `Reported` → `Verified` → `In Progress` → `Resolved`.

---

## Tech Stack & Tools Disclosure
- **Frontend**: HTML5, CSS3 (Custom Civic Navy / Urban Sky / Action Emerald Design System), Vanilla JavaScript (ES6+ Fetch API)
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy ORM, Pydantic v2, Uvicorn
- **Database**: PostgreSQL (`psycopg2-binary`)
- **Deployment**: GitHub
- **AI & Development Tools Used**: Assisted with code scaffolding and UI styling; synthetic/demo ward metrics and sample tickets are clearly labeled per Buildathon guidelines.

---

## Project Structure
```text
CityFix/
├── backend/
│   ├── .env                 # Local environment config (ignored by Git)
│   ├── database.py          # SQLAlchemy PostgreSQL engine & session loader
│   ├── main.py              # FastAPI routes, lifespan seeding & static serving
│   ├── models.py            # CivicIssue, WardStats & VolunteerDrive tables
│   ├── requirements.txt     # Python dependencies
│   └── schemas.py           # Pydantic request/response schemas
├── frontend/
│   ├── app.js               # Interactive API client, AI triage & live filtering
│   ├── index.html           # Landing page & live civic dashboard
│   └── styles.css           # Responsive Civic OS theme
├── database_init.sql        # PostgreSQL database creation helper
├── .gitignore
└── README.md
