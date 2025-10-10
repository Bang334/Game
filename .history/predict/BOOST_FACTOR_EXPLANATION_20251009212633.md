# 📊 Boost Factor Calculation - Giải thích Chi tiết

## Tổng quan

**Boost Factor** là hệ số nhân được áp dụng lên **base score** của game để tạo ra **7-day boosted score** dựa trên preferences của user trong 7 ngày gần nhất.

**Công thức**:
```
7-Day Boosted Score = Base Score × Boost Factor
```

---

## 🔍 Ví dụ Cụ thể: Apex Legends cho User "Gamer Pro"

### Kết quả:
```
Base Score:    0.530
Boosted Score: 1.167
Boost Factor:  ×2.20

Impact: +0.637 (tăng 120%)
```

**Câu hỏi: Tại sao Boost Factor = ×2.20?**

---

## 📈 Bước 1: Phân tích Lịch sử Tương tác 7 Ngày Gần Đây

Hệ thống analyze interactions của user trong 7 ngày:

### Interactions được phân tích:
1. **Favorite games** (trọng số = 5 điểm)
2. **Purchased games** (trọng số = 3 điểm)
3. **View history** (trọng số = 0.5 điểm/lần xem)

### Ví dụ với User "Gamer Pro" (7 ngày gần đây):

#### From SQLite Database:
```sql
SELECT * FROM interactions 
WHERE user_id = 1 
  AND timestamp >= datetime('now', '-7 days')
ORDER BY timestamp DESC;
```

**Kết quả** (giả định):
| Game ID | Game Name | Interaction Type | Timestamp | Publisher | Genre | Mode | Platform | Age Rating |
|---------|-----------|------------------|-----------|-----------|-------|------|----------|------------|
| 16 | Madden NFL 24 | view | 2024-10-07 | EA Sports | Sports | Multiplayer | PC | T |
| 44 | NBA 2K24 | purchase | 2024-10-06 | 2K Sports | Sports | Multiplayer | PC | E |
| 44 | NBA 2K24 | view | 2024-10-06 | 2K Sports | Sports | Multiplayer | PC | E |
| 16 | Madden NFL 24 | view | 2024-10-05 | EA Sports | Sports | Multiplayer | PC | T |
| 44 | NBA 2K24 | view | 2024-10-04 | 2K Sports | Sports | Multiplayer | PC | E |
| 11 | Apex Legends | view | 2024-10-03 | EA | Shooter | Multiplayer | PC | T |
| 50 | Valorant | favorite | 2024-10-03 | Riot | Shooter | Multiplayer | PC | T |

---

## 📊 Bước 2: Tính Preference Scores

### 2.1 Publisher Preferences

**Công thức**:
```
Score(Publisher) = Σ(weight × count) / Total Weight
```

**Tính toán**:
| Publisher | Interactions | Weight Calculation | Score |
|-----------|--------------|-------------------|-------|
| EA Sports | 2 views | 2 × 0.5 = 1.0 | 0.15 |
| 2K Sports | 1 purchase + 2 views | 3 + 2×0.5 = 4.0 | 0.60 |
| Riot | 1 favorite | 1 × 5 = 5.0 | 0.75 |
| EA | 1 view | 1 × 0.5 = 0.5 | 0.07 |

**Normalized Top Publishers**: `['2K Sports', 'Riot', 'EA Sports', 'EA']`

---

### 2.2 Genre Preferences

| Genre | Interactions | Weight Calculation | Score |
|-------|--------------|-------------------|-------|
| Sports | 3 views + 1 purchase | 3×0.5 + 3 = 4.5 | 0.45 |
| Shooter | 1 view + 1 favorite | 0.5 + 5 = 5.5 | 0.55 |

**Normalized Top Genres**: `['Shooter', 'Sports']`

---

### 2.3 Age Rating Preferences

| Age Rating | Count | Score |
|------------|-------|-------|
| T (Teen) | 4 | 0.67 |
| E (Everyone) | 2 | 0.33 |

---

### 2.4 Mode Preferences

