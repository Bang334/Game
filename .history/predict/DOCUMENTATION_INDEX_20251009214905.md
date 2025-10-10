# 📚 Documentation Index - Adaptive Recommendation System

## Mục lục tài liệu đầy đủ

---

## 🎯 Quick Start

### Muốn hiểu hệ thống trong 5 phút?
1. **`RECOMMENDATION_FLOW.md`** - Flow từ base score → boost → display
2. **`TEST_SCENARIOS_SUMMARY.md`** - Xem ví dụ thực tế

### Muốn test ngay?
```bash
cd predict
python demo_temporal_impact.py        # Generate chart
python test_boost_scenarios.py        # Test 5 scenarios
```

---

## 📖 Core Documentation

### 1. **BOOST_CALCULATION_RULES.md** ⭐ MỚI NHẤT
**Nội dung**: Giải thích CHI TIẾT công thức tính boost cho từng field
- Publisher (0.6 - 1.2)
- Genre (0.6 - 1.2)
- Price (0.6 - 1.2)
- Age Rating (0.6 - 1.2)
- Mode (0.6 - 1.2)
- Platform (0.6 - 1.2)

**Bao gồm**:
- ✅ Công thức tính toán
- ✅ Bảng tra cứu boost factors
- ✅ Ví dụ chi tiết (FIFA 23, Elden Ring)
- ✅ Price deviation logic
- ✅ Genre average logic

**Khi nào đọc**: Muốn hiểu CHÍNH XÁC cách mỗi field được tính điểm

**File size**: 11.9 KB

---

### 2. **BOOST_RANGE_0.6_1.2_SUMMARY.md** ⭐ MỚI NHẤT
**Nội dung**: So sánh OLD (0.8-1.2) vs NEW (0.6-1.2) range
- Before/After examples
- Thống kê từ test scenarios
- Price & Genre logic improvements
- Lợi ích của new range

**Highlights**:
- ✅ Penalty RÕ RÀNG hơn (×0.6-0.7 thay vì ×0.85-0.95)
- ✅ Ranking changes mạnh mẽ hơn
- ✅ Charts trực quan hơn
- ✅ Price: % deviation thay vì std
- ✅ Genre: average thay vì max

**Khi nào đọc**: Muốn hiểu tại sao thay đổi range và impact của nó

**File size**: 9.7 KB

---

### 3. **BOOST_FACTOR_EXPLANATION.md**
**Nội dung**: Step-by-step explanation với ví dụ Apex Legends
- Analyze 7-day interaction history
- Calculate preference scores
- Individual factor boosts
- Total boost calculation
- How it translates to chart

**Khi nào đọc**: Muốn xem 1 ví dụ cụ thể từ đầu đến cuối

**File size**: 14.0 KB

---

### 4. **RECOMMENDATION_FLOW.md**
**Nội dung**: End-to-end flow của recommendation system
- Step 1: Load data & train models
- Step 2: Calculate base scores (SVD + Content + Demo + Keyword)
- Step 3: Normalize & combine
- Step 4: Adaptive boosting (7-day preferences)
- Step 5: Display to user

**Diagram**:
```
User → Models → Base Score → Boost → Sort → Display
```

**Khi nào đọc**: Muốn hiểu BIG PICTURE của toàn bộ hệ thống

**File size**: 11.4 KB

---

## 📊 Visualization & Testing

### 5. **TEMPORAL_IMPACT_GUIDE.md**
**Nội dung**: Hướng dẫn đọc temporal impact chart (3 panels)
- Left: Score comparison (base vs boosted)
- Middle: Boost factor breakdown
- Right: Impact (Δ score)

**Features**:
- ✅ 20 games displayed
- ✅ Color-coded factors
- ✅ Green/red bars for impact
- ✅ Boost multipliers shown

**Khi nào đọc**: Đang xem `temporal_impact_demo.png` và muốn hiểu chart

**File size**: 8.3 KB

---

### 6. **TEMPORAL_IMPACT_SUMMARY.md**
**Nội dung**: Summary về temporal impact chart development
- Chart structure
- Example outputs
- How to generate

**Khi nào đọc**: Muốn overview nhanh về temporal impact feature

**File size**: 7.8 KB

---

### 7. **TEST_SCENARIOS_SUMMARY.md**
**Nội dung**: Kết quả từ `test_boost_scenarios.py`
- Scenario 1: Sports Lover
- Scenario 2: RPG Lover
- Scenario 3: Budget Gamer
- Scenario 4: Same game, different users
- Scenario 5: Ranking impact

**Key Insights**:
- ✅ Boost ranges
- ✅ Penalty examples
- ✅ Ranking changes
- ✅ Multiple factors compound

**Khi nào đọc**: Muốn xem nhiều examples thực tế

**File size**: 5.6 KB

---

## 📝 Legacy Documentation

### 8. **BOOST_RANGE_UPDATE_SUMMARY.md**
**Nội dung**: Summary về old boost range update (0.8-1.2)
- Rationale
- Comparison old vs new
- Balanced total boost

**Note**: Đã được supersede bởi `BOOST_RANGE_0.6_1.2_SUMMARY.md`

**File size**: 4.1 KB

---

## 🧪 Test Scripts

### `test_boost_scenarios.py`
**Chức năng**: Test 5 scenarios với different preferences

