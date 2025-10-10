# 🎯 Adaptive Game Recommendation System

## Tổng quan

Hệ thống **Adaptive Recommendation** tự động điều chỉnh gợi ý dựa trên sở thích và hành vi người dùng. Hệ thống phân tích lịch sử tương tác (favorite, purchased, view_history) để tăng điểm cho các game khớp với preferences.

## ✨ Tính năng chính

### 1. **Phân tích User Preferences**
Hệ thống tự động phân tích:
- **Publisher**: Nhà sản xuất nào user thường chọn
- **Genre**: Thể loại game user thích
- **Price Range**: Khoảng giá user quen thuộc
- **Age Rating**: Độ tuổi game phù hợp
- **Mode**: Online/Offline preference
- **Platform**: PC, Mobile, Console...

### 2. **Preference Boosting**
Games khớp với preferences sẽ được tăng điểm (boost):

| Attribute | Boost Factor | Điều kiện |
|-----------|--------------|-----------|
| **Publisher (Top)** | x1.5 | Trùng với nhà sản xuất user thường chọn (score ≥ 0.3) |
| **Publisher (Medium)** | x1.3 | Nhà sản xuất phổ biến (0.1 ≤ score < 0.3) |
| **Genre (Top)** | x1.4 | Thể loại yêu thích (score ≥ 0.4) |
| **Genre (Medium)** | x1.25 | Thể loại phổ biến (0.2 ≤ score < 0.4) |
| **Price Range** | x1.2 | Trong khoảng giá quen thuộc (avg ± std) |
| **Age Rating** | x1.15 | Độ tuổi phù hợp (score ≥ 0.3) |
| **Mode** | x1.15 | Online/Offline khớp (score ≥ 0.3) |
| **Platform** | x1.1 | Platform phù hợp (score ≥ 0.3) |

**Ví dụ:**
- Game A có hybrid score = 0.5, không khớp preferences → Final score = 0.5
- Game B có hybrid score = 0.5, khớp publisher (x1.5) và genre (x1.4) → Final score = 0.5 × 1.5 × 1.4 = **1.05** ✨

→ Game B sẽ được xếp trên Game A dù ban đầu có điểm bằng nhau!

### 3. **Ví dụ thực tế**

#### User Profile:
```json
{
  "favorite_games": [9, 19, 21],
  "purchased_games": {"5": 4, "9": 5, "18": 3},
  "view_history": {"5": 12, "7": 5, "11": 8}
}
```

#### Preferences được phân tích:
```
Top Publishers: ["CD Projekt Red", "Rockstar Games", "Valve"]
Top Genres: ["Action", "RPG", "Adventure"]
Price Range: 800,000 VND (±300,000)
```

#### Kết quả Boosting:
- **Game "The Witcher 3"** (Publisher: CD Projekt Red, Genre: RPG)
  - Boost: 1.5 (publisher) × 1.4 (genre) = **2.1x** 🚀
  - Score: 0.45 → **0.945**

- **Game "Candy Crush"** (Publisher: King, Genre: Casual)
  - Boost: 1.0 (no match)
  - Score: 0.65 → **0.65**

→ "The Witcher 3" được xếp trên dù score gốc thấp hơn!

## 🚀 Cách sử dụng

### Command Line

```bash
# Enable adaptive (mặc định)
python game_recommendation_system.py --user 1 --adaptive 1

# Disable adaptive
python game_recommendation_system.py --user 1 --adaptive 0

# Với keyword search
python game_recommendation_system.py --user 1 --query "action" --adaptive 1

# Generate charts
python game_recommendation_system.py --user 1 --adaptive 1 --chart 1
```

### Trong Code

