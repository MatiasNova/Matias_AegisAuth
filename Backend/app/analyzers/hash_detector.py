import re

HASH_PATTERNS = [
    {"name": "Argon2",  "pattern": r"^\$argon2",        "secure": True,  "recommendation": "Argon2id is the current industry standard. No action required."},
    {"name": "bcrypt",  "pattern": r"^\$2[aby]\$",       "secure": True,  "recommendation": "bcrypt is acceptable. Consider migrating to Argon2id for new systems."},
    {"name": "SHA-256", "pattern": r"^[a-f0-9]{64}$",   "secure": False, "recommendation": "SHA-256 is not a password hashing algorithm. Migrate to Argon2id immediately."},
    {"name": "SHA-1",   "pattern": r"^[a-f0-9]{40}$",   "secure": False, "recommendation": "SHA-1 is cryptographically broken. Migrate to Argon2id immediately."},
    {"name": "MD5",     "pattern": r"^[a-f0-9]{32}$",   "secure": False, "recommendation": "MD5 is severely insecure. This is a critical finding. Migrate immediately."},
]

def detect_hash(hash_string: str) -> dict:
    for h in HASH_PATTERNS:
        if re.match(h["pattern"], hash_string.strip()):
            return{
                "hash_type": h["name"],
                "is_known_hash": True,
                "risk_level": "secure" if h["secure"] else "critical",
                "recommendations": [h["recommendation"]],

            }
    return {
        "hash_type": "unknown",
        "is_known_hash": False,
        "secure": None,
        "risk_level": "unknown",
        "recomendations": "Unknown hash algorithm. Please verify the hash format."
    }