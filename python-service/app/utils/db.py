from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import psycopg2
import psycopg2.extras
from psycopg2.extras import RealDictCursor

from ..config import settings

psycopg2.extras.register_uuid()


def get_connection() -> Optional[psycopg2.extensions.connection]:
    if not settings.DATABASE_URL:
        return None
    try:
        return psycopg2.connect(settings.DATABASE_URL, cursor_factory=RealDictCursor)
    except Exception as e:
        print(f"[db] Connection failed: {e}")
        return None


def _execute(sql: str, params: Optional[tuple] = None) -> Optional[List[Dict[str, Any]]]:
    conn = get_connection()
    if conn is None:
        return None
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            conn.commit()
            if cur.description:
                return cur.fetchall()
            return []
    except Exception as e:
        conn.rollback()
        print(f"[db] Execute error: {e}")
        raise
    finally:
        conn.close()


CREATE_TABLES_SQL = """
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS code_snippets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code            TEXT NOT NULL,
    language        VARCHAR(50) NOT NULL,
    source_type     VARCHAR(20) NOT NULL CHECK (source_type IN ('github', 'upload', 'manual')),
    repo_name       VARCHAR(255),
    file_path       VARCHAR(500),
    github_stars    INTEGER,
    lines_of_code   INTEGER NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quality_analyses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snippet_id          UUID NOT NULL REFERENCES code_snippets(id) ON DELETE CASCADE,
    readability_score   DECIMAL(3,2) NOT NULL CHECK (readability_score BETWEEN 0 AND 10),
    performance_score   DECIMAL(3,2) NOT NULL CHECK (performance_score BETWEEN 0 AND 10),
    standard_score      DECIMAL(3,2) NOT NULL CHECK (standard_score BETWEEN 0 AND 10),
    overall_score       DECIMAL(3,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 10),
    suggestions         JSONB NOT NULL DEFAULT '[]',
    strengths           JSONB NOT NULL DEFAULT '[]',
    model_used          VARCHAR(50) NOT NULL,
    analyzed_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analysis_tasks (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name         VARCHAR(255) NOT NULL,
    total_count       INTEGER NOT NULL DEFAULT 0,
    completed_count   INTEGER NOT NULL DEFAULT 0,
    failed_count      INTEGER NOT NULL DEFAULT 0,
    status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at      TIMESTAMP
);
"""

CREATE_INDEXES_SQL = """
CREATE INDEX IF NOT EXISTS idx_snippets_language      ON code_snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_source_type    ON code_snippets(source_type);
CREATE INDEX IF NOT EXISTS idx_snippets_created_at     ON code_snippets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analyses_snippet_id     ON quality_analyses(snippet_id);
CREATE INDEX IF NOT EXISTS idx_analyses_overall_score  ON quality_analyses(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_analyzed_at    ON quality_analyses(analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_status            ON analysis_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at        ON analysis_tasks(created_at DESC);
"""


def init_db() -> None:
    conn = get_connection()
    if conn is None:
        print("[db] DATABASE_URL not configured, skipping init")
        return
    try:
        with conn.cursor() as cur:
            cur.execute(CREATE_TABLES_SQL)
            cur.execute(CREATE_INDEXES_SQL)
            conn.commit()
        print("[db] Tables and indexes created successfully")
    except Exception as e:
        conn.rollback()
        print(f"[db] Init error: {e}")
        raise
    finally:
        conn.close()


