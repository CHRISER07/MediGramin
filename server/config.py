"""
MediGramin 2.0 — Configuration
Direct Gemini REST API with per-model 429 backoff and dynamic discovery.
"""
import os
import time
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Config:
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', '')
    GEMINI_MODEL   = 'gemini-2.0-flash'

    FLASK_PORT  = int(os.getenv('FLASK_PORT', 5000))
    SECRET_KEY  = os.getenv('SECRET_KEY', 'medigramin-dev-key-2025')
    DEBUG       = os.getenv('FLASK_ENV', 'development') == 'development'

    DATA_DIR      = os.path.join(BASE_DIR, 'data')
    INVENTORY_DB  = os.path.join(DATA_DIR, 'inventory.db')
    PATIENTS_DB   = os.path.join(DATA_DIR, 'patients.db')
    UPLOAD_DIR    = os.path.join(BASE_DIR, 'uploads')

    NUM_CLUSTERS  = int(os.getenv('NUM_CLUSTERS', 6))
    DBSCAN_EPS    = float(os.getenv('DBSCAN_EPS', 0.2))
    DBSCAN_MIN    = int(os.getenv('DBSCAN_MIN_SAMPLES', 2))


_GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"

# Preferred model order
_PREFERRED = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-pro",
]

# Per-model rate-limit cooldown: {model_name: float timestamp}
_model_cooldown: dict[str, float] = {}
_discovered_models: list[str] = []   # populated once at startup
_working_model: str | None = None    # last known good model


def _list_models() -> list[str]:
    """Returns generateContent-capable model short-names for this API key."""
    try:
        resp = requests.get(
            f"{_GEMINI_BASE}/models?key={Config.GOOGLE_API_KEY}", timeout=10
        )
        if resp.status_code == 200:
            return [
                m["name"].replace("models/", "")
                for m in resp.json().get("models", [])
                if "generateContent" in m.get("supportedGenerationMethods", [])
            ]
    except Exception as e:
        print(f"[Gemini] ListModels error: {e}")
    return []


def _call(model: str, prompt: str) -> tuple[str | None, int]:
    """POST generateContent. Returns (text_or_None, http_status)."""
    url = f"{_GEMINI_BASE}/models/{model}:generateContent?key={Config.GOOGLE_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024},
    }
    try:
        resp = requests.post(url, json=payload, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            parts = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
            text = parts[0].get("text", "").strip() if parts else None
            return text, 200
        return None, resp.status_code
    except Exception as e:
        print(f"[Gemini] Request error ({model}): {e}")
        return None, 0


def _candidate_list() -> list[str]:
    """Ordered list: discovered ∩ preferred first, then rest of discovered."""
    base = _discovered_models if _discovered_models else _PREFERRED
    ordered = [m for m in _PREFERRED if m in base]
    ordered += [m for m in base if m not in ordered]
    return ordered


def gemini_chat(prompt: str, fallback: str = "AI temporarily unavailable.") -> str:
    """
    Call Gemini. Tries models in preference order.
    — 429: marks that model cooling for 90s, tries the NEXT model immediately.
    — 400/401/403: auth error, stops trying.
    — Caches the last working model for instant reuse.
    """
    global _working_model

    if not Config.GOOGLE_API_KEY:
        return fallback

    now = time.time()
    candidates = _candidate_list()

    # Always try the cached working model first (if not cooling down)
    if _working_model and _working_model in candidates:
        if now >= _model_cooldown.get(_working_model, 0):
            text, status = _call(_working_model, prompt)
            if text:
                return text
            if status == 429:
                _model_cooldown[_working_model] = now + 90
                print(f"[Gemini] 429 on '{_working_model}' → trying next model")
            else:
                print(f"[Gemini] '{_working_model}' failed (HTTP {status}) → rediscovering")
            _working_model = None

    # Walk all candidates
    for model in candidates:
        if now < _model_cooldown.get(model, 0):
            secs = int(_model_cooldown[model] - now)
            print(f"[Gemini] '{model}' cooling ({secs}s) — skipping")
            continue

        print(f"[Gemini] Trying: {model}")
        text, status = _call(model, prompt)

        if text:
            _working_model = model
            return text

        if status == 429:
            print(f"[Gemini] 429 on '{model}' — cooling 90s, trying next")
            _model_cooldown[model] = now + 90
            continue   # ← immediately try next candidate

        if status in (400, 401, 403):
            print(f"[Gemini] Auth error {status} on '{model}' — stopping")
            break

    print("[Gemini] ✗ All candidates failed.")
    return fallback


def print_startup():
    global _discovered_models, _working_model

    key_ok = bool(Config.GOOGLE_API_KEY)
    key_preview = (Config.GOOGLE_API_KEY[:12] + "…") if key_ok else "NOT SET"

    key_status = "✓"
    if key_ok:
        _discovered_models = _list_models()
        if _discovered_models:
            key_status = f"✓ Valid — {len(_discovered_models)} model(s) accessible"
            for m in _PREFERRED:
                if m in _discovered_models:
                    _working_model = m
                    break
        else:
            key_status = "✗ No models accessible (expired/quota?)"

    print("\n" + "═" * 55)
    print("   MediGramin 2.0  —  Rural Healthcare Platform")
    print("═" * 55)
    print(f"   Gemini Key    : {key_preview}")
    print(f"   Gemini Status : {key_status}")
    print(f"   Active Model  : {_working_model or 'auto-detect on first call'}")
    print(f"   Inventory DB  : data/inventory.db")
    print(f"   Patients DB   : data/patients.db")
    print(f"   Port          : {Config.FLASK_PORT}")
    if "✗" in key_status:
        print(f"\n   ► Get a FREE key: https://aistudio.google.com/apikey")
        print(f"   ► Set GOOGLE_API_KEY in .env then restart")
    print("═" * 55 + "\n")
