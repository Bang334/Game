# 🔍 NGUYÊN LÝ TÍNH ĐIỂM SVD TRONG CODE

> **Tài liệu này giải thích chi tiết cách code Python tính SVD Score trong file `game_recommendation_system.py`**

---

## 📋 MỤC LỤC

1. [Tổng quan luồng xử lý](#1-tổng-quan-luồng-xử-lý)
2. [Bước 1: Xây dựng ma trận User-Game](#2-bước-1-xây-dựng-ma-trận-user-game)
3. [Bước 2: Huấn luyện SVD Model](#3-bước-2-huấn-luyện-svd-model)
4. [Bước 3: Dự đoán ratings](#4-bước-3-dự-đoán-ratings)
5. [Bước 4: Chuẩn hóa về [0, 1]](#5-bước-4-chuẩn-hóa-về-0-1)
6. [Ví dụ cụ thể](#6-ví-dụ-cụ-thể)

---

## 1. Tổng quan luồng xử lý

```
┌─────────────────────────────────────────────────────────────────┐
│  INPUT: game.json (users, games, interactions)                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  preprocess_data() - Lines 136-183                              │
│  → Tạo ma trận ratings (user × game) từ interactions           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  train_svd_model(k=2) - Lines 185-212                          │
│  → Áp dụng SVD: U, Σ, Vᵀ                                       │
│  → Tính predicted_ratings cho tất cả user-game pairs           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  get_svd_recommendations(user_id) - Lines 454-501               │
│  → Lấy predicted ratings cho user                               │
│  → Loại bỏ games đã tương tác                                   │
│  → Sắp xếp theo predicted rating                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  get_hybrid_recommendations() - Lines 1487-1792                 │
│  → Chuẩn hóa SVD scores về [0, 1]                              │
│  → Kết hợp với Content, Demographic, Keyword scores            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  OUTPUT: Recommendations với SVD score normalized               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Bước 1: Xây dựng ma trận User-Game

### 📍 Vị trí: `preprocess_data()` - Lines 136-183

### 🎯 Mục đích
Chuyển đổi interactions của users với games thành ma trận số học (User-Item Matrix).

### 📊 Cách tính rating cho mỗi user-game pair

```python
# Lines 146-172
for user in self.users_data:
    user_id = user['id']
    favorites = user.get('favorite_games', [])
    purchased = user.get('purchased_games', {})  # Dict: {game_id: rating}
    view_history = user.get('view_history', [])
    
    for game in self.games_data:
        game_id = game['id']
        rating = 0.0
        
        # 1. WISHLIST/FAVORITE: +3.0 điểm
        if game_id in favorites:
            rating += 3.0
        
        # 2. PURCHASED: +rating thực tế (1-5)
        if game_id in purchased:
            rating += purchased[game_id]  # Điểm đánh giá thực tế
        
        # 3. VIEW HISTORY: +0.5 điểm mỗi lần xem
        view_count = view_history.get(game_id, 0)
        rating += view_count * 0.5
        
        # Lưu vào list
        user_game_ratings.append({
            'user_id': user_id,
            'game_id': game_id,
            'rating': rating
        })
```

### 📈 Công thức tổng hợp

```
Rating[user][game] = Favorite_Score + Purchased_Rating + (View_Count × 0.5)

Ví dụ:
- Game A: Favorite (3.0) + Purchased (4/5) + Viewed 3 times (1.5) = 8.5
- Game B: Purchased only (5/5) = 5.0
- Game C: Viewed 2 times only = 1.0
- Game D: No interaction = 0.0
```

### 🗂️ Kết quả: Ma trận Pivot

```python
# Line 180
self.user_item_matrix = ratings_df.pivot(
    index='user_id', 
    columns='game_id', 
    values='rating'
).fillna(0)
```

**Output:**
```
        Game_1  Game_2  Game_3  Game_4  Game_5  ...
User_1    8.5     5.0     0.0     3.0     1.0
User_2    3.0     0.0     7.5     5.0     0.0
User_3    0.0     4.0     3.0     0.0     5.5
...
```

---

## 3. Bước 2: Huấn luyện SVD Model

### 📍 Vị trí: `train_svd_model(k=2)` - Lines 185-212

### 🎯 Mục đích
Phân tách ma trận ratings thành 3 ma trận nhỏ hơn (U, Σ, Vᵀ) và tính predicted ratings.

### 📐 Các bước chi tiết

#### **Step 1: Mean Centering (Line 189-190)**

```python
# Tính mean rating của mỗi user
user_ratings_mean = np.mean(self.user_item_matrix.values, axis=1)

# Trừ mean để center data
ratings_demeaned = self.user_item_matrix.values - user_ratings_mean.reshape(-1, 1)
```

**Tại sao phải mean centering?**
- SVD hoạt động tốt hơn với dữ liệu centered (mean = 0)
- Loại bỏ bias của user (user khó tính vs dễ tính)

**Ví dụ:**
```
Original ratings (User 1):
[8.5, 5.0, 0.0, 3.0, 1.0]

Mean = (8.5 + 5.0 + 0.0 + 3.0 + 1.0) / 5 = 3.5

Demeaned ratings:
[8.5-3.5, 5.0-3.5, 0.0-3.5, 3.0-3.5, 1.0-3.5]
= [5.0, 1.5, -3.5, -0.5, -2.5]
```

---

#### **Step 2: SVD Decomposition (Line 193)**

```python
from scipy.sparse.linalg import svds

U, sigma, Vt = svds(ratings_demeaned, k=k)
```

**Input:**
- `ratings_demeaned`: Ma trận (m users × n games) đã centered
- `k=2`: Số latent factors (dimensions)

**Output:**
- `U`: Ma trận (m users × k factors) - User preferences
- `sigma`: Array (k,) - Singular values (importance)
- `Vt`: Ma trận (k factors × n games) - Game features

**Ví dụ với k=2:**
```python
# U shape: (5 users, 2 factors)
U = [[-0.52, -0.18],  # User 1
     [-0.41, -0.29],  # User 2
     [-0.38,  0.58],  # User 3
     [-0.54,  0.70],  # User 4
     [-0.31,  0.45]]  # User 5

# sigma shape: (2,)
sigma = [9.72, 5.22]

# Vt shape: (2 factors, 10 games)
Vt = [[-0.46, -0.38, -0.30, ...],  # Factor 1
      [ 0.14, -0.52, -0.72, ...]]  # Factor 2
```

---

#### **Step 3: Convert sigma to diagonal matrix (Line 194)**

```python
sigma = np.diag(sigma)
```

**Trước:**
```python
sigma = [9.72, 5.22]  # Array 1D
```

**Sau:**
```python
sigma = [[9.72,  0  ],  # Matrix 2×2
         [ 0,   5.22]]
```

---

#### **Step 4: Reconstruct predicted ratings (Line 197)**

```python
predicted_ratings = np.dot(np.dot(U, sigma), Vt) + user_ratings_mean.reshape(-1, 1)
```

**Công thức:**
```
Predicted_Ratings = U × Σ × Vᵀ + Mean
```

**Chi tiết phép tính:**

```python
# 1. U × Σ (users × factors) × (factors × factors)
U_sigma = U @ sigma  # shape: (users × factors)

# Example:
# [[-0.52, -0.18],  ×  [[9.72,  0  ],  =  [[-5.05, -0.94],
#  [-0.41, -0.29]]      [ 0,   5.22]]      [-3.99, -1.51]]

# 2. (U × Σ) × Vᵀ (users × factors) × (factors × games)
predictions_centered = U_sigma @ Vt  # shape: (users × games)

# Example:
# [[-5.05, -0.94],  ×  [[-0.46, -0.38, ...],  =  [[2.19, 2.44, ...],
#  [-3.99, -1.51]]      [ 0.14, -0.52, ...]]      [1.62, 2.30, ...]]

# 3. Add back mean
predicted_ratings = predictions_centered + user_ratings_mean.reshape(-1, 1)

# Example (User 1 mean = 3.5):
# [[2.19 + 3.5, 2.44 + 3.5, ...],  =  [[5.69, 5.94, ...],
#  [1.62 + 2.8, 2.30 + 2.8, ...]]      [4.42, 5.10, ...]]
```

**Kết quả:**
```python
predicted_ratings[user_id][game_id] = Predicted rating cho user-game pair
```

---

#### **Step 5: Lưu model (Lines 200-206)**

```python
self.svd_model = {
    'U': U,                          # User-factor matrix
    'sigma': sigma,                  # Singular values (diagonal)
    'Vt': Vt,                        # Game-factor matrix
    'user_ratings_mean': user_ratings_mean,  # Mean của mỗi user
    'predicted_ratings': predicted_ratings    # Full predictions
}
```

---

## 4. Bước 3: Dự đoán ratings

### 📍 Vị trí: `get_svd_recommendations(user_id)` - Lines 454-501

### 🎯 Mục đích
Lấy predicted ratings cho một user cụ thể và sắp xếp để gợi ý.

### 📊 Code chi tiết

```python
def get_svd_recommendations(self, user_id, top_n=5):
    # Line 461: Convert user_id sang 0-based index
    user_idx = user_id - 1  # User ID 1 → index 0
    
    # Line 465: Lấy predicted ratings của user này
    user_predictions = self.svd_model['predicted_ratings'][user_idx]
    
    # Ví dụ:
    # user_predictions = [5.69, 5.94, 3.21, 4.87, 6.12, ...]
    #                     ↑      ↑     ↑     ↑     ↑
    #                   Game1  Game2 Game3 Game4 Game5
    
    # Lines 468-476: Lấy games đã tương tác để loại bỏ
    user_data = next((u for u in self.users_data if u['id'] == user_id), None)
    if user_data:
        view_history = user_data.get('view_history', {})
        purchased_games = user_data.get('purchased_games', {})
        interacted_games = set(
            user_data.get('favorite_games', []) + 
            list(purchased_games.keys()) +
            list(view_history.keys())
        )
    
    # Lines 479-493: Tạo recommendations
    recommendations = []
    for game_idx, predicted_rating in enumerate(user_predictions):
        game_id = game_idx + 1  # Convert index → ID
        
        # Chỉ gợi ý games chưa tương tác
        if game_id not in interacted_games:
            game = next((g for g in self.games_data if g['id'] == game_id), None)
            if game:
                recommendations.append({
                    'game_id': game_id,
                    'game_name': game['name'],
                    'predicted_rating': predicted_rating,  # ← SVD Score (raw)
                    'actual_rating': game.get('rating', 0),
                    'genre': game.get('genre', []),
                    'price': game.get('price', 0),
                    'downloads': game.get('downloads', 0)
                })
    
    # Line 496: Sắp xếp theo predicted rating (cao → thấp)
    recommendations.sort(key=lambda x: x['predicted_rating'], reverse=True)
    
    return recommendations[:top_n]
```

### 📈 Kết quả

```python
[
    {
        'game_id': 5,
        'game_name': 'Game E',
        'predicted_rating': 6.12,  # ← Cao nhất
        'actual_rating': 4.5,
        'genre': ['Action', 'Adventure'],
        ...
    },
    {
        'game_id': 2,
        'game_name': 'Game B',
        'predicted_rating': 5.94,  # ← Cao thứ 2
        ...
    },
    ...
]
```

---

## 5. Bước 4: Chuẩn hóa về [0, 1]

### 📍 Vị trí: `get_hybrid_recommendations()` - Lines 1650-1711

### 🎯 Mục đích
Chuẩn hóa SVD scores về khoảng [0, 1] để kết hợp với các scores khác.

### 📐 Công thức Min-Max Normalization

```python
# Lines 1651-1657: Tìm min/max của SVD scores
svd_scores = [all_games[game_id]['svd_score'] 
              for game_id in all_games 
              if all_games[game_id]['svd_score'] != 0]

if svd_scores:
    svd_min = min(svd_scores)  # Ví dụ: 3.21
    svd_max = max(svd_scores)  # Ví dụ: 6.12
    svd_range = svd_max - svd_min  # 6.12 - 3.21 = 2.91
```

### 🔢 Chuẩn hóa từng game

```python
# Lines 1697-1701: Normalize SVD score
for game_id in all_games:
    svd_score = all_games[game_id]['svd_score']
    
    if svd_score != 0 and svd_range > 0:
        # Min-max normalization
        svd_normalized = (svd_score - svd_min) / svd_range
    else:
        svd_normalized = 0
    
    # Cập nhật score đã chuẩn hóa
    all_games[game_id]['svd_score'] = svd_normalized
```

### 📊 Ví dụ cụ thể

```python
# Original SVD scores:
Game A: 6.12  # Max
Game B: 5.94
Game C: 4.87
Game D: 3.21  # Min

# Normalize:
svd_min = 3.21
svd_max = 6.12
svd_range = 2.91

# Game A normalized:
(6.12 - 3.21) / 2.91 = 2.91 / 2.91 = 1.000  ← Max score

# Game B normalized:
(5.94 - 3.21) / 2.91 = 2.73 / 2.91 = 0.938

# Game C normalized:
(4.87 - 3.21) / 2.91 = 1.66 / 2.91 = 0.571

# Game D normalized:
(3.21 - 3.21) / 2.91 = 0.00 / 2.91 = 0.000  ← Min score
```

### ⚖️ Kết hợp với các scores khác

```python
# Line 1712-1716: Tính hybrid score
hybrid_score = (
    svd_weight * svd_normalized +           # 0.45 × svd_score
    content_weight * content_normalized +   # 0.35 × content_score
    demographic_weight * demographic_normalized +  # 0.20 × demo_score
    keyword_weight * keyword_normalized     # 0.00 (nếu không có keyword)
)
```

**Ví dụ:**
```python
# Game A:
hybrid_score = (0.45 × 1.000) + (0.35 × 0.823) + (0.20 × 0.612) + (0.00 × 0)
             = 0.450 + 0.288 + 0.122 + 0.000
             = 0.860
```

---

## 6. Ví dụ cụ thể

### 🎮 Scenario: User 3 tìm game "action"

#### **Input Data**

```python
# User 3 interactions:
favorites = [2]           # Game B
purchased = {4: 5}        # Game D rated 5/5
view_history = {1: 3}     # Game A viewed 3 times

# Ma trận ratings (User 3 row):
[1.5, 3.0, 0.0, 5.0, 0.0, 0.0, ...]
 ↑    ↑           ↑
Game1 Game2      Game4
(3×0.5) (fav)   (purchased)
```

---

#### **Step 1: SVD Training**

```python
# Mean centering:
user_3_mean = (1.5 + 3.0 + 5.0) / 10 games = 0.95

demeaned = [1.5-0.95, 3.0-0.95, 0.0-0.95, 5.0-0.95, -0.95, ...]
         = [0.55, 2.05, -0.95, 4.05, -0.95, ...]

# SVD decomposition (k=2):
U[2] = [-0.38, 0.58]  # User 3 vector
sigma = [[9.72, 0], [0, 5.22]]
Vt[:, 5] = [-0.57, 0.25]  # Game 6 vector
```

---

#### **Step 2: Predict Rating (User 3 - Game 6)**

```python
# Dot product:
predicted_centered = U[2] @ sigma @ Vt[:, 5]
                   = [-0.38, 0.58] @ [[9.72, 0], [0, 5.22]] @ [-0.57, 0.25]
                   = [-0.38×9.72, 0.58×5.22] @ [-0.57, 0.25]
                   = [-3.69, 3.03] @ [-0.57, 0.25]
                   = (-3.69 × -0.57) + (3.03 × 0.25)
                   = 2.10 + 0.76
                   = 2.86

# Add back mean:
predicted_rating = 2.86 + 0.95 = 3.81
```

---

#### **Step 3: Get Top Recommendations**

```python
# Tất cả predicted ratings (User 3):
Game 1: 4.21  # Đã viewed → Loại
Game 2: 5.03  # Đã favorite → Loại
Game 3: 6.12  ← Cao nhất, chưa tương tác → Rank 1
Game 4: 5.87  # Đã purchased → Loại
Game 5: 5.54  ← Rank 2
Game 6: 3.81  ← Rank 5
...

Recommendations (raw SVD scores):
[
    {'game_id': 3, 'predicted_rating': 6.12},
    {'game_id': 5, 'predicted_rating': 5.54},
    {'game_id': 7, 'predicted_rating': 4.93},
    {'game_id': 9, 'predicted_rating': 4.28},
    {'game_id': 6, 'predicted_rating': 3.81},
]
```

---

#### **Step 4: Normalize SVD Scores**

```python
# Min-max normalization:
svd_min = 3.81  # Game 6 (lowest in top 5)
svd_max = 6.12  # Game 3 (highest)
svd_range = 2.31

# Game 3 normalized:
(6.12 - 3.81) / 2.31 = 1.000  ← Highest

# Game 5 normalized:
(5.54 - 3.81) / 2.31 = 0.749

# Game 6 normalized:
(3.81 - 3.81) / 2.31 = 0.000  ← Lowest
```

---

#### **Step 5: Hybrid Score (with keyword "action")**

```python
# Weights (with keyword):
svd_weight = 0.15
content_weight = 0.15
demographic_weight = 0.10
keyword_weight = 0.60

# Game 3 scores:
svd_score = 1.000
content_score = 0.823  # Similar to games user liked
demographic_score = 0.612  # Popular with similar users
keyword_score = 0.889  # Strong "action" match in genre

# Hybrid:
hybrid_score = (0.15 × 1.000) + (0.15 × 0.823) + (0.10 × 0.612) + (0.60 × 0.889)
             = 0.150 + 0.123 + 0.061 + 0.533
             = 0.867  ← FINAL SCORE
```

---

## 📊 Tóm tắt Flow Chart

```
game.json
    ↓
preprocess_data()
    → Rating = Favorite(3.0) + Purchased(rating) + Views(count×0.5)
    ↓
user_item_matrix (m×n)
    ↓
train_svd_model(k=2)
    → Mean centering
    → U, Σ, Vᵀ = svds(demeaned, k=2)
    → predicted_ratings = U × Σ × Vᵀ + mean
    ↓
get_svd_recommendations(user_id)
    → Lấy predicted_ratings[user_id]
    → Loại games đã tương tác
    → Sort theo predicted_rating
    ↓
get_hybrid_recommendations()
    → Normalize SVD: (score - min) / (max - min)
    → Hybrid = SVD×0.15 + Content×0.15 + Demo×0.10 + Keyword×0.60
    ↓
Final recommendations với SVD score [0, 1]
```

---

## 🔑 Điểm quan trọng

### ✅ SVD Score được tính TỰ ĐỘNG
- Không cần metadata (genre, publisher, price)
- Chỉ cần interactions: favorites, purchases, views
- Tìm patterns ẩn từ hành vi users

### ✅ Mean Centering quan trọng
- Loại bỏ bias của user (khó tính vs dễ tính)
- SVD hoạt động tốt hơn với data centered

### ✅ k=2 là số factors
- k nhỏ → model đơn giản, tránh overfitting
- k=2 phù hợp với dataset nhỏ (5 users, 10 games)
- Production: nên dùng k=50-200

### ✅ Normalization để kết hợp
- SVD scores có range khác nhau giữa các users
- Min-max normalization → [0, 1]
- Dễ kết hợp với content, demographic, keyword scores

---

**📅 Tạo: 06/11/2025**  
**👨‍💻 Tác giả: AI Assistant**

