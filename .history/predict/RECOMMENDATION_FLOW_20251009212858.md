# 🔄 Recommendation Flow - Quy trình Gợi ý Game

## Flow Tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                    get_hybrid_recommendations()                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │  1. Tính Base Scores (4 models)      │
        │     - SVD (Collaborative Filtering)  │
        │     - Content-based                  │
        │     - Demographic                    │
        │     - Keyword Matching               │
        └──────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │  2. Normalize & Calculate            │
        │     Hybrid Score                     │
        │     = SVD×w1 + Content×w2 +         │
        │       Demo×w3 + Keyword×w4          │
        └──────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │  3. Filter excluded games            │
        │     (đã thích, đã mua)              │
        └──────────────────────────────────────┘
                              │
                              ▼
           ╔═══════════════════════════════════╗
           ║  4. ADAPTIVE BOOSTING             ║
           ║     (nếu enable_adaptive=True)    ║
           ╚═══════════════════════════════════╝
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │ analyze_user_         │   │ For each game:        │
    │ preferences()         │   │                       │
    │                       │   │ boost = calculate_    │
    │ Extract từ 7 days:    │   │ preference_boost()    │
    │ - Publishers          │   │                       │
    │ - Genres              │   │ NEW hybrid_score =    │
    │ - Price range         │   │ hybrid_score × boost  │
    │ - Age/Mode/Platform   │   │                       │
    └───────────────────────┘   └───────────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │  5. Sort by Hybrid Score             │
        │     (SAU KHI ĐÃ BOOST)              │
        └──────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │  6. Return Top N Games               │
        │     → Giao diện                     │
        └──────────────────────────────────────┘
```

---

## Chi tiết từng bước

### Bước 1-2: Calculate Base Hybrid Score

```python
# Lines 1505-1509
hybrid_score = (svd_weight * svd_normalized + 
               content_weight * content_normalized + 
               demographic_weight * demographic_normalized +
               keyword_weight * keyword_normalized)

all_games[game_id]['hybrid_score'] = hybrid_score
all_games[game_id]['boost_factor'] = 1.0  # Initialize
```

**Ví dụ**: Apex Legends có base hybrid score = **0.530**

---

### Bước 4: ⭐ ADAPTIVE BOOSTING (KEY!)

```python
# Lines 1530-1563
if enable_adaptive:
    # 4a. Phân tích preferences (7 days hoặc all-time)
    user_preferences = self.analyze_user_preferences(user_id, recent_days=7)
    
    # 4b. Áp dụng boost cho TỪNG game
    for game_id in filtered_games:
        game = get_game_by_id(game_id)
        
        # 4c. Tính boost factor (0.8 - 1.2 per attribute)
        boost_factor = self.calculate_preference_boost(game, user_preferences)
        
        # 4d. ⭐ NHÂN BOOST VÀO HYBRID SCORE
        original_score = filtered_games[game_id]['hybrid_score']
        boosted_score = original_score * boost_factor
        
        # 4e. Cập nhật hybrid_score MỚI
        filtered_games[game_id]['hybrid_score'] = boosted_score
        filtered_games[game_id]['boost_factor'] = boost_factor
        filtered_games[game_id]['original_score'] = original_score  # Lưu để debug
```

**Ví dụ**: 
```
Apex Legends:
  Base score:    0.530
  Boost factor:  ×1.68
  Boosted score: 0.530 × 1.68 = 0.891 ✓
```

---

### Bước 5: Sort sau khi Boost

```python
# Lines 1565-1568
sorted_recommendations = sorted(filtered_games.values(), 
                               key=lambda x: x['hybrid_score'],  # ← Dùng score ĐÃ BOOST
                               reverse=True)
```

**Kết quả**:
- Apex Legends: 0.891 → Rank #1
- Red Dead 2: 0.877 → Rank #2
- ...

---

### Bước 6: Return về Giao diện

```python
# Lines 1577-1590
final_recommendations = sorted_recommendations[:top_n]

# Thêm metadata (link, image, etc.)
for rec in final_recommendations:
    game = get_game_by_id(rec['game_id'])
    rec['link_download'] = game.get('link_download')
    rec['image'] = game.get('image')
    # ...

