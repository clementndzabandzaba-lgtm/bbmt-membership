# BBMT Membership Registration

Online version of the Bakgatla Ba Mosetlha Traditional Council membership
registration form. Public visitors submit the form; only an admin can log in
and download all submissions as an Excel file.

- `backend/` — Python (FastAPI) + PostgreSQL API
- `frontend/` — React (Vite) form + admin dashboard

## 1. Database

PostgreSQL is already running as a Windows service on this machine. Create the
database once:

```
psql -U postgres -c "CREATE DATABASE bbmt_membership;"
```

(If `psql` isn't on your PATH, use pgAdmin, or run the equivalent SQL through
any Postgres client.)

## 2. Backend setup

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — update username/password/db name if different from the default.
- `JWT_SECRET` — set to a long random string.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — the admin login credentials.

Create the tables and the admin user:

```
python seed_admin.py
```

Run the API:

```
uvicorn app.main:app --reload --port 8000
```

The API is now at http://localhost:8000 (docs at http://localhost:8000/docs).

## 3. Frontend setup

```
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173 for the landing page, which prompts visitors to
click through to the registration form at http://localhost:5173/register.
Admin login is at http://localhost:5173/admin/login, and after logging in
you land on http://localhost:5173/admin where you can view submissions and
click "Download as Excel".

## Notes

- Re-run `python seed_admin.py` any time to reset the admin password (it
  reads `ADMIN_USERNAME`/`ADMIN_PASSWORD` from `.env`).
- The Excel export includes three sheets: Registrations, Children, and
  Grandchildren, linked by registration ID.
- Admin routes are protected with a JWT bearer token issued on login; there
  is no public sign-up for admin accounts by design.
