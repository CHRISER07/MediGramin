"""
Chatbot Routes — /api/chatbot/*
Medical AI powered by Gemini. Multilingual. Triage classification.
"""
import json
from flask import Blueprint, request, jsonify
from config import gemini_chat, Config

chatbot_bp = Blueprint("chatbot", __name__)

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिंदी)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "bn": "Bengali (বাংলা)",
    "mr": "Marathi (मराठी)",
    "kn": "Kannada (ಕನ್ನಡ)"
}


# ── GET /api/chatbot/status ───────────────────────────────────────────────────

@chatbot_bp.get("/status")
def status():
    return jsonify({
        "gemini_configured": bool(Config.GOOGLE_API_KEY),
        "model": Config.GEMINI_MODEL,
        "supported_languages": LANGUAGE_NAMES
    })


# ── POST /api/chatbot/chat ────────────────────────────────────────────────────

@chatbot_bp.post("/chat")
def chat():
    data = request.get_json() or {}
    message = data.get("message", "").strip()
    lang_code = data.get("language", "en")
    lang_name = LANGUAGE_NAMES.get(lang_code, "English")

    if not message:
        return jsonify({"error": "message required"}), 400

    lang_instruction = (
        f"Respond ONLY in {lang_name}. Use simple words that a primary school pass person can understand."
        if lang_code != "en"
        else "Respond in simple English."
    )

    prompt = f"""You are a medical assistant for ASHA workers in rural India.
{lang_instruction}

Rules:
1. Answer ONLY health/medical questions
2. If non-medical: say "I can only answer health-related questions" in {lang_name}
3. Use simple language, no jargon
4. Always include: what it is, warning signs, when to go to PHC/hospital
5. End with: "Always consult your PHC doctor for confirmation"
6. Max 5 numbered points

User question: {message}"""

    reply = gemini_chat(
        prompt,
        fallback="AI is temporarily unavailable. Please try again in a moment."
    )

    # Determine if question was medically classified
    is_medical = not any(phrase in reply.lower() for phrase in [
        "only answer health", "only help with", "non-medical"
    ])

    return jsonify({
        "reply": reply,
        "is_medical": is_medical,
        "language": lang_code,
        "language_name": lang_name
    })


# ── POST /api/chatbot/triage ──────────────────────────────────────────────────

@chatbot_bp.post("/triage")
def triage():
    """
    AI triage: returns Red / Amber / Green classification.
    Input: {symptoms, age, gender, bp_systolic, bp_diastolic, temperature, spo2, blood_glucose, notes}
    """
    data = request.get_json() or {}

    # Build clinical summary
    vitals = []
    if data.get("bp_systolic"):
        vitals.append(f"BP: {data['bp_systolic']}/{data.get('bp_diastolic', '?')} mmHg")
    if data.get("temperature"):
        vitals.append(f"Temp: {data['temperature']}°C")
    if data.get("spo2"):
        vitals.append(f"SpO2: {data['spo2']}%")
    if data.get("blood_glucose"):
        vitals.append(f"Blood glucose: {data['blood_glucose']} mg/dL")
    if data.get("weight"):
        vitals.append(f"Weight: {data['weight']} kg")

    symptoms = data.get("symptoms", [])
    if isinstance(symptoms, list):
        symptoms_str = ", ".join(symptoms)
    else:
        symptoms_str = str(symptoms)

    prompt = f"""You are a clinical triage expert for rural India healthcare.
Classify this patient STRICTLY as RED, AMBER, or GREEN.

Patient:
- Age: {data.get('age', 'Unknown')}, Gender: {data.get('gender', 'Unknown')}
- Symptoms: {symptoms_str or 'Not specified'}
- Vitals: {', '.join(vitals) or 'Not recorded'}
- Notes: {data.get('notes', 'None')}

Classification Guide:
RED   = Life-threatening. Needs immediate 108 ambulance / PHC referral NOW.
        (Examples: unconscious, SpO2 <90%, severe chest pain, stroke signs, convulsions, very high fever >104°F in infant)
AMBER = Needs PHC visit within 24-48 hours. Monitor closely.
        (Examples: high fever, moderate breathing difficulty, uncontrolled sugar, moderate chest pain)
GREEN = Routine. Monitor at home. Next scheduled follow-up.
        (Examples: mild cold, minor wound, routine check-up, mild headache)

Respond ONLY as valid JSON (no markdown, no explanation):
{{
  "level": "RED" | "AMBER" | "GREEN",
  "reason": "one sentence clinical reason",
  "action": "specific actionable instruction for ASHA worker",
  "transport": "call 108 immediately" | "take to PHC today" | "monitor at home",
  "follow_up": "when to visit next"
}}"""

    raw = gemini_chat(prompt, fallback='{"level":"AMBER","reason":"AI unavailable","action":"Visit PHC for assessment","transport":"take to PHC today","follow_up":"Within 24 hours"}')

    # Parse JSON safely
    try:
        # Remove any accidental markdown wrapping
        raw_clean = raw.strip()
        if raw_clean.startswith("```"):
            raw_clean = raw_clean.split("```")[1]
            if raw_clean.startswith("json"):
                raw_clean = raw_clean[4:]
        result = json.loads(raw_clean.strip())
        result["level"] = result.get("level", "AMBER").upper()
        if result["level"] not in ("RED", "AMBER", "GREEN"):
            result["level"] = "AMBER"
    except Exception:
        result = {
            "level": "AMBER",
            "reason": "Could not parse AI response. Recommend PHC visit as precaution.",
            "action": "Take patient to nearest PHC for proper assessment.",
            "transport": "take to PHC today",
            "follow_up": "Within 24 hours"
        }

    return jsonify(result)


# ── POST /api/chatbot/translate ───────────────────────────────────────────────

@chatbot_bp.post("/translate")
def translate():
    """Translate any text to target language using Gemini."""
    data = request.get_json() or {}
    text = data.get("text", "").strip()
    lang_code = data.get("language", "hi")
    lang_name = LANGUAGE_NAMES.get(lang_code, "Hindi")

    if not text:
        return jsonify({"error": "text required"}), 400

    prompt = f"Translate the following to {lang_name}. Return ONLY the translation:\n\n{text}"
    translated = gemini_chat(prompt, fallback=text)
    return jsonify({"original": text, "translated": translated, "language": lang_code})
