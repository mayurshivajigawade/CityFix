# CityFix — Civic Intelligence & Participatory Urban Governance

> **TuteDude Buildathon 2026 Submission** • `#TutedudeBuildathon` `#BuildForMyCity`

CityFix transforms passive neighborhood complaints into verifiable civic action by combining **AI photo triage**, **community upvote prioritization**, **ward-level budget transparency**, and **volunteer clean-up drives**.

## Tech Stack
- **Frontend**: HTML5, CSS3 (Civic Navy / Urban Sky / Action Emerald Design System), Vanilla JavaScript
- **Backend**: Python FastAPI, SQLAlchemy ORM, Pydantic v2
- **Database**: PostgreSQL (`psycopg2-binary`)
- **Deployment**: GitHub + Vercel Serverless (`@vercel/python` & `@vercel/static`)

## Deploy on Vercel
1. Create a free PostgreSQL database on **Neon** (`neon.tech`) or **Supabase** (`supabase.com`) and copy the `postgresql://...` URI.
2. Push this repository to GitHub (`.gitignore` excludes `backend/.env`).
3. Import the repository on **Vercel**, add `DATABASE_URL` in **Environment Variables**, and click **Deploy**.
