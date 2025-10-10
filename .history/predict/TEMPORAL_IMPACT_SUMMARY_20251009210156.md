# 📊 Temporal Impact Chart - Feature Summary

## ✨ Feature Overview

**Temporal Impact Chart** là visualization tool thể hiện sự ảnh hưởng của **recent user interactions** (7 days) đến game recommendation scores.

---

## 🎯 Mục đích chính

Giúp hiểu rõ:
1. **Games nào được boost** bởi recent activities của user
2. **Games nào bị weakened** do user shift preferences
3. **Sự khác biệt** giữa all-time behavior vs recent behavior
4. **Trend changes** trong user preferences

---

## 📈 Chart Components

### Left Panel: Score Comparison
- **Blue bars**: All-time scores
- **Red bars**: 7-day scores
- Top 12 games có impact lớn nhất

### Middle Panel: Boost Factor Breakdown ⭐ NEW
- **Stacked bars** showing contribution breakdown:
  - 🔴 Publisher (×1.0-1.5)
  - 🔵 Genre (×1.0-1.4)
  - 🟢 Price (×1.0-1.2)
  - 🟠 Age, 🟣 Mode, 🔷 Platform (×1.0-1.15)
- **Percentage labels** for each factor
- **Total multiplier** (e.g., ×2.47) on the right

### Right Panel: Impact Analysis
- **Green bars (+)**: Games boosted by recent interactions
- **Red bars (-)**: Games weakened by preference shift
- **Arrows (↑↓)**: Strong impact indicator (>0.05)

---

## 🚀 Quick Start

### 1. Generate với full system
```bash
cd predict
python game_recommendation_system.py --user 1 --adaptive 1 --chart 1
```

### 2. Generate standalone
```bash
cd predict
python demo_temporal_impact.py
```

### 3. Output files
- `temporal_impact_chart.png` (từ full system)
- `temporal_impact_demo.png` (từ demo script)

---

## 📊 Example Insights

### User 1 (Gamer Pro) - 7 Days Analysis

**🟢 BOOSTED Games** (Trending up):
```
1. Apex Legends:     1.094 → 1.154 (+0.059)
   Boost Factors: Publisher ×1.10 | Genre ×1.25 | Age ×1.15 | Mode ×1.15 | Platform ×1.15
   Total Boost: ×2.09

2. NBA 2K24:         0.163 → 0.221 (+0.058)
   Boost Factors: Publisher ×1.30 | Genre ×1.25 | Age ×1.15 | Mode ×1.15 | Platform ×1.15
   Total Boost: ×2.47

3. Valorant:         0.602 → 0.635 (+0.033)
   Boost Factors: Genre ×1.25 | Age ×1.15 | Mode ×1.15 | Platform ×1.15
   Total Boost: ×1.90
```
→ User đang **shift to FPS & Sports** games từ **EA Sports, 2K Sports** publishers

**🔴 WEAKENED Games** (Trending down):
```
1. Red Dead Redemption 2: 1.087 → 0.957 (-0.130)
2. Fall Guys:             0.407 → 0.299 (-0.109)
3. The Witcher 3:         0.867 → 0.763 (-0.104)
```
→ User đang **move away from RPG** games

### Interpretation
User Gamer Pro trước đây thích **RPG/Adventure** (all-time history), nhưng 7 ngày gần đây chuyển sang **Shooter/Sports** games → Adaptive system sẽ boost FPS/Sports recommendations.

---

## ⚙️ Technical Implementation

### Files Modified
- `game_recommendation_system.py`:
  - Added `create_temporal_impact_chart()` method (lines 1913-2092)
  - Integrated into visualization pipeline (lines 2656-2662)
  - Added temporal_file output tracking

