import os
from contextlib import contextmanager
import sqlite3

DATABASE_URL = os.environ.get("DATABASE_URL", "portfolio.db")

def _rewrite_query(query: str) -> str:
    """Rewrite PostgreSQL specific syntax to SQLite syntax."""
    # Replace %s with ?
    query = query.replace("%s", "?")
    # Replace NOW() with CURRENT_TIMESTAMP
    query = query.replace("NOW()", "CURRENT_TIMESTAMP")
    return query

def get_connection():
    """Create a new database connection."""
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    # enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

@contextmanager
def get_db():
    """Context manager for database connections."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def _dict_factory(row):
    """Convert sqlite3.Row to dict to match psycopg's dict_row behavior."""
    if row is None:
        return None
    return dict(row)

def execute_query(query: str, params: tuple = None, fetch_one: bool = False, fetch_all: bool = False):
    """Execute a query and optionally fetch results."""
    query = _rewrite_query(query)
    params = params or ()
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(query, params)
        if fetch_one:
            return _dict_factory(cur.fetchone())
        if fetch_all:
            return [_dict_factory(row) for row in cur.fetchall()]
        return None

def execute_returning(query: str, params: tuple = None):
    """Execute a query with RETURNING clause and fetch the result."""
    query = _rewrite_query(query)
    params = params or ()
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(query, params)
        return _dict_factory(cur.fetchone())
