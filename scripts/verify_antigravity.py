import os
import sys
from pathlib import Path

# Mapping of key skills to their primary scripts
REQUIRED_SCRIPTS = {
    "vulnerability-scanner": ["security_scan.py"],
    "frontend-design": ["ux_audit.py"],
    "performance-profiling": ["lighthouse_audit.py"],
    "webapp-testing": ["playwright_runner.py"]
}

AGENT_ROOT = Path(".agent/skills")

def verify_scripts():
    print("🔍 Verifying Antigravity Kit Script Paths...")
    missing_count = 0
    
    if not AGENT_ROOT.exists():
        print(f"❌ Critical: .agent/skills directory not found at {AGENT_ROOT.resolve()}")
        return 1

    for skill, scripts in REQUIRED_SCRIPTS.items():
        skill_path = AGENT_ROOT / skill / "scripts"
        if not skill_path.exists():
            print(f"⚠️  Skill '{skill}' scripts dir missing: {skill_path}")
            missing_count += len(scripts)
            continue
            
        for script in scripts:
            script_file = skill_path / script
            if script_file.exists():
                print(f"✅ Found: {skill}/{script}")
            else:
                print(f"❌ Missing: {skill}/{script}")
                missing_count += 1
                
    if missing_count == 0:
        print("\n✨ All critical scripts verified!")
        return 0
    else:
        print(f"\n❌ Verification failed. {missing_count} scripts missing.")
        return 1

if __name__ == "__main__":
    sys.exit(verify_scripts())
