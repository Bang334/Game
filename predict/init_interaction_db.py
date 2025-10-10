#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Initialize SQLite database for user interaction tracking
"""

import sqlite3
import os
import sys
import io
from datetime import datetime

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

DB_PATH = 'user_interactions.db'

def init_database():
    """Initialize SQLite database with required tables"""
    
    # Check if database already exists
    db_exists = os.path.exists(DB_PATH)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Table 1: User Interactions (view, like, purchase)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            game_id INTEGER NOT NULL,
            interaction_type TEXT NOT NULL,
            rating REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            session_id TEXT,
            UNIQUE(user_id, game_id, interaction_type)
        )
    ''')
    
    # Table 2: User Feedback (explicit feedback from users)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            game_id INTEGER NOT NULL,
            feedback_type TEXT,
            score REAL,
            comment TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Table 3: AI Training Log (track when model was retrained)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_training_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            training_type TEXT,
            interactions_count INTEGER,
            model_accuracy REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            notes TEXT
        )
    ''')
    
    # Table 4: User Behavior Patterns (analyzed patterns)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_behavior_patterns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            preferred_genres TEXT,
            avg_price_range TEXT,
            prefers_new_games INTEGER,
            engagement_score REAL,
            last_analyzed DATETIME DEFAULT CURRENT_TIMESTAMP,
            pattern_data TEXT
        )
    ''')
    
    # Create indexes for performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_interactions_game_id ON user_interactions(game_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON user_interactions(timestamp)')
    
    conn.commit()
    
    # Print summary
    cursor.execute("SELECT COUNT(*) FROM user_interactions")
    interaction_count = cursor.fetchone()[0]
    
    conn.close()
    
    if db_exists:
        print(f"✅ Database already exists: {DB_PATH}")
        print(f"📊 Current interactions: {interaction_count}")
    else:
        print(f"✅ Database created: {DB_PATH}")
        print("📋 Tables created:")
        print("   - user_interactions (view, like, purchase tracking)")
        print("   - user_feedback (explicit feedback)")
        print("   - ai_training_log (model retraining history)")
        print("   - user_behavior_patterns (analyzed patterns)")

def get_interaction_stats():
    """Get statistics about interactions"""
    if not os.path.exists(DB_PATH):
        print("❌ Database not found. Run init_database() first.")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Total interactions by type
    cursor.execute('''
        SELECT interaction_type, COUNT(*) as count
        FROM user_interactions
        GROUP BY interaction_type
    ''')
    
    print("\n📊 Interaction Statistics:")
    print("-" * 40)
    for row in cursor.fetchall():
        print(f"   {row[0]}: {row[1]}")
    
    # Total unique users
    cursor.execute('SELECT COUNT(DISTINCT user_id) FROM user_interactions')
    unique_users = cursor.fetchone()[0]
    print(f"\n👥 Unique users: {unique_users}")
    
    # Total unique games interacted
    cursor.execute('SELECT COUNT(DISTINCT game_id) FROM user_interactions')
    unique_games = cursor.fetchone()[0]
    print(f"🎮 Unique games: {unique_games}")
    
    conn.close()

if __name__ == "__main__":
    print("🚀 Initializing User Interaction Tracking Database...")
    init_database()
    get_interaction_stats()
    print("\n✅ Done!")