def insert_snippet(
    code: str,
    language: str,
    source_type: str,
    lines_of_code: int,
    repo_name: Optional[str] = None,
    file_path: Optional[str] = None,
    github_stars: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    rows = _execute(
        """
        INSERT INTO code_snippets (code, language, source_type, lines_of_code, repo_name, file_path, github_stars)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id, created_at
        """,
        (code, language, source_type, lines_of_code, repo_name, file_path, github_stars),
    )
    return rows[0] if rows else None


def get_snippets(
    language: Optional[str] = None,
    source_type: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    conditions: List[str] = []
    params: List[Any] = []

    if language:
        conditions.append("language = %s")
        params.append(language)
    if source_type:
        conditions.append("source_type = %s")
        params.append(source_type)

    where = " WHERE " + " AND ".join(conditions) if conditions else ""
    params.extend([limit, offset])

    rows = _execute(
        f"SELECT * FROM code_snippets{where} ORDER BY created_at DESC LIMIT %s OFFSET %s",
        tuple(params),
    )
    return rows or []


def get_snippet_by_id(snippet_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    rows = _execute("SELECT * FROM code_snippets WHERE id = %s", (snippet_id,))
    return rows[0] if rows else None


def insert_analysis(
    snippet_id: uuid.UUID,
    readability_score: float,
    performance_score: float,
    standard_score: float,
    overall_score: float,
    suggestions: List[str],
    strengths: List[str],
    model_used: str,
) -> Optional[Dict[str, Any]]:
    rows = _execute(
        """
        INSERT INTO quality_analyses
            (snippet_id, readability_score, performance_score, standard_score,
             overall_score, suggestions, strengths, model_used)
        VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s)
        RETURNING id, analyzed_at
        """,
        (
            snippet_id,
            readability_score,
            performance_score,
            standard_score,
            overall_score,
            psycopg2.extras.Json(suggestions),
            psycopg2.extras.Json(strengths),
            model_used,
        ),
    )
    return rows[0] if rows else None


def get_analysis_by_snippet(snippet_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    rows = _execute(
        "SELECT * FROM quality_analyses WHERE snippet_id = %s ORDER BY analyzed_at DESC LIMIT 1",
        (snippet_id,),
    )
    return rows[0] if rows else None


def get_analyses(
    min_overall: Optional[float] = None,
    limit: int = 20,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    conditions: List[str] = []
    params: List[Any] = []

    if min_overall is not None:
        conditions.append("overall_score >= %s")
        params.append(min_overall)

    where = " WHERE " + " AND ".join(conditions) if conditions else ""
    params.extend([limit, offset])

    rows = _execute(
        f"SELECT * FROM quality_analyses{where} ORDER BY analyzed_at DESC LIMIT %s OFFSET %s",
        tuple(params),
    )
    return rows or []


def create_task(task_name: str, total_count: int) -> Optional[Dict[str, Any]]:
    rows = _execute(
        "INSERT INTO analysis_tasks (task_name, total_count) VALUES (%s, %s) RETURNING id, created_at",
        (task_name, total_count),
    )
    return rows[0] if rows else None


def update_task_status(
    task_id: uuid.UUID,
    status: str,
    completed_count: Optional[int] = None,
    failed_count: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    sets: List[str] = ["status = %s"]
    params: List[Any] = [status]

    if completed_count is not None:
        sets.append("completed_count = %s")
        params.append(completed_count)
    if failed_count is not None:
        sets.append("failed_count = %s")
        params.append(failed_count)
    if status in ("completed", "failed"):
        sets.append("completed_at = NOW()")

    params.append(task_id)
    rows = _execute(
        f"UPDATE analysis_tasks SET {', '.join(sets)} WHERE id = %s RETURNING *",
        tuple(params),
    )
    return rows[0] if rows else None


def get_task(task_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    rows = _execute("SELECT * FROM analysis_tasks WHERE id = %s", (task_id,))
    return rows[0] if rows else None


def list_tasks(
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    conditions: List[str] = []
    params: List[Any] = []

    if status:
        conditions.append("status = %s")
        params.append(status)

    where = " WHERE " + " AND ".join(conditions) if conditions else ""
    params.extend([limit, offset])

    rows = _execute(
        f"SELECT * FROM analysis_tasks{where} ORDER BY created_at DESC LIMIT %s OFFSET %s",
        tuple(params),
    )
    return rows or []