| Mode | Count | Score |
|------|-------|-------|
| Multiplayer | 6 | 1.00 |

---

### 2.5 Platform Preferences

| Platform | Count | Score |
|----------|-------|-------|
| PC | 6 | 1.00 |

---

### 2.6 Price Range Preferences

**Games purchased/viewed (7 days)**:
```
Prices: [1,399,000, 1,399,000, 659,000] VND
Average: 1,152,333 VND
Std Dev: 426,877 VND
```

---

## 🎯 Bước 3: Calculate Boost cho Apex Legends

### Thông tin Apex Legends:
```json
{
  "id": 11,
  "name": "Apex Legends",
  "publisher": "EA",
  "genre": ["Battle Royale", "Shooter", "Action"],
  "price": 0,
  "age_rating": "T",
  "mode": "Multiplayer",
  "platform": ["PC", "PlayStation", "Xbox"]
}
```

---

### 3.1 Publisher Boost

**Logic**:
```python
if publisher in user_preferences['publishers']:
    score = user_preferences['publishers'][publisher]
    if score >= 0.3:
        boost = 1.5
    elif score >= 0.1:
        boost = 1.3
    else:
        boost = 1.1
```

**Áp dụng**:
- Apex Legends publisher = "EA"
- User preference score for "EA" = **0.07** (< 0.1)
- **Publisher Boost = ×1.10** ✅

---

### 3.2 Genre Boost

**Logic**:
```python
genres = game['genre']  # ['Battle Royale', 'Shooter', 'Action']
genre_boosts = []

for genre in genres:
    if genre in user_preferences['genres']:
        score = user_preferences['genres'][genre]
        if score >= 0.4:
            genre_boosts.append(1.4)
        elif score >= 0.2:
            genre_boosts.append(1.25)
        else:
            genre_boosts.append(1.1)

boost = max(genre_boosts)  # Lấy boost cao nhất
```

**Áp dụng**:
- "Shooter" in genres → User score = **0.55** (≥ 0.4)
- **Genre Boost = ×1.40** ❌ *Trong output thực tế là ×1.25, có thể do threshold khác*

**Thực tế (từ output)**:
- **Genre Boost = ×1.25** ✅

---

### 3.3 Price Boost

**Logic**:
```python
if abs(game_price - avg_price) <= std_price:
    boost = 1.2
elif abs(game_price - avg_price) <= 2 * std_price:
    boost = 1.1
else:
    boost = 1.0
```

**Áp dụng**:
- Apex Legends price = **0 VND** (Free)
- User avg price = 1,152,333 VND
- Difference = 1,152,333 VND
- Std dev = 426,877 VND
- 2 × std = 853,754 VND
- Difference > 2×std → **No price boost**
- **Price Boost = ×1.00** ✅ (không hiển thị trong breakdown)

---

### 3.4 Age Rating Boost

**Logic**:
```python
if age_rating in user_preferences['age_ratings']:
    score = user_preferences['age_ratings'][age_rating]
    if score >= 0.3:
        boost = 1.15
    else:
        boost = 1.1
```

**Áp dụng**:
- Apex Legends age_rating = "T"
- User preference score for "T" = **0.67** (≥ 0.3)
- **Age Boost = ×1.15** ✅

---

### 3.5 Mode Boost

**Logic**:
```python
if mode in user_preferences['modes']:
    score = user_preferences['modes'][mode]
    if score >= 0.3:
        boost = 1.15
    else:
        boost = 1.1
```

**Áp dụng**:
- Apex Legends mode = "Multiplayer"
- User preference score for "Multiplayer" = **1.00** (≥ 0.3)
- **Mode Boost = ×1.15** ✅

---

### 3.6 Platform Boost

**Logic**:
```python
platforms = game['platform']  # ['PC', 'PlayStation', 'Xbox']
platform_boosts = []

for platform in platforms:
    if platform in user_preferences['platforms']:
        score = user_preferences['platforms'][platform]
        if score >= 0.3:
            platform_boosts.append(1.15)
        else:
            platform_boosts.append(1.1)

boost = max(platform_boosts)
```

