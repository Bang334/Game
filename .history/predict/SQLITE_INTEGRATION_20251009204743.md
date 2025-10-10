# 🗄️ SQLite Integration - User Interactions Database

## ✅ Hoàn thành

Hệ thống giờ đã tích hợp **SQLite database** để lưu và track user interactions theo thời gian!

### Lợi ích:

✅ **Không cần sửa `game.json`** - Database chính giữ nguyên  
✅ **Track đầy đủ lịch sử** - Mỗi view, purchase, favorite đều được lưu  
✅ **Query theo thời gian** - `--days 7` hoạt động hoàn hảo  
✅ **4,280 interactions** đã được generate  
✅ **Auto-fallback** - Nếu không có SQLite → dùng JSON  

## 🚀 Cách sử dụng

### 1. Khởi tạo Database (chỉ 1 lần)

```bash
python init_user_interactions_db.py
```

**Output:**
```
✅ Database created: user_interactions.db
📊 Total: 4,280 interactions
   - view: 3,776
   - purchase: 299
   - favorite: 205
   - Last 7 days: 1,670 interactions (39%)
```

### 2. Chạy Recommendation với SQLite

```bash
# Với 7 ngày gần đây (sử dụng SQLite)
python game_recommendation_system.py --user 1 --adaptive 1 --days 7

# All time (vẫn dùng JSON)
python game_recommendation_system.py --user 1 --adaptive 1

# 30 ngày (SQLite)
python game_recommendation_system.py --user 1 --adaptive 1 --days 30
```

## 📊 Database Schema

### Table: `user_interactions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key (auto increment) |
| `user_id` | INTEGER | User ID |
| `game_id` | INTEGER | Game ID |
| `interaction_type` | TEXT | 'view', 'purchase', 'favorite' |
| `timestamp` | TIMESTAMP | Thời gian interaction |
| `rating` | INTEGER | Rating (1-5) for purchases, NULL for others |
| `metadata` | TEXT | JSON field for extra data |
| `created_at` | TIMESTAMP | Record creation time |

**Indexes:**
- `idx_user_id` on `user_id`
- `idx_timestamp` on `timestamp`
- `idx_user_time` on `(user_id, timestamp)`
- `idx_type` on `interaction_type`

### Table: `metadata`

Lưu version và thông tin database.

## 🔍 Sample Queries

### Query 1: User 1's interactions trong 7 ngày

```sql
SELECT game_id, interaction_type, timestamp
FROM user_interactions
WHERE user_id = 1 
  AND timestamp >= datetime('now', '-7 days')
ORDER BY timestamp DESC
LIMIT 10;
```

### Query 2: Most viewed games trong 7 ngày

```sql
SELECT game_id, COUNT(*) as view_count
FROM user_interactions
WHERE interaction_type = 'view'
  AND timestamp >= datetime('now', '-7 days')
GROUP BY game_id
ORDER BY view_count DESC
LIMIT 10;
```

### Query 3: User's purchase history với ratings

```sql
SELECT game_id, rating, timestamp
FROM user_interactions
WHERE user_id = 1 
  AND interaction_type = 'purchase'
ORDER BY timestamp DESC;
```

## 📈 Kết quả thực tế

### User 1 (Gamer Pro)

#### All-time Preferences (JSON):
```
Top Publishers: FromSoftware, miHoYo, Epic Games
Top Genres: RPG, Action, Dark Fantasy
Price Range: 635,000 VND (±691,574)
```

#### 7-day Preferences (SQLite):
```
Top Publishers: EA Sports, 2K Sports, Paradox
Top Genres: Sports, Football, Basketball
Price Range: 678,571 VND (±658,113)
```

**Kết luận**: User 1 gần đây thay đổi sở thích từ RPG → Sports games! 🏀

## 🛠️ Workflow

```
1. User tương tác (view/purchase/favorite)
   ↓
2. Backend lưu vào SQLite
   INSERT INTO user_interactions (user_id, game_id, interaction_type, timestamp)
   VALUES (1, 5, 'view', CURRENT_TIMESTAMP)
   ↓
3. Recommendation System query SQLite
   - Nếu --days 7 → query WHERE timestamp >= '7 days ago'
   - Nếu không → dùng all-time JSON data
   ↓
4. Analyze preferences từ filtered interactions
   ↓
5. Apply adaptive boosting
   ↓
6. Return personalized recommendations
```

## 🔧 Backend Integration

### Ví dụ: Lưu interaction khi user view game