return final_recommendations  # → Display lên UI
```

---

## 🎯 Trả lời câu hỏi

### ❓ "Game được boost rồi mới đưa vào recommend để hiển thị đúng không?"

**✅ ĐÚNG!** Flow chính xác:

1. ✅ Tính **base hybrid score** (SVD + Content + Demo + Keyword)
2. ✅ **Apply boost** (nếu `enable_adaptive=True`)
3. ✅ **Sort** theo score đã boost
4. ✅ **Return top N** → Hiển thị lên giao diện

→ Games trên giao diện là **SAU KHI ĐÃ BOOST**!

---

## 📊 Minh họa với dữ liệu thực

### Scenario: User "Gamer Pro", recent 7 days thích Sports games

#### Before Boosting (Base scores):
```
Rank  Game                    Base Score
─────────────────────────────────────────
1     Red Dead Redemption 2   0.599
2     Apex Legends            0.530
3     The Witcher 3           0.480
4     Valorant                0.330
5     Overwatch 2             0.256
```

#### After Boosting (×1.68 for Apex, ×1.46 for others):
```
Rank  Game                    Boosted Score  Boost    Base
──────────────────────────────────────────────────────────
1     Apex Legends            0.891         ×1.68    0.530 ⬆️
2     Red Dead Redemption 2   0.877         ×1.46    0.599 ⬇️
3     The Witcher 3           0.703         ×1.46    0.480
4     Valorant                0.476         ×1.44    0.330
5     Overwatch 2             0.431         ×1.68    0.256
```

**Giao diện sẽ hiển thị**:
```json
[
  {
    "game_id": 11,
    "game_name": "Apex Legends",
    "hybrid_score": 0.891,
    "boost_factor": 1.68,
    "original_score": 0.530
  },
  {
    "game_id": 18,
    "game_name": "Red Dead Redemption 2",
    "hybrid_score": 0.877,
    "boost_factor": 1.46,
    "original_score": 0.599
  }
  // ...
]
```

---

## 🔧 Khi nào Boost được áp dụng?

### ✅ Boost được áp dụng khi:
```python
# API call hoặc command
recommender.get_hybrid_recommendations(
    user_id=1,
    enable_adaptive=True,  # ← BẬT adaptive boosting
    recent_days=7          # ← Phân tích 7 ngày gần đây
)
```

### ❌ Boost KHÔNG được áp dụng khi:
```python
recommender.get_hybrid_recommendations(
    user_id=1,
    enable_adaptive=False  # ← TẮT adaptive boosting
)
```

---

## 📱 Ứng dụng thực tế

### Frontend gọi API:
```javascript
// GET /api/recommendations?user_id=1&adaptive=1&days=7
fetch('/api/recommendations?user_id=1&adaptive=1&days=7')
  .then(res => res.json())
  .then(games => {
    // games ĐÃ được boost và sort
    displayGames(games);  // Hiển thị lên UI
  });
```

### Backend xử lý:
```python
# backend/src/recommendations.py
def get_recommendations(user_id, adaptive=True, days=7):
    recommendations = recommender.get_hybrid_recommendations(
        user_id=user_id,
        enable_adaptive=adaptive,
        recent_days=days
    )
    # recommendations ĐÃ được boost và sort
    return recommendations
```

---

## 💡 Lợi ích của flow này

### 1. **Transparent**
- Có thể so sánh base vs boosted score
- Debug dễ dàng (lưu `original_score`)

### 2. **Flexible**
- Có thể bật/tắt boost (`enable_adaptive`)
- Có thể thay đổi time window (`recent_days`)

### 3. **Dynamic**
- Recommendations thay đổi theo recent behavior
- User thích Sports games → Sports games lên top

### 4. **Fair**
- Boost không quá lớn (range 0.8-1.2)
- Base score vẫn quan trọng

---

## 🎓 Summary

**Câu trả lời ngắn gọn**:

✅ **ĐÃ BOOST** → Display lên giao diện

**Flow đầy đủ**:
```
Base Score → Apply Boost → Sort → Top N → Giao diện
  0.530    →   ×1.68    → #1   →  ✓   → User thấy
```

**Code reference**: `game_recommendation_system.py` lines 1530-1568

---

**🎯 Kết luận**: User trên giao diện **LUÔN thấy games đã được boost** (nếu `enable_adaptive=True`)! 🚀

