import zxcvbn

RISK_LEVELS = {0: "Critical", 1: "High", 2: "Medium", 3: "Low", 4: "Secure"}

def analyze_password(password: str) -> dict:
    result = zxcvbn.zxcvbn(password)
    score = result["score"]
    return {
        "score": score,
        "risk_level": RISK_LEVELS[score],
        "crack_time_display": result["crack_times_display"]["offline_slow_hashing_1e4_per_second"],
        "entropy": result["guesses_log10"],
        "feedback": result["feedback"],
        "patterns_detected": [m["pattern"] for m in result["sequence"]]
    }
