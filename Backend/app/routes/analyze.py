from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import ( PasswordAnalyzeRequest, PasswordAnalyzeResponse, HashAnalyzeRequest, HashAnalyzeResponse )
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import HashAnalysis, PasswordAnalysis
from app.analyzers.password_analyzer import analyze_password
from app.analyzers.hash_detector import detect_hash

router = APIRouter(prefix="/analyze", tags=["Analysis"])

@router.post("/password", response_model=PasswordAnalyzeResponse)
def analyze_password_route(payload: PasswordAnalyzeRequest, db: Session = Depends(get_db)):
    try:
        result = analyze_password(payload.password)

        record = PasswordAnalysis(
            score=getattr(result, "score", result.get("score") if isinstance(result, dict) else 0),
            risk_level=getattr(result, "risk_level", result.get("risk_level") if isinstance(result, dict) else "unknown"),
            entropy=getattr(result, "entropy", result.get("entropy") if isinstance(result, dict) else 0.0),
            crack_time_display=getattr(result, "crack_time_display", result.get("crack_time_display") if isinstance(result, dict) else ""),
            patterns_detected=",".join(getattr(result, "patterns_detected", result.get("patterns_detected") if isinstance(result, dict) else [])),
        )
        db.add(record)
        db.commit()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/hash", response_model=HashAnalyzeResponse)
def analyze_hash_route(payload: HashAnalyzeRequest, db: Session = Depends(get_db)):
    try:
        result = detect_hash(payload.hash_string)

        # FIX: Using .get() prevents KeyError crashes if keys are misspelled or missing
        record = HashAnalysis(
            algorithm=result.get("hash_type", result.get("algorithm", "unknown")),
            secure=result.get("secure", False),                  
            risk_level=result.get("risk_level", "unknown"),           
            recommendations=" | ".join(result.get("recommendations", result.get("recomendations", [])))
        )
        
        db.add(record)
        db.commit()

        # Build clean mapping layer back out to match HashAnalyzeResponse schema
        response_data = {
            "is_known_hash": result.get("is_known_hash", result.get("algorithm") != "unknown"),
            "hash_type": result.get("hash_type", result.get("algorithm", "unknown")),
            "exposure_count": result.get("exposure_count", 0),
            "recommendations": result.get("recommendations", [result.get("recomendations")]) if isinstance(result.get("recommendations", result.get("recomendations")), list) else [result.get("recommendations", result.get("recomendations", "Verify format"))]
        }
        
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
