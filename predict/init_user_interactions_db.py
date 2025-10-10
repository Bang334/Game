"""
Khởi tạo SQLite database để lưu user interactions (hoạt động gần đây)
Database này track tất cả hoạt động: view, purchase, favorite
"""

import sqlite3
from datetime import datetime, timedelta
import random
import json

def create_interactions_database():
    """Tạo database và tables cho user interactions"""
    
    print("=" * 70)
    print("🗄️  CREATING USER INTERACTIONS DATABASE")
    print("=" * 70)
    print()
    
    # Connect to database
    conn = sqlite3.connect('user_interactions.db')
    cursor = conn.cursor()
    
    # Drop existing tables (nếu có)
    cursor.execute('DROP TABLE IF EXISTS user_interactions')
    cursor.execute('DROP TABLE IF EXISTS metadata')
    
    # ===== TABLE: user_interactions =====
    # Lưu TẤT CẢ interactions của users
    cursor.execute('''
        CREATE TABLE user_interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            game_id INTEGER NOT NULL,
            interaction_type TEXT NOT NULL,  -- 'view', 'purchase', 'favorite'
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            rating INTEGER,                   -- For purchases (1-5), NULL for others
            metadata TEXT,                    -- JSON field for extra data
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes for fast queries
    cursor.execute('CREATE INDEX idx_user_id ON user_interactions(user_id)')
    cursor.execute('CREATE INDEX idx_timestamp ON user_interactions(timestamp)')
    cursor.execute('CREATE INDEX idx_user_time ON user_interactions(user_id, timestamp)')
    cursor.execute('CREATE INDEX idx_type ON user_interactions(interaction_type)')
    
    # ===== TABLE: metadata =====
    cursor.execute('''
        CREATE TABLE metadata (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Insert metadata
    cursor.execute("INSERT INTO metadata (key, value) VALUES ('version', '1.0')")
    cursor.execute("INSERT INTO metadata (key, value) VALUES ('created_at', ?)", (datetime.now().isoformat(),))
    
    conn.commit()
    print("✅ Database structure created!")
    print()
    
    return conn, cursor

def generate_sample_interactions(conn, cursor):
    """Generate sample interactions từ game.json"""
    
    print("📊 Generating sample interactions from game.json...")
    print()
    
    # Load game.json
    try:
        with open('game.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ game.json not found!")
        return
    
    total_interactions = 0
    
    # Generate interactions cho mỗi user
    for user in data['users']:
        user_id = user['id']
        user_name = user['name']
        print(f"👤 Processing User {user_id}: {user_name}")
        
        # ===== FAVORITE GAMES =====
        # Thời gian: 10-30 ngày trước, mỗi favorite là 1 interaction
        favorite_games = user.get('favorite_games', [])
        for game_id in favorite_games:
            days_ago = random.randint(10, 30)
            timestamp = datetime.now() - timedelta(
                days=days_ago,
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59)
            )
            
            cursor.execute('''
                INSERT INTO user_interactions (user_id, game_id, interaction_type, timestamp)
                VALUES (?, ?, 'favorite', ?)
            ''', (user_id, game_id, timestamp.isoformat()))
            total_interactions += 1
        
        if favorite_games:
            print(f"   ⭐ Added {len(favorite_games)} favorite interactions")
        
        # ===== PURCHASED GAMES =====
        # Thời gian: 5-25 ngày trước, mỗi purchase có rating
        purchased_games = user.get('purchased_games', {})
        for game_id, rating in purchased_games.items():
            game_id_int = int(game_id)
            days_ago = random.randint(5, 25)
            timestamp = datetime.now() - timedelta(
                days=days_ago,
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59)
            )
            
            cursor.execute('''
                INSERT INTO user_interactions (user_id, game_id, interaction_type, timestamp, rating)
                VALUES (?, ?, 'purchase', ?, ?)
            ''', (user_id, game_id_int, timestamp.isoformat(), rating))
            total_interactions += 1
        
        if purchased_games:
            print(f"   💰 Added {len(purchased_games)} purchase interactions")
        
        # ===== VIEW HISTORY =====
        # Thời gian: 1-14 ngày trước, mỗi view count = N lần view
        # Tạo N records, mỗi record là 1 lần view khác nhau
        view_history = user.get('view_history', {})
        total_views = 0
        for game_id, view_count in view_history.items():
            game_id_int = int(game_id)
            
            # Tạo view_count interactions, phân bố trong 14 ngày
            for i in range(view_count):
                # Mỗi lần view cách nhau 1-3 ngày
                days_ago = random.randint(1, 14)
                timestamp = datetime.now() - timedelta(
                    days=days_ago,
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59),
                    seconds=random.randint(0, 59)
                )
                
                cursor.execute('''
                    INSERT INTO user_interactions (user_id, game_id, interaction_type, timestamp)
                    VALUES (?, ?, 'view', ?)
                ''', (user_id, game_id_int, timestamp.isoformat()))
                total_interactions += 1
                total_views += 1
        
        if view_history:
            print(f"   👁️  Added {total_views} view interactions")
        
        print()
    
    conn.commit()
    print(f"✅ Total: {total_interactions} interactions generated!")
    print()