**Output**:
```
Scenario 1: Sports Lover → FIFA ×2.74, Elden Ring ×0.30
Scenario 2: RPG Lover → Elden Ring ×2.49, FIFA ×0.41
Scenario 3: Budget Gamer → Valorant ×1.82, Elden Ring ×0.17
Scenario 4: Apex Legends → ×0.34 to ×1.99 (depends on user)
Scenario 5: Ranking impact → Valorant #4→#2
```

**Cách chạy**:
```bash
python test_boost_scenarios.py
```

---

### `demo_temporal_impact.py`
**Chức năng**: Generate temporal impact chart

**Output**:
- `temporal_impact_demo.png` (3-panel chart)
- Console summary (top boosted games, penalty games)

**Cách chạy**:
```bash
python demo_temporal_impact.py
```

---

## 🗂️ File Organization

```
predict/
├── game_recommendation_system.py    # Core system
├── demo_temporal_impact.py          # Demo script
├── test_boost_scenarios.py          # Test scenarios
│
├── Documentation (Core)
│   ├── BOOST_CALCULATION_RULES.md   ⭐ Chi tiết công thức
│   ├── BOOST_RANGE_0.6_1.2_SUMMARY.md ⭐ So sánh ranges
│   ├── BOOST_FACTOR_EXPLANATION.md   # Ví dụ Apex Legends
│   └── RECOMMENDATION_FLOW.md        # Big picture flow
│
├── Documentation (Visualization)
│   ├── TEMPORAL_IMPACT_GUIDE.md      # Chart guide
│   └── TEMPORAL_IMPACT_SUMMARY.md    # Chart summary
│
├── Documentation (Testing)
│   └── TEST_SCENARIOS_SUMMARY.md     # Test results
│
└── Documentation (Legacy)
    └── BOOST_RANGE_UPDATE_SUMMARY.md # Old range update
```

---

## 🎓 Learning Path

### Beginner (Chưa biết gì về hệ thống)
1. **RECOMMENDATION_FLOW.md** - Hiểu big picture
2. **TEST_SCENARIOS_SUMMARY.md** - Xem examples
3. Chạy `test_boost_scenarios.py` - Thấy results thực tế

### Intermediate (Muốn hiểu sâu hơn)
1. **BOOST_CALCULATION_RULES.md** - Học công thức từng field
2. **BOOST_RANGE_0.6_1.2_SUMMARY.md** - Hiểu tại sao range này
3. Chạy `demo_temporal_impact.py` - Xem chart

### Advanced (Developer/Debugging)
1. **BOOST_FACTOR_EXPLANATION.md** - Step-by-step breakdown
2. **TEMPORAL_IMPACT_GUIDE.md** - Chart structure
3. Đọc code trong `game_recommendation_system.py`

---

## 🔍 Quick Reference

### Boost Factor Ranges:
| Factor | Min | Max | No Match Penalty |
|--------|-----|-----|------------------|
| Publisher | 0.7 | 1.2 | ×0.7 |
| Genre | 0.6 | 1.2 | ×0.6-0.75 |
| Price | 0.6 | 1.2 | ×0.6-0.9 |
| Age | 0.7 | 1.2 | ×0.7 |
| Mode | 0.7 | 1.2 | ×0.7 |
| Platform | 0.7 | 1.2 | ×0.7 |

**Total Range**: 0.03 - 2.99

---

## 📞 FAQ

### Q: Tại sao range là 0.6-1.2 thay vì 0.8-1.2?
**A**: Xem `BOOST_RANGE_0.6_1.2_SUMMARY.md` section "Lợi ích của New Range"

### Q: Làm sao tính boost cho Price?
**A**: Xem `BOOST_CALCULATION_RULES.md` section "3️⃣ Price"

### Q: Genre được tính như thế nào khi game có nhiều genres?
**A**: Xem `BOOST_CALCULATION_RULES.md` section "2️⃣ Genre" - dùng **average** thay vì max

### Q: Chart ở giữa (Middle Panel) là gì?
**A**: Xem `TEMPORAL_IMPACT_GUIDE.md` - đó là boost factor breakdown

### Q: Làm sao test với data giả?
**A**: Chạy `python test_boost_scenarios.py`

---

## 📈 Performance Stats

Từ test results (Gamer Pro, 7 days):
- Total games: 57
- Boosted games: 22 (39%)
- Penalty games: 35 (61%)
- Top boost: FIFA 24 ×1.67
- Biggest penalty: Counter-Strike 2 ×0.59

---

## 🔗 Related Systems

- **SVD Model**: Collaborative filtering
- **Content-based**: Game features similarity
- **Demographic**: User profile matching
- **Keyword**: Search relevance
- **SQLite**: Interaction history storage

---

## ✅ Checklist - Đã đọc chưa?

- [ ] RECOMMENDATION_FLOW.md - Big picture
- [ ] BOOST_CALCULATION_RULES.md - Công thức chi tiết
- [ ] BOOST_RANGE_0.6_1.2_SUMMARY.md - So sánh ranges
- [ ] TEST_SCENARIOS_SUMMARY.md - Examples
- [ ] Chạy test_boost_scenarios.py
- [ ] Chạy demo_temporal_impact.py
- [ ] TEMPORAL_IMPACT_GUIDE.md - Chart guide

---

**Last updated**: 2025-10-09
**Total documentation**: 8 files (11 including this index)
**Total size**: ~77 KB
**Current boost range**: 0.6 - 1.2

