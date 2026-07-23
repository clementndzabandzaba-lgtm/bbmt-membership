import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .migrations import run_startup_migrations
from .routes import admin, public

load_dotenv()

Base.metadata.create_all(bind=engine)
run_startup_migrations(engine)

app = FastAPI(title="BBMT Membership Registration API")

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