```python
import sqlite3
from datetime import datetime

def log_game_view(user_id, game_id):
    """Log khi user xem game"""
    conn = sqlite3.connect('user_interactions.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO user_interactions (user_id, game_id, interaction_type, timestamp)
        VALUES (?, ?, 'view', ?)
    ''', (user_id, game_id, datetime.now().isoformat()))
    
    conn.commit()
    conn.close()

def log_game_purchase(user_id, game_id, rating):
    """Log khi user mua game"""
    conn = sqlite3.connect('user_interactions.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO user_interactions (user_id, game_id, interaction_type, timestamp, rating)
        VALUES (?, ?, 'purchase', ?, ?)
    ''', (user_id, game_id, datetime.now().isoformat(), rating))
    
    conn.commit()
    conn.close()

def log_game_favorite(user_id, game_id):
    """Log khi user thích game"""
    conn = sqlite3.connect('user_interactions.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO user_interactions (user_id, game_id, interaction_type, timestamp)
        VALUES (?, ?, 'favorite', ?)
    ''', (user_id, game_id, datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
```

### Flask API Example

```python
from flask import Flask, request, jsonify

@app.route('/api/game/view', methods=['POST'])
def track_view():
    user_id = request.json.get('user_id')
    game_id = request.json.get('game_id')
    
    log_game_view(user_id, game_id)
    
    return jsonify({'status': 'success', 'message': 'View logged'})

@app.route('/api/game/purchase', methods=['POST'])
def track_purchase():
    user_id = request.json.get('user_id')
    game_id = request.json.get('game_id')
    rating = request.json.get('rating', 3)
    
    log_game_purchase(user_id, game_id, rating)
    
    return jsonify({'status': 'success', 'message': 'Purchase logged'})
```

## 📊 Analytics Queries

### Trending games (7 days)

```sql
SELECT 
    g.name,
    COUNT(*) as total_views
FROM user_interactions ui
JOIN games g ON ui.game_id = g.id
WHERE ui.interaction_type = 'view'
  AND ui.timestamp >= datetime('now', '-7 days')
GROUP BY ui.game_id
ORDER BY total_views DESC
LIMIT 10;
```

### User activity by day

```sql
SELECT 
    DATE(timestamp) as date,
    interaction_type,
    COUNT(*) as count
FROM user_interactions
WHERE user_id = 1
  AND timestamp >= datetime('now', '-30 days')
GROUP BY DATE(timestamp), interaction_type
ORDER BY date DESC;
```

### Conversion rate (views → purchases)

```sql
WITH stats AS (
    SELECT 
        user_id,
        SUM(CASE WHEN interaction_type = 'view' THEN 1 ELSE 0 END) as views,
        SUM(CASE WHEN interaction_type = 'purchase' THEN 1 ELSE 0 END) as purchases
    FROM user_interactions
    WHERE timestamp >= datetime('now', '-7 days')
    GROUP BY user_id
)
SELECT 
    user_id,
    views,
    purchases,
    ROUND(purchases * 100.0 / NULLIF(views, 0), 2) as conversion_rate
FROM stats
ORDER BY conversion_rate DESC;
```

## 🔄 Data Migration

### Migrate từ JSON timestamps sang SQLite

Nếu bạn đã có JSON với timestamps, chạy script này:

```python
import json
import sqlite3
from datetime import datetime

# Load JSON
with open('game.json', 'r') as f:
    data = json.load(f)

# Connect DB
conn = sqlite3.connect('user_interactions.db')
cursor = conn.cursor()

for user in data['users']:
    user_id = user['id']
    
    # Favorites
    if 'favorite_games_timestamps' in user:
        for game_id, timestamp in user['favorite_games_timestamps'].items():
            cursor.execute('''
                INSERT INTO user_interactions (user_id, game_id, interaction_type, timestamp)
                VALUES (?, ?, 'favorite', ?)
            ''', (user_id, int(game_id), timestamp))
    
    # Similar for purchases and views...

conn.commit()
conn.close()
```

## 🚨 Maintenance

### Cleanup old data (>90 days)

```sql
DELETE FROM user_interactions
WHERE timestamp < datetime('now', '-90 days');
```

### Rebuild indexes

```sql
REINDEX idx_user_id;
REINDEX idx_timestamp;
REINDEX idx_user_time;
```

### Vacuum database

```bash
sqlite3 user_interactions.db "VACUUM;"
```

## 📌 Best Practices

1. **Log mọi interaction** - View, purchase, favorite đều quan trọng
2. **Định kỳ cleanup** - Xóa data > 90 ngày (tùy business logic)
3. **Monitor database size** - SQLite handle tốt đến ~100GB
4. **Backup thường xuyên** - `cp user_interactions.db user_interactions_backup.db`
5. **Use prepared statements** - Tránh SQL injection
6. **Index optimization** - Monitor slow queries

## 🎯 Next Steps

1. ✅ Database đã sẵn sàng
2. ✅ Recommendation system tích hợp SQLite
3. ⏳ Backend API để log interactions (cần implement)
4. ⏳ Real-time tracking trên frontend
5. ⏳ Analytics dashboard

---

**Tác giả**: Adaptive Recommendation Team  
**Version**: 1.0  
**Last Updated**: 2025-01-09  
**Database**: `user_interactions.db` (4,280 interactions)

