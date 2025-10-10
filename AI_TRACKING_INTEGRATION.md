# 🤖 AI Interaction Tracking System - Integration Guide

Hệ thống học từ hành vi người dùng để cải thiện recommendations theo thời gian.

## ✅ Đã Hoàn Thành

### 1. **SQLite Database** ✅
- ✅ Tạo database `predict/user_interactions.db`
- ✅ Tables: `user_interactions`, `user_feedback`, `ai_training_log`, `user_behavior_patterns`
- ✅ Script init: `predict/init_interaction_db.py`

### 2. **Backend API** ✅
- ✅ File: `backend/src/routes/ai.ts`
- ✅ Endpoints:
  - `POST /api/ai/interaction` - Log interaction
  - `GET /api/ai/interactions/:userId` - Get user history
  - `GET /api/ai/stats` - Get overall stats
  - `DELETE /api/ai/interactions/:userId` - Clear history

### 3. **Frontend Tracking Service** ✅
- ✅ File: `frontend/src/services/interactionTracking.ts`
- ✅ Functions:
  - `trackGameView(userId, gameId)` - Track views (game detail page, >= 2s)
  - `trackGameLike(userId, gameId)` - Track likes (add to wishlist/favorites)
  - `trackGamePurchase(userId, gameId)` - Track purchases (after successful purchase)

## 📋 Cần Làm Tiếp

### **Bước 4: Không Cần Track Trong GamesPage**

❌ **KHÔNG track click** - Chỉ track `view` khi user xem chi tiết game >= 2 giây

```typescript
// GamesPage.tsx - Chỉ cần navigate, không track
<Card
  onClick={() => navigate(`/customer/games/${game.game_id}`)}
>
```

### **Bước 5: Track Views trong GameDetailPage**

```typescript
// frontend/src/pages/customer/GameDetailPage.tsx

import { useEffect } from 'react';
import { trackGameViewDebounced } from '../../services/interactionTracking';

// Trong component:
useEffect(() => {
  if (currentUser && gameId) {
    // Track view after 2 seconds (user actually viewed the page)
    trackGameViewDebounced(currentUser.user_id, parseInt(gameId), 2000);
  }
}, [currentUser, gameId]);
```

### **Bước 6: Track Likes trong Wishlist**

```typescript
// Khi user thêm vào wishlist
import { trackGameLike } from '../../services/interactionTracking';

const handleAddToWishlist = async (gameId: number) => {
  // ... existing wishlist logic ...
  
  if (currentUser) {
    await trackGameLike(currentUser.user_id, gameId);
  }
};
```

### **Bước 7: Track Purchases**

```typescript
// Sau khi purchase thành công
import { trackGamePurchase } from '../../services/interactionTracking';

const handlePurchase = async (gameId: number) => {
  // ... existing purchase logic ...
  
  if (currentUser && purchaseSuccess) {
    await trackGamePurchase(currentUser.user_id, gameId);
  }
};
```

## 🔮 Tương Lai: Behavior Analysis (Pending)

### **Bước 8: Python Behavior Analyzer**

Tạo script phân tích behavior patterns:

```python
# predict/analyze_user_behavior.py

def analyze_user_behavior(user_id):
    """Phân tích hành vi user từ interactions"""
    conn = sqlite3.connect('user_interactions.db')
    cursor = conn.cursor()
    
    # Get interactions
    cursor.execute('''
        SELECT game_id, interaction_type, timestamp
        FROM user_interactions
        WHERE user_id = ?
        ORDER BY timestamp DESC
    ''', (user_id,))
    
    interactions = cursor.fetchall()
    
    # Analyze preferred genres
    # Analyze price tolerance
    # Analyze engagement patterns
    # ... return behavior patterns
```

### **Bước 9: Dynamic Weights**

Update `game_recommendation_system.py` để adjust weights dựa trên behavior:

```python
def get_dynamic_weights(user_id, has_keyword=False):
    """Tính trọng số động based on user behavior"""
    
    # Load behavior patterns from SQLite
    patterns = load_user_behavior_patterns(user_id)
    
    if patterns['high_engagement']:
        # User active → tăng SVD weight
        svd_weight = 0.35
    else:
        # User mới → tăng content weight
        content_weight = 0.50
    
    # ... return dynamic weights
```

### **Bước 10: Auto-Retrain Model**

Tự động retrain SVD model khi có đủ interactions mới:

```python
def check_and_retrain_svd(user_id):
    """Check if need to retrain based on new interactions"""
    
    # Count new interactions since last train
    new_interactions = get_new_interactions_count(user_id)
    
    if new_interactions >= 10:  # Threshold
        print(f"🔄 Retraining model for user {user_id}...")
        retrain_svd_model()
        log_training(user_id, new_interactions)
```

## 📊 Testing

### Test Backend API:

```bash
# Log an interaction
curl -X POST http://localhost:3001/api/ai/interaction \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "game_id": 5,
    "interaction_type": "view"
  }'

# Get user interactions
curl http://localhost:3001/api/ai/interactions/1

# Get stats
curl http://localhost:3001/api/ai/stats
```

### Check Database:

```bash
cd predict
python

>>> import sqlite3
>>> conn = sqlite3.connect('user_interactions.db')
>>> cursor = conn.cursor()
>>> cursor.execute('SELECT * FROM user_interactions WHERE user_id = 1')
>>> cursor.fetchall()
```

## 🎯 Benefits

1. ✅ **Personalization**: Recommendations improve over time
2. ✅ **Engagement Tracking**: Understand user behavior
3. ✅ **A/B Testing**: Test different recommendation strategies
4. ✅ **Analytics**: Track what works and what doesn't
5. ✅ **Privacy**: SQLite local storage, easy to clear

## 🚀 Next Steps

1. Integrate tracking vào GamesPage (Bước 4-7)
2. Test tracking hoạt động
3. Implement behavior analysis (Bước 8)
4. Add dynamic weights (Bước 9)
5. Auto-retrain logic (Bước 10)

---

**Hệ thống đã sẵn sàng để track interactions! Chỉ cần integrate vào các components là xong.** ✨