def print_statistics(cursor):
    """In thống kê database"""
    
    print("=" * 70)
    print("📊 DATABASE STATISTICS")
    print("=" * 70)
    print()
    
    # Total interactions
    cursor.execute("SELECT COUNT(*) FROM user_interactions")
    total = cursor.fetchone()[0]
    print(f"Total Interactions: {total:,}")
    
    # By type
    cursor.execute("""
        SELECT interaction_type, COUNT(*) as count
        FROM user_interactions
        GROUP BY interaction_type
        ORDER BY count DESC
    """)
    print("\nBy Type:")
    for row in cursor.fetchall():
        print(f"  - {row[0]}: {row[1]:,}")
    
    # By user
    cursor.execute("""
        SELECT user_id, COUNT(*) as count
        FROM user_interactions
        GROUP BY user_id
        ORDER BY user_id
    """)
    print("\nBy User:")
    for row in cursor.fetchall():
        print(f"  - User {row[0]}: {row[1]:,} interactions")
    
    # Recent 7 days
    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
    cursor.execute("""
        SELECT COUNT(*)
        FROM user_interactions
        WHERE timestamp >= ?
    """, (seven_days_ago,))
    recent_count = cursor.fetchone()[0]
    print(f"\nLast 7 Days: {recent_count:,} interactions ({recent_count/total*100:.1f}%)")
    
    # Date range
    cursor.execute("SELECT MIN(timestamp), MAX(timestamp) FROM user_interactions")
    min_date, max_date = cursor.fetchone()
    print(f"\nDate Range:")
    print(f"  - First: {min_date}")
    print(f"  - Last: {max_date}")
    
    print()

def print_sample_queries(cursor):
    """In ví dụ queries"""
    
    print("=" * 70)
    print("📝 SAMPLE QUERIES")
    print("=" * 70)
    print()
    
    # Query 1: User 1's interactions in last 7 days
    print("Query 1: User 1's interactions in last 7 days")
    print("-" * 70)
    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
    cursor.execute("""
        SELECT game_id, interaction_type, timestamp
        FROM user_interactions
        WHERE user_id = 1 AND timestamp >= ?
        ORDER BY timestamp DESC
        LIMIT 10
    """, (seven_days_ago,))
    
    for row in cursor.fetchall():
        print(f"  Game {row[0]} - {row[1]} - {row[2]}")
    
    print()
    
    # Query 2: Most viewed games in last 7 days
    print("Query 2: Most viewed games in last 7 days (all users)")
    print("-" * 70)
    cursor.execute("""
        SELECT game_id, COUNT(*) as view_count
        FROM user_interactions
        WHERE interaction_type = 'view' AND timestamp >= ?
        GROUP BY game_id
        ORDER BY view_count DESC
        LIMIT 5
    """, (seven_days_ago,))
    
    for row in cursor.fetchall():
        print(f"  Game {row[0]}: {row[1]} views")
    
    print()

if __name__ == "__main__":
    try:
        # Create database
        conn, cursor = create_interactions_database()
        
        # Generate sample data
        generate_sample_interactions(conn, cursor)
        
        # Print statistics
        print_statistics(cursor)
        
        # Print sample queries
        print_sample_queries(cursor)
        
        # Close connection
        conn.close()
        
        print("=" * 70)
        print("✅ SUCCESS! Database created: user_interactions.db")
        print("=" * 70)
        print()
        print("📌 Next Steps:")
        print("   1. Review database: sqlite3 user_interactions.db")
        print("   2. Update game_recommendation_system.py to use this DB")
        print("   3. Test: python game_recommendation_system.py --user 1 --days 7")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