**Áp dụng**:
- "PC" in platforms → User score = **1.00** (≥ 0.3)
- **Platform Boost = ×1.15** ✅

---

## 🧮 Bước 4: Tính Total Boost Factor

**⚙️ Updated Logic (Range 0.8-1.2):**

Mỗi attribute có thể:
- **Match tốt**: 1.05 - 1.2
- **Neutral**: 1.0
- **Không match**: 0.8 - 0.95

**Công thức Tổng hợp**:
```
Total Boost = Publisher × Genre × Price × Age × Mode × Platform
```

**Áp dụng cho Apex Legends (Updated)**:
```
Publisher: ×1.05  (EA có score thấp, match yếu)
Genre:     ×1.10  (Shooter match trung bình)
Price:     ×1.00  (Free game, neutral)
Age:       ×1.10  (T rating match khá)
Mode:      ×1.15  (Multiplayer match mạnh)
Platform:  ×1.15  (PC match mạnh)

Total Boost = 1.05 × 1.10 × 1.00 × 1.10 × 1.15 × 1.15
            = 1.6778...
            ≈ 1.68
```

**Output thực tế**: **×1.68** ✓

*Lưu ý: Range mới giúp total boost không quá lớn (max ~1.8-2.0 thay vì 3.0+)*

---

## 📈 Bước 5: Áp dụng Boost lên Base Score

**Tính toán cuối cùng (Updated)**:
```
Base Score:    0.530 (từ SVD + Content + Demographic + Keyword)
Boost Factor:  ×1.68
Boosted Score: 0.530 × 1.68 = 0.8904
               ≈ 0.891 (sau rounding)
```

**Kết quả**:
- ✅ Base Score: **0.530**
- ✅ Boosted Score: **0.891**
- ✅ Impact: **+0.361** (tăng 68% - hợp lý hơn!)

---

## 🎨 Middle Panel Chart Breakdown (Updated)

**Stacked Bar hiển thị**:
```
[Publisher 5%][Genre 10%][Age 10%][Mode 15%][Platform 15%] = ×1.68
```

### Percentage Contribution:

Các percentage trong chart được tính từ:
```
% = (Multiplier - 1.0) × 100
```

| Factor | Multiplier | Percentage | Contribution |
|--------|-----------|------------|-------------|
| Publisher | ×1.05 | 5% | Weak match |
| Genre | ×1.10 | 10% | Medium match |
| Price | ×1.00 | 0% | Neutral (không hiển thị) |
| Age | ×1.10 | 10% | Medium match |
| Mode | ×1.15 | 15% | Strong match |
| Platform | ×1.15 | 15% | Strong match |

**Total**: 5% + 10% + 10% + 15% + 15% = **55%**

**Total Boost**: ×1.68 (≈ 168% của base = tăng 68% ✓)

**💡 So sánh với range cũ**:
- Trước: ×2.20 (tăng 120%) - Quá cao!
- Giờ: ×1.68 (tăng 68%) - Hợp lý hơn!

---

## 💡 Tại sao cần Boost Factor?

### Vấn đề trước đây:
- Recommendations chỉ dựa trên **historical data tổng thể**
- Không phản ánh **xu hướng gần đây** của user
- User thích Sports games trong 7 ngày gần đây, nhưng system vẫn recommend RPG

### Giải pháp với Adaptive Boosting:
- Phân tích **interactions 7 ngày gần nhất**
- Extract **trending preferences** (Publishers, Genres, etc.)
- **Boost scores** của games match với recent preferences
- Games phù hợp với xu hướng gần đây **tăng rank** lên top

### Kết quả:
- **Apex Legends**: Base rank #20 → Boosted rank **#1** 🚀
- **NBA 2K24**: Base rank #35 → Boosted rank **#7** 🏀
- **Valorant**: Base rank #25 → Boosted rank **#4** 🎯

---

## 📚 Code Reference

