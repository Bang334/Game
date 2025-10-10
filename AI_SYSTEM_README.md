# 🤖 AI Interaction Tracking System - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Hệ thống AI thông minh học từ hành vi người dùng để cải thiện recommendations theo thời gian. Hệ thống tự động phân tích tương tác, điều chỉnh trọng số, và retrain model.

## 🚀 Cài Đặt & Chạy

### 1. Khởi tạo Database
```bash
cd predict
python init_interaction_db.py
```

### 2. Chạy Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Chạy Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Chạy Python AI System
```bash
cd predict
python app.py
```

## 🧪 Testing

### Chạy Test Script
```bash
python test_ai_system.py
```

### Test Manual
```bash
# Test interaction tracking
curl -X POST http://localhost:3001/api/ai/interaction \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "game_id": 5, "interaction_type": "view"}'

# Get user behavior
curl http://localhost:3001/api/ai/behavior/1

# Get analytics
curl http://localhost:3001/api/ai/analytics
```

## 📊 Analytics Dashboard

Truy cập: `http://localhost:3000/admin/analytics`

### Tính năng:
- 📈 Tổng quan hệ thống
- 👤 Phân tích behavior từng user
- 📊 Xu hướng tương tác
- 🧠 Engagement scores
- 🎯 Conversion rates

## 🔧 API Endpoints

### Interaction Tracking
- `POST /api/ai/interaction` - Log interaction
- `GET /api/ai/interactions/:userId` - Get user history
- `DELETE /api/ai/interactions/:userId` - Clear history

### Analytics
- `GET /api/ai/analytics` - System analytics
- `GET /api/ai/behavior/:userId` - User behavior patterns
- `GET /api/ai/stats` - Basic statistics

## 🧠 AI Features

### 1. Behavior Analysis
- **Genres ưa thích**: Phân tích genres user tương tác nhiều
- **Price tolerance**: Khoảng giá user thường mua
- **Platform preferences**: Platforms user ưa thích
- **Publisher preferences**: Publishers user tin tưởng
- **Release year preferences**: Games mới vs cũ
- **Engagement score**: Tỷ lệ like/purchase
- **Conversion rates**: View → Like → Purchase
- **Session patterns**: Thời gian và tần suất sử dụng

### 2. Dynamic Weights
Hệ thống tự động điều chỉnh trọng số dựa trên behavior:

| Behavior Pattern | Weight Adjustment |
|------------------|-------------------|
| Thích games mới | Content +10% |
| Nhiều tương tác | SVD +10% |
| Engagement cao | SVD +5% |
| Genre preferences rõ | Content +5% |
| Active gần đây | Content +5% |
| Conversion rate cao | SVD +3-5% |
| Session dài | Content +3% |

### 3. Auto-Retrain
- Tự động retrain SVD model mỗi 50 tương tác mới
- Log retraining events
- System health monitoring

## 📈 Metrics & KPIs

### User Metrics
- **Engagement Score**: (likes × 2 + purchases × 3) / (total × 3)
- **Like Conversion Rate**: likes / views
- **Purchase Conversion Rate**: purchases / likes
- **Activity Score**: interactions trong 7 ngày / 7

### System Metrics
- Total users với behavior data
- Average engagement score
- Model retrain frequency
- Interaction trends

## 🗄️ Database Schema

### user_interactions
```sql
CREATE TABLE user_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    interaction_type TEXT NOT NULL,
    rating REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT,
    UNIQUE(user_id, game_id, interaction_type)
);
```

### user_behavior_patterns
```sql
CREATE TABLE user_behavior_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    preferred_genres TEXT,
    avg_price_range TEXT,
    prefers_new_games INTEGER,
    engagement_score REAL,
    last_analyzed DATETIME DEFAULT CURRENT_TIMESTAMP,
    pattern_data TEXT
);
```

### ai_training_log
```sql
CREATE TABLE ai_training_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    training_type TEXT,
    interactions_count INTEGER,
    model_accuracy REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);
```

## 🔍 Monitoring & Debugging

### Check Database
```bash
cd predict
sqlite3 user_interactions.db

# View interactions
SELECT * FROM user_interactions ORDER BY timestamp DESC LIMIT 10;

# View behavior patterns
SELECT user_id, engagement_score, prefers_new_games FROM user_behavior_patterns;

# View retraining log
SELECT * FROM ai_training_log ORDER BY timestamp DESC;
```

### Check Logs
- Backend logs: Console output
- Python AI logs: Console output
- Frontend logs: Browser console

## 🚨 Troubleshooting

### Common Issues

1. **SQLite Error**: Database not found
   ```bash
   cd predict && python init_interaction_db.py
   ```

2. **Connection Error**: Backend not running
   ```bash
   cd backend && npm run dev
   ```

3. **No Behavior Data**: User needs 2+ interactions
   - Use test script to generate sample data

4. **Analytics Empty**: No interactions yet
   - Generate test data or wait for real usage

## 📚 Advanced Usage

### Custom Behavior Analysis
```python
# In predict/app.py
def custom_behavior_analysis(user_id):
    # Add custom analysis logic
    pass
```

### Custom Weights
```python
# Modify get_dynamic_weights function
def get_dynamic_weights(user_id, keyword=None):
    # Add custom weight logic
    pass
```

### Custom Retrain Triggers
```python
# Modify check_and_retrain_svd function
def check_and_retrain_svd(user_id):
    # Add custom retrain conditions
    pass
```

## 🎯 Best Practices

1. **Data Quality**: Ensure clean interaction data
2. **Regular Monitoring**: Check analytics dashboard
3. **Performance**: Monitor retrain frequency
4. **User Privacy**: Clear user data when needed
5. **Backup**: Regular database backups

## 🔮 Future Enhancements

- Deep learning models
- Real-time recommendations
- A/B testing framework
- Predictive analytics
- Multi-tenant support
- Advanced visualization

---

**Cập nhật**: $(date)
**Version**: 2.0.0
**Status**: ✅ Production Ready