### Key Logic
```python
def create_temporal_impact_chart(self, user_id, keyword="", filename=None):
    # 1. Calculate all-time recommendations
    recs_alltime = self.get_hybrid_recommendations(
        user_id=user_id, recent_days=None
    )
    
    # 2. Calculate 7-day recommendations
    recs_7days = self.get_hybrid_recommendations(
        user_id=user_id, recent_days=7
    )
    
    # 3. Compare scores and calculate impact
    for game_id in all_games:
        impact = score_7days - score_alltime
    
    # 4. Visualize with matplotlib (2 subplots)
    # - Left: Score comparison bars
    # - Right: Impact bars with color coding
```

### Dependencies
- **SQLite database**: `user_interactions.db` with timestamps
- **Matplotlib**: For visualization
- **Adaptive boosting**: Enabled by default

---

## 📋 Requirements Checklist

- [x] SQLite database (`user_interactions.db`) exists
- [x] Database has `interactions` table with `timestamp` column
- [x] Timestamps in ISO 8601 format (e.g., `2024-10-02T15:30:00`)
- [x] Matplotlib installed (`pip install matplotlib`)
- [x] At least some interactions within last 7 days for meaningful results

---

## 🎨 Customization Options

| Aspect | Default | How to Change |
|--------|---------|---------------|
| **Timeframe** | 7 days | Modify `recent_days=7` in line 1943 |
| **Top N games** | 15 | Change `[:15]` in line 1982 |
| **Colors** | Blue/Red/Green | Modify hex codes in lines 1995-2018 |
| **Figure size** | 18x8 inches | Change `figsize=(18, 8)` in line 1985 |
| **Strong impact threshold** | 0.05 | Modify `if abs(impact) > 0.05` in line 2042 |

---

## 💡 Use Cases

### 1. Trend Detection
Identify when users shift interests (e.g., RPG → FPS)

### 2. Seasonal Patterns
Analyze behavior during events/holidays

### 3. A/B Testing
Measure impact of adaptive boosting

### 4. User Segmentation
- **Stable users**: All-time ≈ Recent (consistent preferences)
- **Exploratory users**: All-time ≠ Recent (dynamic preferences)

---

## 📊 Output Examples

### Console Summary
```
======================================================================
📊 TEMPORAL IMPACT SUMMARY
======================================================================

Top 5 Games BOOSTED by Recent Interactions (7 days):
  1. Apex Legends
     Score: 1.094 → 1.154 (+0.059)
  ...

Top 5 Games WEAKENED by Preference Shift:
  1. Red Dead Redemption 2
     Score: 1.087 → 0.957 (-0.130)
  ...
======================================================================
```

### Visual Chart
![Temporal Impact Chart](temporal_impact_chart.png)

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| No chart generated | Check SQLite database exists and has timestamps |
| All impacts = 0 | Ensure interactions exist within last 7 days |
| Chart text overlap | Increase `figsize` or reduce `top_n` games |
| "SQLite not found" error | Verify `user_interactions.db` is in `predict/` folder |

---

## 📚 Related Files

- `game_recommendation_system.py`: Main implementation
- `demo_temporal_impact.py`: Standalone demo script
- `TEMPORAL_IMPACT_GUIDE.md`: Detailed usage guide
- `ADAPTIVE_RECOMMENDATION_GUIDE.md`: Adaptive boosting logic
- `user_interactions.db`: SQLite database (required)

---

## ✅ Testing

Run test with:
```bash
cd predict

# Full system test
python game_recommendation_system.py --user 1 --adaptive 1 --chart 1

# Quick test
python demo_temporal_impact.py
```

Expected output:
- ✅ Chart file created (`temporal_impact_*.png`)
- ✅ Console summary with top boosted/weakened games
- ✅ No errors in terminal

---

## 🎓 Key Takeaways

1. **Temporal Impact Chart** = Visual comparison of **All-time vs Recent** preferences
2. **Green bars** = Games rising in user interest (boost these!)
3. **Red bars** = Games declining in user interest (deprioritize these)
4. **Adaptive system** uses this insight to dynamically adjust recommendations
5. **Requires SQLite** database with timestamp data

---

**🚀 Result**: Dynamic recommendation system that **adapts to changing user preferences over time**! 📊✨