```python
# Khởi tạo
recommender = GameRecommendationSystem()
recommender.load_data()
recommender.preprocess_data()
recommender.train_svd_model(k=2)
recommender.build_content_similarity()

# Lấy recommendations với adaptive boosting
recommendations = recommender.get_hybrid_recommendations(
    user_id=1,
    top_n=10,
    keyword="",
    enable_adaptive=True  # Bật adaptive
)

# Phân tích preferences
preferences = recommender.analyze_user_preferences(user_id=1)
print(f"Top Publishers: {preferences['publishers']}")
print(f"Top Genres: {preferences['genres']}")
print(f"Price Range: {preferences['price_avg']}")

# Tính boost cho 1 game cụ thể
game = recommender.games_data[0]  # Game đầu tiên
boost_factor = recommender.calculate_preference_boost(game, preferences, debug=True)
print(f"Boost Factor: {boost_factor}")
```

## 📊 Output

### Console Output
```
🎯 Adaptive Preference Boosting Enabled
   Top Publishers: ['CD Projekt Red', 'Rockstar Games', 'Valve']
   Top Genres: ['Action', 'RPG', 'Adventure']
   Price Range: 800,000 VND (±300,000)
   ✓ Boosted 25/50 games based on preferences

🚀 Top Boosted Games (by user preferences):
   1. The Witcher 3 - Boost: 2.10x (Score: 0.450 → 0.945)
   2. GTA V - Boost: 1.95x (Score: 0.520 → 1.014)
   3. Portal 2 - Boost: 1.65x (Score: 0.380 → 0.627)

1. The Witcher 3 🚀x2.10
   Rating: 4.8/5.0
   Genre: Action, RPG, Adventure
   Price: 800,000 VND
   Hybrid Score: 0.945 (boosted from 0.450)
   ...
```

### JSON Output
Games trong `recommendations.json` sẽ có thêm trường `score` đã được boost:

```json
{
  "games": [
    {
      "id": 5,
      "name": "The Witcher 3",
      "score": 0.945,  // Đã boost từ 0.450
      "publisher": "CD Projekt Red",
      "genre": ["Action", "RPG"],
      ...
    }
  ]
}
```

## 🔧 Customization

### Điều chỉnh Boost Factors

Trong `game_recommendation_system.py`, method `calculate_preference_boost()`:

```python
# Publisher boost
if publisher_score >= 0.3:
    boost_factor *= 1.5  # Thay đổi từ 1.5 → 2.0 để boost mạnh hơn

# Genre boost  
if max_genre_score >= 0.4:
    boost_factor *= 1.4  # Thay đổi từ 1.4 → 1.6

# Price range
if abs(price - price_avg) <= price_std:
    boost_factor *= 1.2  # Thay đổi từ 1.2 → 1.3
```

### Thêm attributes mới để boost

```python
# Trong analyze_user_preferences()
# Thêm phân tích multiplayer preference
multiplayer_count = 0
for game_id, weight in weighted_interactions.items():
    game = next((g for g in self.games_data if g['id'] == game_id), None)
    if game and game.get('multiplayer', False):
        multiplayer_count += weight

preferences['multiplayer_preference'] = multiplayer_count / total_weight

# Trong calculate_preference_boost()
# Thêm boost cho multiplayer
if game.get('multiplayer', False) and user_preferences.get('multiplayer_preference', 0) > 0.5:
    boost_factor *= 1.2
```

## 📈 Tích hợp với Backend/API

### Ví dụ Flask API

```python
from flask import Flask, request, jsonify
from game_recommendation_system import GameRecommendationSystem

app = Flask(__name__)
recommender = GameRecommendationSystem()
recommender.load_data()
recommender.preprocess_data()
recommender.train_svd_model(k=2)
recommender.build_content_similarity()

@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    user_id = int(request.args.get('user_id', 1))
    keyword = request.args.get('query', '')
    adaptive = int(request.args.get('adaptive', 1))
    top_n = int(request.args.get('top_n', 10))
    
    # Lấy recommendations
    recommendations = recommender.get_hybrid_recommendations(
        user_id=user_id,
        top_n=top_n,
        keyword=keyword,
        enable_adaptive=bool(adaptive)
    )
    
    # Trả về JSON
    return jsonify({
        'user_id': user_id,
        'adaptive_enabled': bool(adaptive),
        'total_results': len(recommendations),
        'games': recommendations[:top_n]
    })

@app.route('/api/preferences/<int:user_id>', methods=['GET'])
def get_user_preferences(user_id):
    preferences = recommender.analyze_user_preferences(user_id)
    return jsonify(preferences)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

## 🎓 Giải thích thuật toán

### Workflow

```
1. Phân tích User Interactions
   ↓
   favorite_games (weight: 5.0)
   purchased_games (weight: 3.0 + rating)
   view_history (weight: 0.5 × view_count)
   ↓
