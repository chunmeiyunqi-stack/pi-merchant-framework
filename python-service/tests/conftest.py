from __future__ import annotations

import os
from typing import Any, Dict, Generator, List

import pytest
import psycopg2
from psycopg2.extras import RealDictCursor

from app.utils.db import _execute, init_db
from app.utils.db import (
    insert_snippet,
    get_snippets,
    insert_analysis,
    get_analysis_by_snippet,
    create_task,
    update_task_status,
    get_task,
    list_tasks,
)


@pytest.fixture(scope="session")
def db_url() -> str:
    url = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:postgres@127.0.0.1:5433/code_quality",
    )
    os.environ["DATABASE_URL"] = url
    return url


@pytest.fixture(scope="session")
def db_connection(db_url: str) -> Generator[Any, None, None]:
    conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    yield conn
    conn.close()


@pytest.fixture(autouse=True, scope="session")
def setup_database(db_url: str) -> None:
    init_db()


@pytest.fixture
def sample_snippet_id() -> Generator[Any, None, None]:
    result = insert_snippet(
        code="const greet = (name: string): string => `Hello, ${name}!`;",
        language="typescript",
        source_type="manual",
        lines_of_code=1,
    )
    snippet_id = result["id"]
    yield snippet_id
    _execute("DELETE FROM quality_analyses WHERE snippet_id = %s", (snippet_id,))
    _execute("DELETE FROM code_snippets WHERE id = %s", (snippet_id,))


@pytest.fixture
def sample_analysis_id(sample_snippet_id: Any) -> Generator[Any, None, None]:
    result = insert_analysis(
        snippet_id=sample_snippet_id,
        readability_score=8.5,
        performance_score=7.0,
        standard_score=9.0,
        overall_score=8.17,
        suggestions=["Add type annotations", "Use const instead of let"],
        strengths=["Clear function signature", "Good naming convention"],
        model_used="LongCat-2.0",
    )
    yield result["id"]


@pytest.fixture
def sample_task_id() -> Generator[Any, None, None]:
    result = create_task(task_name="test-task", total_count=10)
    task_id = result["id"]
    yield task_id
    _execute("DELETE FROM analysis_tasks WHERE id = %s", (task_id,))
