GPU_HASH_RATES = {
    "MD5": 164_000_000_000,  
    "SHA-1": 61_000_000_000,  
    "SHA-256": 22_000_000_000,  
    "bcrypt": 184_000,  
    "Argon2": 6_800,  
}

def simulator_attack(algorithm: str , entropy_log10: float) -> dict:
    rate = GPU_HASH_RATES.get(algorithm)
    if rate is None:
        return {" error":"algorithm not supported for simulation."}
    
    keyspace = 10 ** entropy_log10
    seconds = keyspace / rate

    if seconds < 60:
        display = f"{seconds:.2f} seconds"
        exposure = " Critical "
    elif seconds < 3600:
        display = f"{seconds/60:.2f} minutes"
        exposure = "high"
    elif seconds < 86400:
        display = f"{seconds/3600:.2f} hours"
        exposure = "Medium"
    elif seconds < 31536000:
        display = f"{seconds/86400:.2f} days"
        exposure = "Low"
    else:
        display = f"{seconds/31536000:.2f} years"
        exposure = "Secure"
    
    return {
        "algorithm": algorithm,
        "estimated_crack_time": display,
        "exposure_level": exposure,
        "gpu_assumed": "RTX 4090 (single unit)",
        "methodology":"Theoretical estimate based on published hashcat benchmark data",
        
    }