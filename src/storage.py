"""NeonDB PostgreSQL persistence layer (Tier 3) — permanent interview records."""

import json
import os
from datetime import datetime, timezone

import psycopg2
import psycopg2.extras


def _default_database_url() -> str:
    return os.getenv("DATABASE_URL", "")


_DDL = """
CREATE TABLE IF NOT EXISTS sessions (
    id              TEXT PRIMARY KEY,
    candidate_name  TEXT NOT NULL,
    target_company  TEXT NOT NULL,
    target_role     TEXT NOT NULL,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    overall_score   REAL,
    summary         TEXT
);

CREATE TABLE IF NOT EXISTS transcripts (
    id          SERIAL PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES sessions(id),
    role        TEXT NOT NULL,
    content     TEXT NOT NULL,
    phase       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_results (
    id                 SERIAL PRIMARY KEY,
    session_id         TEXT NOT NULL REFERENCES sessions(id),
    phase              TEXT NOT NULL,
    score              REAL,
    question_count     INT,
    difficulty_reached INT,
    feedback_json      TEXT
);

CREATE TABLE IF NOT EXISTS entities (
    id               SERIAL PRIMARY KEY,
    company_name     TEXT NOT NULL UNIQUE,
    description      TEXT,
    hiring_patterns  TEXT,
    tech_stack       TEXT,
    contributed_by   TEXT,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_session ON transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_phase_results_session ON phase_results(session_id);
CREATE INDEX IF NOT EXISTS idx_entities_company ON entities(company_name);
"""


class BodhiStorage:
    """Thin wrapper around psycopg2 for NeonDB operations."""

    def __init__(self, database_url: str | None = None):
        url = database_url or _default_database_url()
        if not url:
            raise ValueError(
                "DATABASE_URL not set. Add your NeonDB connection string to .env"
            )
        self.conn = psycopg2.connect(url)
        self.conn.autocommit = True

    def init_tables(self) -> None:
        """Create tables if they don't exist."""
        with self.conn.cursor() as cur:
            cur.execute(_DDL)

    def close(self) -> None:
        self.conn.close()

    # ── Sessions ──────────────────────────────────────────────────

    def create_session(
        self,
        session_id: str,
        candidate_name: str,
        target_company: str,
        target_role: str,
    ) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "INSERT INTO sessions (id, candidate_name, target_company, target_role) "
                "VALUES (%s, %s, %s, %s) ON CONFLICT (id) DO NOTHING",
                (session_id, candidate_name, target_company, target_role),
            )

    def end_session(
        self,
        session_id: str,
        overall_score: float | None = None,
        summary: str = "",
    ) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE sessions SET ended_at = %s, overall_score = %s, summary = %s "
                "WHERE id = %s",
                (datetime.now(timezone.utc), overall_score, summary, session_id),
            )

    # ── Transcripts ───────────────────────────────────────────────

    def save_transcript_batch(
        self,
        session_id: str,
        messages: list[dict],
        phase: str,
    ) -> None:
        """Bulk-insert messages. Each dict has 'role' and 'content'."""
        if not messages:
            return
        rows = [
            (session_id, m["role"], m["content"], phase) for m in messages
        ]
        with self.conn.cursor() as cur:
            psycopg2.extras.execute_values(
                cur,
                "INSERT INTO transcripts (session_id, role, content, phase) "
                "VALUES %s",
                rows,
            )

    # ── Phase results ─────────────────────────────────────────────

    def save_phase_result(
        self,
        session_id: str,
        phase: str,
        score: float | None = None,
        question_count: int = 0,
        difficulty_reached: int = 3,
        feedback: list[str] | None = None,
    ) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "INSERT INTO phase_results "
                "(session_id, phase, score, question_count, difficulty_reached, feedback_json) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (
                    session_id,
                    phase,
                    score,
                    question_count,
                    difficulty_reached,
                    json.dumps(feedback or []),
                ),
            )

    # ── Entities ──────────────────────────────────────────────────

    def get_entity(self, company_name: str) -> dict | None:
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM entities WHERE LOWER(company_name) = LOWER(%s)",
                (company_name,),
            )
            row = cur.fetchone()
            return dict(row) if row else None

    def upsert_entity(
        self,
        company_name: str,
        description: str = "",
        hiring_patterns: str = "",
        tech_stack: str = "",
        contributed_by: str = "",
    ) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "INSERT INTO entities (company_name, description, hiring_patterns, tech_stack, contributed_by, updated_at) "
                "VALUES (%s, %s, %s, %s, %s, %s) "
                "ON CONFLICT (company_name) DO UPDATE SET "
                "description = EXCLUDED.description, "
                "hiring_patterns = EXCLUDED.hiring_patterns, "
                "tech_stack = EXCLUDED.tech_stack, "
                "contributed_by = EXCLUDED.contributed_by, "
                "updated_at = EXCLUDED.updated_at",
                (
                    company_name,
                    description,
                    hiring_patterns,
                    tech_stack,
                    contributed_by,
                    datetime.now(timezone.utc),
                ),
            )
