# 📊 Temporal Impact Chart - Hướng dẫn sử dụng

## Tổng quan

**Temporal Impact Chart** là công cụ visualization thể hiện **ảnh hưởng của interactions gần đây** đến game scores trong hệ thống recommendation. Chart này so sánh:
- **All-time scores**: Dựa trên toàn bộ lịch sử tương tác
- **7-day scores**: Dựa trên interactions trong 7 ngày gần nhất

---

## 📈 Cấu trúc Chart

Chart gồm **3 panels chính**:

### 1️⃣ Left Panel: Score Comparison
- **Blue bars**: Scores từ all-time interactions
- **Red bars**: Scores từ 7-day recent interactions
- Hiển thị top 12 games có **impact lớn nhất** (được sắp xếp theo absolute impact)
- Score values hiển thị bên cạnh mỗi bar

### 2️⃣ Middle Panel: Boost Factor Breakdown ⭐ NEW
- **Stacked horizontal bars** hiển thị contribution của từng preference factor:
  - 🔴 **Publisher**: Boost từ nhà phát hành (up to ×1.5)
  - 🔵 **Genre**: Boost từ thể loại (up to ×1.4)
  - 🟢 **Price**: Boost từ price range (up to ×1.2)
  - 🟠 **Age**: Boost từ age rating (up to ×1.15)
  - 🟣 **Mode**: Boost từ game mode (up to ×1.15)
  - 🔷 **Platform**: Boost từ platform (up to ×1.15)
- **Percentage labels**: Hiển thị % contribution của mỗi factor (nếu ≥5%)
- **Total multiplier**: Tổng boost factor (e.g., ×2.47) hiển thị bên phải bar

### 3️⃣ Right Panel: Impact Analysis
- **Green bars**: Games được **BOOSTED** (+) bởi recent interactions
- **Red bars**: Games bị **WEAKENED** (-) do preference shift
- **Arrows (↑↓)**: Chỉ ra impact mạnh (threshold > 0.05)
- Hiển thị net score change (Δ Score)

---

## 🎯 Ý nghĩa

### Games được BOOST (Green bars)
Những games này có **scores tăng** khi chỉ xét 7 ngày gần đây, cho thấy:
- User có **xu hướng mới** quan tâm đến các games tương tự
- Recent interactions tập trung vào publisher/genre/price range của games này
- Đây là **trending preferences** của user

**Ví dụ**:
```
Apex Legends: 1.094 → 1.154 (+0.059)
NBA 2K24: 0.163 → 0.221 (+0.058)
```
→ User đang quan tâm nhiều đến **shooter games** và **sports games** gần đây

### Games bị WEAKEN (Red bars)
Những games này có **scores giảm** khi chỉ xét 7 ngày gần đây, cho thấy:
- User đang **chuyển hướng** quan tâm sang thể loại khác
- All-time history có nhiều interactions với loại games này, nhưng gần đây không còn
- Preferences đã **thay đổi theo thời gian**

**Ví dụ**:
```
Red Dead Redemption 2: 1.087 → 0.957 (-0.130)
The Witcher 3: 0.867 → 0.763 (-0.104)
```
→ User trước đây thích **RPG/Adventure**, nhưng gần đây không còn quan tâm

---

## 🚀 Cách sử dụng

### Option 1: Qua Command Line (với --chart 1)
```bash
cd predict
python game_recommendation_system.py --user 1 --adaptive 1 --chart 1
```
→ Tạo **tất cả charts** bao gồm `temporal_impact_chart.png`

### Option 2: Qua Demo Script (độc lập)
```bash
cd predict
python demo_temporal_impact.py
```
→ Chỉ tạo **temporal impact chart** (`temporal_impact_demo.png`)

### Option 3: Programmatic (Python code)
```python
from game_recommendation_system import GameRecommendationSystem

# Initialize
recommender = GameRecommendationSystem()
recommender.load_data()
recommender.preprocess_data()
recommender.train_svd_model(k=2)
recommender.build_content_similarity()

# Generate chart
filename = recommender.create_temporal_impact_chart(
    user_id=1,
    keyword="",
    filename="my_temporal_chart.png"
)
```

---

## ⚙️ Yêu cầu kỹ thuật