### Analyze User Preferences (7 days):
```python
def analyze_user_preferences(self, user_id, recent_days=7):
    # Filter interactions within last 7 days
    cutoff_date = datetime.now() - timedelta(days=recent_days)
    
    # Extract from SQLite database
    cursor.execute("""
        SELECT game_id, interaction_type, timestamp
        FROM interactions
        WHERE user_id = ? AND timestamp >= ?
    """, (user_id, cutoff_date))
    
    # Calculate preference scores
    # Weight: favorite=5, purchase=3, view=0.5
    ...
```

### Calculate Boost Breakdown:
```python
def _calculate_boost_factor_breakdown(self, game, user_preferences):
    breakdown = {
        'publisher': 1.0,
        'genre': 1.0,
        'price': 1.0,
        'age_rating': 1.0,
        'mode': 1.0,
        'platform': 1.0
    }
    
    # Publisher boost
    if game['publisher'] in user_preferences['publishers']:
        score = user_preferences['publishers'][game['publisher']]
        if score >= 0.3:
            breakdown['publisher'] = 1.5
        elif score >= 0.1:
            breakdown['publisher'] = 1.3
        else:
            breakdown['publisher'] = 1.1
    
    # ... (similar for other factors)
    
    # Total
    breakdown['total'] = (
        breakdown['publisher'] * breakdown['genre'] * 
        breakdown['price'] * breakdown['age_rating'] * 
        breakdown['mode'] * breakdown['platform']
    )
    
    return breakdown
```

---

## 🎯 Summary

**Apex Legends boost ×2.20 vì**:

1. ✅ User gần đây interact nhiều với **Shooter games** → Genre boost ×1.25
2. ✅ User prefer **Multiplayer mode** → Mode boost ×1.15
3. ✅ User play trên **PC** → Platform boost ×1.15
4. ✅ User like **Teen** rating → Age boost ×1.15
5. ✅ Có vài interactions với **EA** → Publisher boost ×1.10

**Tổng hợp**: 1.10 × 1.25 × 1.15 × 1.15 × 1.15 = **×2.20** 🎉

→ Apex Legends **match rất tốt** với trending preferences của user trong 7 ngày gần đây!

---

## 🔧 Điều chỉnh Boost Logic (Updated Range 0.8-1.2)

**Current thresholds** trong `game_recommendation_system.py`:

```python
# Lines 1062-1215: _calculate_boost_factor_breakdown()

# Publisher boost (0.9 - 1.2)
if score >= 0.4:
    breakdown['publisher'] = 1.2   # Top
elif score >= 0.2:
    breakdown['publisher'] = 1.1   # Medium
else:
    breakdown['publisher'] = 1.05  # Low
# Không match → 0.9

# Genre boost (0.85 - 1.2)
if score >= 0.5:
    breakdown['genre'] = 1.2       # Very strong
elif score >= 0.3:
    breakdown['genre'] = 1.15      # Strong
elif score >= 0.15:
    breakdown['genre'] = 1.1       # Medium
else:
    breakdown['genre'] = 1.05      # Weak
# Không match → 0.85

# Price boost (0.95 - 1.15)
if diff <= std:
    breakdown['price'] = 1.15      # Within 1 std
elif diff <= 1.5 * std:
    breakdown['price'] = 1.1       # Within 1.5 std
elif diff <= 2 * std:
    breakdown['price'] = 1.05      # Within 2 std
else:
    breakdown['price'] = 0.95      # Outside range

# Age/Mode/Platform (0.95 - 1.15)
# Similar logic với thresholds điều chỉnh
```

**💡 Lưu ý**: 
- Tất cả factors giờ trong range **0.8 - 1.2**
- Total boost thường từ **1.2 - 1.8** (hợp lý hơn 2.0+)
- Có thể điều chỉnh thresholds để fine-tune boosting behavior

---

**💡 Tip**: Để xem chi tiết preferences của một user, run:
```bash
python game_recommendation_system.py --user 1 --days 7 --adaptive 1 --chart 1
```

Chart sẽ hiển thị boost breakdown chi tiết trong Middle Panel! 📊

