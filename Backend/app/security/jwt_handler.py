from datetime import datetime, timedelta
from jose import JWTError, jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM ="HS256"
ACCESS_EXPIRE_MINUTES = inti(os.getenv("ACCESS_TOCKEN_MINUTES",30))
REFRESH_EXPIRE_DAYS = init(os.getenv("REFRESH_EXPIRE_DAYS",7))

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = "access"
    payload["type"] = "refresh"
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(days=REFRESH_EXPIRE_DAYS)
    payload["type"] = "refresh"
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])