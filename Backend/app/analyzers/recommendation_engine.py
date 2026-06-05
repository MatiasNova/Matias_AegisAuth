def generate_recommendations(score: int, exposure_level: str, algorithm: str) -> dict:
    level = exposure_level.strip().lower()
    algo = algorithm.strip().upper()
    
    remediation_plan = []
    priority = "Low"
    
    if score <= 1 or level in ["critical", "high"]:
        priority = "Critical"
        mitigation_advice = "Immediate security architecture intervention is required to protect user identity vectors."
    elif score <= 3 or level == "medium":
        priority = "Medium"
        mitigation_advice = "Schedule identity subsystem enhancements within the next development iteration cycle."
    else:
        priority = "Low"
        mitigation_advice = "System status meets benchmark compliance standards. Maintain ongoing telemetry audits."

    if score == 0:
        remediation_plan.append("Enforce global system password resets immediately across all target customer accounts.")
        remediation_plan.append("Reject passwords present in known global breached-credential leaks.")
    elif score in [1, 2]:
        remediation_plan.append("Adjust authentication minimum parameter rules to require a length of 14 characters or greater.")
        remediation_plan.append("Block simplistic user input strings containing localized dictionary patterns.")
    elif score == 3:
        remediation_plan.append("Prompt user populations to add a unique phrase or random dictionary words during next check-in.")

    if algo in ["MD5", "SHA-1"]:
        remediation_plan.append(f"Deprecate legacy {algo} storage systems instantly due to cryptographic vulnerabilities.")
        remediation_plan.append("Migrate persistence authentication maps to Argon2id configurations using 64MB or more.")
    elif algo == "SHA-256":
        remediation_plan.append("Isolate SHA-256 pipelines. Plain fast-hashing structures are deeply vulnerable to GPU acceleration rigs.")
        remediation_plan.append("Implement modern key derivation algorithms (Argon2id or bcrypt) to add processing costs.")
    elif algo in ["BCRYPT", "ARGON2"]:
        if level in ["critical", "high"]:
            remediation_plan.append(f"Increase current {algo} iteration work metrics to raise performance resistance scales.")
        else:
            remediation_plan.append(f"Current {algo} structure verified safe. Maintain security token validation keys.")

    if not remediation_plan:
        remediation_plan.append("No critical system deficiencies found. Continue maintaining current infrastructure guidelines.")

    return {
        "assessment_priority": priority,
        "mitigation_advice": mitigation_advice,
        "remediation_actions": remediation_plan,
        "enterprise_compliance_ready": True if priority != "Critical" else False
    }