### 1. SQLite Database Required
Chart này **YÊU CẦU** SQLite database (`user_interactions.db`) để lọc interactions theo timestamp:
```
predict/
├── user_interactions.db  ✓ Required
└── game_recommendation_system.py
```

Nếu không có database, system sẽ báo lỗi:
```
⚠️ Temporal impact chart skipped (SQLite database not found)
```

### 2. Timestamps trong Database
Database phải có bảng interactions với cột `timestamp`:
```sql
CREATE TABLE interactions (
    user_id INTEGER,
    game_id INTEGER,
    interaction_type TEXT,  -- 'view', 'favorite', 'purchase'
    timestamp TEXT,         -- ISO format: '2024-10-02T15:30:00'
    rating INTEGER
);
```

---

## 📊 Output Summary

Sau khi generate chart, system sẽ in ra **summary report**:

```
======================================================================
📊 TEMPORAL IMPACT SUMMARY
======================================================================

Top 5 Games BOOSTED by Recent Interactions (7 days):
  1. Apex Legends
     Score: 1.094 → 1.154 (+0.059)
  2. NBA 2K24
     Score: 0.163 → 0.221 (+0.058)
  ...

Top 5 Games WEAKENED by Preference Shift:
  1. Red Dead Redemption 2
     Score: 1.087 → 0.957 (-0.130)
  2. Fall Guys
     Score: 0.407 → 0.299 (-0.109)
  ...
======================================================================
```

---

## 🎨 Customization

### Thay đổi timeframe (hiện tại hard-coded 7 days)
Trong method `create_temporal_impact_chart()`:
```python
# Line 1928-1944
recs_alltime = self.get_hybrid_recommendations(
    user_id=user_id,
    recent_days=None  # All time
)

recs_7days = self.get_hybrid_recommendations(
    user_id=user_id,
    recent_days=7     # ← Change this (e.g., 14, 30)
)
```

### Thay đổi số lượng games hiển thị (hiện tại top 15)
```python
# Line 1982
sorted_games = sorted(..., reverse=True)[:15]  # ← Change this
```

### Thay đổi màu sắc
```python
# Line 1995-1996 (Left panel)
bars1 = ax1.barh(..., color='#3498db')  # Blue → your color
bars2 = ax1.barh(..., color='#e74c3c')  # Red → your color

# Line 2018 (Right panel)
colors = ['#27ae60' if imp > 0 else '#e74c3c']  # Green/Red
```

---

## 💡 Use Cases

### 1. Phát hiện Trend Changes
Xác định khi user **thay đổi sở thích**:
- All-time thích RPG, nhưng 7 days gần đây chuyển sang Sports
- Adjust recommendations theo **recent preferences**

### 2. Seasonal Analysis
So sánh preferences trong các mùa/events:
- Black Friday: User mua nhiều AAA games giảm giá
- Summer: Chuyển sang casual/indie games

### 3. A/B Testing
Test hiệu quả của adaptive boosting:
- **Without adaptive**: Scores không thay đổi nhiều
- **With adaptive**: Scores respond to recent interactions

### 4. User Behavior Insights
Hiểu user behavior patterns:
- **Consistent users**: All-time ≈ 7-day scores (ít thay đổi)
- **Exploratory users**: All-time ≠ 7-day scores (hay thử nghiệm)

---

## 🔍 Troubleshooting

### Chart bị cut off / overlap text
→ Adjust `figsize` trong code:
```python
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(18, 8))  # Tăng width
```

### Không thấy chart được tạo
→ Check console output:
```
Temporal impact chart saved to: temporal_impact_chart.png
```
→ File nằm trong `predict/` folder

### All games có impact = 0
→ Kiểm tra:
1. Database có đủ interactions trong 7 days không?
2. Timestamps có đúng format không? (ISO 8601)
3. User có interactions gần đây không?

---

## 📚 Related Documentation
- `ADAPTIVE_RECOMMENDATION_GUIDE.md`: Adaptive boosting logic
- `TIMESTAMPS_GUIDE.md`: Timestamp data structure
- `SUMMARY.md`: Overall system overview

---

**✨ Happy analyzing!** Temporal Impact Chart giúp bạn hiểu rõ **dynamic preferences** của users! 📊

