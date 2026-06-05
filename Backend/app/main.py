from app.analyzers.password_analyzer import analyze_password 
from app.analyzers.hash_detector import detect_hash
from app.analyzers.feasibility_simulator import simulator_attack
from app.analyzers.recommendation_engine import generate_recommendations

from pydantic import BaseModel

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routes.analyze import router as analyze_router
from app.models import db_models
import app.models.db_models

from app.routes.analyze import router as analyze_router
from app.routes.stats import router as stats_router
from app.routes.live import router as live_router


class PasswordRequest(BaseModel):
    password: str

class HashRequest(BaseModel):
    hash_string: str

class FeasibilityRequest(BaseModel):
    algorithm: str
    entropy_log10: float

class RecommendationRequest(BaseModel):
    score: int
    exposure_level: str
    algorithm: str

app = FastAPI(
    title="Matias_AegisAuth",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)

app.include_router(analyze_router)
app.include_router(stats_router)
app.include_router(live_router, prefix="")

@app.get("/health")
def health_check():
    return {"status": "online","service": "Auth Risk Analyzer API"}
    

@app.post("/analyze/password")
def post_analyze_password(payload: PasswordRequest):
    analysis_results = analyze_password(payload.password)
    return analysis_results

@app.post("/analyze/hash") 
def post_analyze_hash(payload: HashRequest):
    return detect_hash(payload.hash_string)

@app.post("/analyze/feasibility") 
def post_analyze_feasibility(payload: FeasibilityRequest):
    return simulator_attack(payload.algorithm, payload.entropy_log10)

@app.post("/analyze/recommendations")
def post_analyze_recommendations(payload: RecommendationRequest):
    return generate_recommendations(payload.score, payload.exposure_level, payload.algorithm)

@app.post("/recommend")
def post_recommend(payload: RecommendationRequest):
    return generate_recommendations(payload.score, payload.exposure_level, payload.algorithm)