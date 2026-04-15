"""
MediGramin 2.0 — Database Layer
Context-manager connections + full schema initialization for all tables.
"""
import sqlite3
import os
from contextlib import contextmanager
from config import Config


# ── Connection helpers ──────────────────────────────────────────────────────

@contextmanager
def inventory_db():
    os.makedirs(Config.DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(Config.INVENTORY_DB)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@contextmanager
def patients_db():
    os.makedirs(Config.DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(Config.PATIENTS_DB)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ── Schema initialization ───────────────────────────────────────────────────

def _init_inventory():
    with inventory_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS inventory (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                product_name  TEXT    NOT NULL,
                sku           TEXT    UNIQUE NOT NULL,
                category      TEXT    DEFAULT 'General',
                current_stock INTEGER DEFAULT 0,
                reorder_level INTEGER DEFAULT 10,
                expiry_date   DATE,
                unit_price    REAL    DEFAULT 0.0,
                last_updated  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS stock_history (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                sku         TEXT NOT NULL,
                stock_level INTEGER NOT NULL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS orders (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                sku          TEXT NOT NULL,
                product_name TEXT,
                quantity     INTEGER NOT NULL,
                order_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expected_by  DATE,
                status       TEXT DEFAULT 'pending',
                notes        TEXT
            );

            CREATE TABLE IF NOT EXISTS alerts (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_type   TEXT NOT NULL,
                sku          TEXT,
                message      TEXT NOT NULL,
                severity     TEXT DEFAULT 'warning',
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                acknowledged INTEGER DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_stock_sku ON stock_history(sku);
            CREATE INDEX IF NOT EXISTS idx_orders_sku ON orders(sku);
        """)


def _init_patients():
    with patients_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS patients (
                id                     TEXT PRIMARY KEY,
                name                   TEXT NOT NULL,
                age                    INTEGER DEFAULT 0,
                gender                 TEXT DEFAULT 'Unknown',
                village                TEXT DEFAULT '',
                phone                  TEXT DEFAULT '',
                conditions             TEXT DEFAULT '',
                asha_id                TEXT DEFAULT '',
                -- geographic / routing
                latitude               REAL,
                longitude              REAL,
                cluster                INTEGER,
                sub_cluster            INTEGER,
                urgency_score          REAL    DEFAULT 0,
                severity_level         TEXT    DEFAULT 'Mild',
                last_consultation_date DATE,
                stock_available        TEXT    DEFAULT 'Yes',
                -- audit
                created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS visits (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id    TEXT NOT NULL,
                visit_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                asha_id       TEXT DEFAULT '',
                -- vitals
                bp_systolic   INTEGER,
                bp_diastolic  INTEGER,
                temperature   REAL,
                weight        REAL,
                spo2          INTEGER,
                blood_glucose REAL,
                -- clinical
                symptoms      TEXT DEFAULT '[]',
                notes         TEXT DEFAULT '',
                -- AI output
                triage_result TEXT DEFAULT 'GREEN',
                triage_reason TEXT DEFAULT '',
                triage_action TEXT DEFAULT '',
                ai_summary    TEXT DEFAULT '',
                -- sync
                synced        INTEGER DEFAULT 1,
                local_id      TEXT UNIQUE
            );

            CREATE TABLE IF NOT EXISTS prescriptions (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id   TEXT NOT NULL,
                visit_id     INTEGER,
                doctor_name  TEXT DEFAULT '',
                medicines    TEXT NOT NULL DEFAULT '[]',
                diagnosis    TEXT DEFAULT '',
                instructions TEXT DEFAULT '',
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                qr_hash      TEXT UNIQUE,
                printed      INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS asha_workers (
                id               TEXT PRIMARY KEY,
                name             TEXT NOT NULL,
                phone            TEXT UNIQUE NOT NULL,
                village_coverage TEXT DEFAULT '[]',
                pin_hash         TEXT DEFAULT '',
                phc_name         TEXT DEFAULT '',
                active           INTEGER DEFAULT 1,
                created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sync_queue (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type TEXT NOT NULL,
                entity_id   TEXT NOT NULL,
                payload     TEXT NOT NULL,
                status      TEXT DEFAULT 'pending',
                retry_count INTEGER DEFAULT 0,
                error_msg   TEXT,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                synced_at   TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_visits_patient    ON visits(patient_id);
            CREATE INDEX IF NOT EXISTS idx_visits_date       ON visits(visit_date);
            CREATE INDEX IF NOT EXISTS idx_patients_village  ON patients(village);
            CREATE INDEX IF NOT EXISTS idx_patients_urgency  ON patients(urgency_score DESC);
            CREATE INDEX IF NOT EXISTS idx_rx_patient        ON prescriptions(patient_id);
            CREATE INDEX IF NOT EXISTS idx_sync_status       ON sync_queue(status);
        """)


def init_all_databases():
    os.makedirs(Config.DATA_DIR, exist_ok=True)
    os.makedirs(Config.UPLOAD_DIR, exist_ok=True)
    _init_inventory()
    _init_patients()
    print("  [DB] All databases initialized ✓")
