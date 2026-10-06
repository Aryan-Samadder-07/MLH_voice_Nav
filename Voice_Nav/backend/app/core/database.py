import sqlite3
import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "app.db")

def get_db_connection():
    """Creates a connection to the local SQLite database."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema if it doesn't already exist."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                village TEXT NOT NULL,
                state TEXT NOT NULL,
                preferred_language TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()
        logger.info(f"SQLite database initialized at: {DB_PATH}")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

def insert_user(name: str, phone: str, village: str, state: str, preferred_language: str) -> Dict[str, Any]:
    """Inserts a new user record into the database."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (name, phone, village, state, preferred_language)
        VALUES (?, ?, ?, ?, ?)
    """, (name.strip(), phone.strip(), village.strip(), state.strip(), preferred_language.strip()))
    user_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    return {
        "id": user_id,
        "name": name,
        "phone": phone,
        "village": village,
        "state": state,
        "preferred_language": preferred_language
    }

def list_users() -> List[Dict[str, Any]]:
    """Returns all registered users ordered by most recent first."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_user(user_id: int) -> bool:
    """Deletes a user record by ID."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

# Auto-initialize DB on import
init_db()
