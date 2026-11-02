import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import sync_admin_user
from .database import Base, SessionLocal, engine
from .migrations import run_startup_migrations
from .routes import admin, public

load_dotenv()

Base.metadata.create_all(bind=engine)
run_startup_migrations(engine)

# Keep the admin login in step with ADMIN_USERNAME/ADMIN_PASSWORD so the
# password can be changed from the host's environment variables alone.
if os.getenv("ADMIN_PASSWORD"):
    with SessionLocal() as db:
        sync_admin_user(db, os.getenv("ADMIN_USERNAME", "admin"), os.environ["ADMIN_PASSWORD"])

app = FastAPI(title="BBMT Membership Registration API")

cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
# Optional regex for origins that change per deploy, e.g. Vercel preview URLs.
cors_origin_regex = os.getenv("CORS_ORIGIN_REGEX") or None
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
