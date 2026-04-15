"""
Sync Routes — /api/sync/*
Receives offline-queued records from ASHA workers' IndexedDB.
"""
import json
import datetime
from flask import Blueprint, request, jsonify
from db import patients_db

sync_bp = Blueprint("sync", __name__)


def _process_entity(conn, entity_type: str, payload: dict):
    """Route offline entity to correct table."""
    if entity_type == "patient":
        pid = payload.get("id")
        if not pid:
            return False, "patient id missing"
        exists = conn.execute("SELECT 1 FROM patients WHERE id=?", (pid,)).fetchone()
        if exists:
            conn.execute("""
                UPDATE patients SET name=?, age=?, gender=?, village=?, phone=?,
                    conditions=?, asha_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
            """, (
                payload.get("name"), payload.get("age"), payload.get("gender"),
                payload.get("village"), payload.get("phone"),
                payload.get("conditions"), payload.get("asha_id"), pid
            ))
        else:
            conn.execute("""
                INSERT INTO patients (id, name, age, gender, village, phone, conditions, asha_id,
                    latitude, longitude, severity_level, last_consultation_date)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                pid, payload.get("name"), payload.get("age"), payload.get("gender"),
                payload.get("village"), payload.get("phone"),
                payload.get("conditions"), payload.get("asha_id"),
                payload.get("latitude"), payload.get("longitude"),
                payload.get("severity_level", "Mild"), payload.get("last_consultation_date")
            ))
        return True, None

    elif entity_type == "visit":
        local_id = payload.get("local_id")
        if local_id:
            dup = conn.execute("SELECT id FROM visits WHERE local_id=?", (local_id,)).fetchone()
            if dup:
                return True, None  # already synced — idempotent OK

        symptoms = payload.get("symptoms", [])
        conn.execute("""
            INSERT INTO visits (patient_id, asha_id, bp_systolic, bp_diastolic, temperature,
                weight, spo2, blood_glucose, symptoms, notes, triage_result, triage_reason,
                triage_action, ai_summary, synced, local_id)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)
        """, (
            payload.get("patient_id"), payload.get("asha_id"),
            payload.get("bp_systolic"), payload.get("bp_diastolic"),
            payload.get("temperature"), payload.get("weight"),
            payload.get("spo2"), payload.get("blood_glucose"),
            json.dumps(symptoms) if isinstance(symptoms, list) else symptoms,
            payload.get("notes", ""),
            payload.get("triage_result", "GREEN"),
            payload.get("triage_reason", ""),
            payload.get("triage_action", ""),
            payload.get("ai_summary", ""),
            local_id
        ))
        return True, None

    elif entity_type == "prescription":
        medicines = payload.get("medicines", [])
        qr = payload.get("qr_hash", "")
        if qr:
            dup = conn.execute("SELECT 1 FROM prescriptions WHERE qr_hash=?", (qr,)).fetchone()
            if dup:
                return True, None
        conn.execute("""
            INSERT INTO prescriptions (patient_id, visit_id, doctor_name, medicines, diagnosis, instructions, qr_hash)
            VALUES (?,?,?,?,?,?,?)
        """, (
            payload.get("patient_id"), payload.get("visit_id"),
            payload.get("doctor_name", ""),
            json.dumps(medicines) if isinstance(medicines, list) else medicines,
            payload.get("diagnosis", ""), payload.get("instructions", ""), qr
        ))
        return True, None

    return False, f"Unknown entity type: {entity_type}"


# ── POST /api/sync/push ───────────────────────────────────────────────────────

@sync_bp.post("/push")
def push():
    """
    Receive batch of offline records from device.
    Body: { "records": [{ "entity_type": "visit|patient|prescription", "entity_id": "...", "payload": {...} }] }
    """
    data = request.get_json() or {}
    records = data.get("records", [])
    if not records:
        return jsonify({"message": "Nothing to sync", "synced": 0}), 200

    results = {"synced": 0, "failed": 0, "errors": []}

    with patients_db() as conn:
        for rec in records:
            entity_type = rec.get("entity_type", "")
            entity_id   = rec.get("entity_id", "")
            payload     = rec.get("payload", {})

            # Log to sync_queue
            conn.execute("""
                INSERT OR IGNORE INTO sync_queue (entity_type, entity_id, payload, status)
                VALUES (?,?,?,?)
            """, (entity_type, entity_id, json.dumps(payload), "processing"))

            ok, err = _process_entity(conn, entity_type, payload)
            if ok:
                conn.execute("""
                    UPDATE sync_queue SET status='done', synced_at=CURRENT_TIMESTAMP
                    WHERE entity_type=? AND entity_id=?
                """, (entity_type, entity_id))
                results["synced"] += 1
            else:
                conn.execute("""
                    UPDATE sync_queue SET status='failed', error_msg=?,
                        retry_count=retry_count+1
                    WHERE entity_type=? AND entity_id=?
                """, (err, entity_type, entity_id))
                results["failed"] += 1
                results["errors"].append({"entity_id": entity_id, "error": err})

    return jsonify({
        "message": f"Sync complete: {results['synced']} synced, {results['failed']} failed",
        **results
    })


# ── GET /api/sync/status ──────────────────────────────────────────────────────

@sync_bp.get("/status")
def status():
    with patients_db() as conn:
        pending = conn.execute("SELECT COUNT(*) FROM sync_queue WHERE status='pending'").fetchone()[0]
        failed  = conn.execute("SELECT COUNT(*) FROM sync_queue WHERE status='failed'").fetchone()[0]
        done    = conn.execute("SELECT COUNT(*) FROM sync_queue WHERE status='done'").fetchone()[0]
        last    = conn.execute(
            "SELECT synced_at FROM sync_queue WHERE status='done' ORDER BY synced_at DESC LIMIT 1"
        ).fetchone()

    return jsonify({
        "pending": pending,
        "failed": failed,
        "done": done,
        "last_sync": last["synced_at"] if last else None
    })
