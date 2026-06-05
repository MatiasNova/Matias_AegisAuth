from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class PasswordAnalyzeRequest(BaseModel):
    password: str = Field(..., min_length=1, max_length=512)

class PasswordFeedback(BaseModel):
    warning: Optional[str] = ""
    suggestions: List[str] =[]

class PasswordAnalyzeResponse(BaseModel):
    score: int                        #0-100
    risk_level: str                   # Critical / High / Medium / Low / Secure
    entropy: float                    # log10 of estimated guesses
    crack_time_display: str           # Human-readable crack time (offline slow hash)
    crack_time_seconds: Optional[float] = 0.0         # Raw seconds for feasibility simulator input
    length: Optional[int] = 0
    patterns_detected: List[str] = []
    feedback: PasswordFeedback
    recommendations: List[str] = []

class HashAnalyzeRequest(BaseModel):
    hash_string: str = Field(..., min_length=1, max_length=128)

class HashAnalyzeResponse(BaseModel):
    is_known_hash: bool
    hash_type: str                  #md5, sha1, sha256, etc.
    exposure_count: int = 0
    recommendations: List[str] = []