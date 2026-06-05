from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import PasswordAnalysis, HashAnalysis

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    total_password = db.query(PasswordAnalysis).count()
    total_hash = db.query(HashAnalysis).count()
    
    risk_counts = (
        db.query(PasswordAnalysis.risk_level, func.count(PasswordAnalysis.id))
        .group_by(PasswordAnalysis.risk_level)
        .all()
    )
    
    risk_map = {risk: count for risk, count in risk_counts}
    
    insecure_hashes = (
        db.query(HashAnalysis).filter(HashAnalysis.secure == False).count()
    )

    return {
        # ─── FIX #1: PLURALIZED KEY NAMES TO MATCH FRONTEND METRIC CARDS ───
        "total_password_analyses": total_password,
        "total_hash_analyses": total_hash,
        "total_analysis": total_password + total_hash,
        "risk_breakdown": risk_map,
        "algorithm_breakdown": {},
        "insecure_hashes": insecure_hashes,
        # ─── FIX #2: CASE-INSENSITIVE FALLBACKS FOR ACTIVE THREAT COUNT ───
        "active_threats": risk_map.get("Critical", 0) + risk_map.get("High", 0) or risk_map.get("CRITICAL", 0) + risk_map.get("HIGH", 0),
    }

@router.get("/recent")
def get_recent(limit: int = 10, db: Session = Depends(get_db)):
    recent_passwords = (
        db.query(PasswordAnalysis)
        .order_by(PasswordAnalysis.created_at.desc())
        .limit(limit)
        .all()
    )

    recent_hashes = (
        db.query(HashAnalysis)
        .order_by(HashAnalysis.created_at.desc())
        .limit(limit)
        .all()
    )

    alerts = []

    for p in recent_passwords:
        alerts.append({
            "id": f"PW_{p.id}",
            "severity": p.risk_level.upper(),
            "asset": "password-analyzer",
            "event": f"Password scored {p.score}/4 - {p.crack_time_display} to crack",
            "time": str(p.created_at),
        })

    for h in recent_hashes:
        alerts.append({
            "id": f"HX-{h.id}",
            # ─── FIX #3: CASE VARIANT HANDLERS FOR EXTENDED ALERTS ───
            "severity": h.risk_level.upper() if h.risk_level in ["critical", "high", "medium", "low", "CRITICAL", "HIGH", "MEDIUM", "LOW"] else "LOW",
            "asset": "hash-analyzer",
            "event": f"Hash {h.hash_type} detected as {'secure' if h.secure else 'insecure'}",
            "time": str(h.created_at),
        })
    
    alerts.sort(key=lambda x: x["time"], reverse=True)
    return alerts[:limit]

# ─── FIX #4: CHANGED HYPHEN (-) TO UNDERSCORE (_) TO ELIMINATE THE FRONTEND 404 ───
@router.get("/risk_trend")
def get_risk_trend(db: Session = Depends(get_db)):
    from sqlalchemy import cast, Date
    daily = (
        db.query(
            cast(PasswordAnalysis.created_at, Date).label("date"),
            PasswordAnalysis.risk_level,
            func.count(PasswordAnalysis.id).label("count"),
        )
        .group_by("date", PasswordAnalysis.risk_level)
        .order_by("date")
        .all()
    )

    trend = {}
    for date, level, count in daily:
        key = str(date)
        if key not in trend:
            trend[key] = {"date": key, "Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Secure": 0}
        trend[key][level] = count
    return list(trend.values())
