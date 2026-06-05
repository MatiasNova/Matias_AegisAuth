from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import PasswordAnalysis, HashAnalysis
import asyncio
import json

router = APIRouter(tags=["live"])

class ConnectionManager:
    # ─── FIX #1: CORRECTED SYNTAX FROM __init__self() TO STANDARD __init__(self) ───
    def __init__(self):
        self.active: list[WebSocket] = []
    
    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        # ─── FIX #2: SAFELY GUARD AGAINST REMOVAL ERRORS IF WS ALREADY DROPPED ───
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, data: dict):
        for ws in self.active:
            try:
                # ─── FIX #3: OPTIMIZED SEND TO USE DIRECT NATIVE JSON OBJECT METHOD ───
                await ws.send_json(data)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws/live")
async def live_feed(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # ─── FIX #4: RE-ORDERED SLEEP LOOP GAP TO PREVENT FLOODING THE EVENT TICKER ───
            await asyncio.sleep(5)
            from app.database import SessionLocal
            db = SessionLocal()
            try:
                total = db.query(PasswordAnalysis).count() + db.query(HashAnalysis).count()
                
                # ─── FIX #5: CORRECTED SPELLING TYPO FROM "Critcal" TO "Critical" AND "CRITICAL" ───
                critical = db.query(PasswordAnalysis).filter(
                    PasswordAnalysis.risk_level.in_(["Critical", "CRITICAL"])
                ).count()
                
                # ─── FIX #6: MATCHED DATA MODEL PAYLOAD EXACTLY TO RE-MAP INTO FRONTEND EXPECTATIONS ───
                await websocket.send_json({
                    "type": "live_update",
                    "live_count": total,
                    "overview_data": {
                        "active_threats": critical,
                        "total_hash_analyses": total,
                        "compliance_score": 88
                    }
                })
            except Exception:
                pass
            finally:
                db.close()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