2. Extract Preferences
   ↓
   Publisher scores (normalized)
   Genre scores (normalized)
   Price range (avg, std)
   Mode, Platform, Age rating...
   ↓
3. Tính Base Scores
   ↓
   SVD score
   Content similarity score
   Demographic score
   Keyword score
   ↓
4. Calculate Hybrid Score
   ↓
   hybrid_score = weighted_sum(scores)
   ↓
5. Apply Preference Boost
   ↓
   boost_factor = Π(attribute_boosts)
   final_score = hybrid_score × boost_factor
   ↓
6. Sort & Return Top N
```

### Công thức Boost

```
boost_factor = publisher_boost × genre_boost × price_boost × age_boost × mode_boost × platform_boost

final_score = hybrid_score × boost_factor
```

Ví dụ:
```
hybrid_score = 0.5
publisher_boost = 1.5 (match top publisher)
genre_boost = 1.4 (match top genre)
price_boost = 1.2 (in price range)
age_boost = 1.0 (no match)
mode_boost = 1.0 (no match)
platform_boost = 1.0 (no match)

boost_factor = 1.5 × 1.4 × 1.2 = 2.52
final_score = 0.5 × 2.52 = 1.26 ✨
```

## 🔬 Testing & Validation

### Test với/không có Adaptive

```bash
# Test không có adaptive
python game_recommendation_system.py --user 1 --adaptive 0 > output_no_adaptive.txt

# Test có adaptive
python game_recommendation_system.py --user 1 --adaptive 1 > output_with_adaptive.txt

# So sánh kết quả
diff output_no_adaptive.txt output_with_adaptive.txt
```

### Metrics đánh giá

```python
# Tính precision@k
def precision_at_k(recommendations, actual_purchased, k=10):
    recommended_ids = [rec['game_id'] for rec in recommendations[:k]]
    hits = len(set(recommended_ids) & set(actual_purchased))
    return hits / k

# Tính NDCG
def ndcg_at_k(recommendations, relevance_scores, k=10):
    # Implement NDCG calculation
    pass
```

## 💡 Tips & Best Practices

1. **Enable Adaptive cho users có lịch sử tương tác phong phú**
   - ≥ 5 favorite/purchased games
   - ≥ 10 view history entries

2. **Disable Adaptive cho new users**
   - Không đủ data để phân tích preferences
   - Dùng demographic và SVD thay thế

3. **Combine với A/B Testing**
   - 50% users dùng adaptive
   - 50% users không dùng adaptive
   - Đo lường conversion rate, engagement

4. **Cache Preferences**
   - Preferences được cache trong `self.user_preferences`
   - Chỉ tính lại khi có interaction mới

5. **Monitor Boost Distribution**
   - Đảm bảo không quá nhiều games được boost cao
   - Tránh "filter bubble" (chỉ gợi ý 1 loại game)

## 🐛 Troubleshooting

### Issue: Tất cả games đều có boost = 1.0
**Nguyên nhân**: User chưa có đủ interactions

**Giải pháp**: Đảm bảo user có ít nhất 3 games trong favorite/purchased

### Issue: Boost quá cao (>5.0)
**Nguyên nhân**: Nhiều attributes khớp cùng lúc

**Giải pháp**: Giảm boost factors hoặc thêm max cap:
```python
boost_factor = min(boost_factor, 3.0)  # Max 3x boost
```

### Issue: Games không liên quan được boost
**Nguyên nhân**: Preferences không chính xác

**Giải pháp**: Kiểm tra weighted_interactions và normalization

---

**Author**: Adaptive Recommendation Team  
**Version**: 1.0  
**Last Updated**: 2025-01-09

