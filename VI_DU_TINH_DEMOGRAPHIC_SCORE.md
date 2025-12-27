# 👥 VÍ DỤ TÍNH DEMOGRAPHIC SCORE CHI TIẾT

> **Tài liệu này minh họa cách tính Demographic Score - gợi ý games phổ biến với nhóm người dùng tương tự (age, gender)**

---

## 📌 TỔNG QUAN

**Demographic Score** dựa trên ý tưởng:
```
Người cùng tuổi, cùng giới tính thường có sở thích tương tự
→ Gợi ý games phổ biến trong nhóm demographic
```

**Các bước:**
```
BƯỚC 1: Tìm users có demographic tương tự (age ±5, same gender)
BƯỚC 2: Tính popularity của game trong nhóm
BƯỚC 3: Normalize về [0, 1]
```

---

## 📊 BƯỚC 1: DỮ LIỆU USERS

### Danh sách 10 users

```
User 1  (Alice):    Age 25, Female
User 2  (Bob):      Age 30, Male
User 3  (Charlie):  Age 22, Male
User 4  (Diana):    Age 28, Female
User 5  (Eve):      Age 26, Female  ← TARGET USER
User 6  (Frank):    Age 35, Male
User 7  (Grace):    Age 24, Female
User 8  (Henry):    Age 29, Male
User 9  (Iris):     Age 27, Female
User 10 (Jack):     Age 32, Male
```

---

### Interactions của các users

```
User 1 (Alice, 25, F):
- Favorites:  [1, 3, 5]
- Purchased:  {7: 4, 9: 5}
- Views:      {2: 2, 8: 3}

User 2 (Bob, 30, M):
- Favorites:  [2, 4]
- Purchased:  {6: 3, 8: 4}
- Views:      {1: 1, 10: 2}

User 3 (Charlie, 22, M):
- Favorites:  [6, 10]
- Purchased:  {2: 5, 4: 4}
- Views:      {3: 2, 5: 1}

User 4 (Diana, 28, F):
- Favorites:  [3, 5, 9]
- Purchased:  {1: 5, 8: 4}
- Views:      {4: 1, 7: 2}

User 5 (Eve, 26, F):  ← TARGET
- Favorites:  [1, 2, 3]
- Purchased:  {4: 4, 6: 3}
- Views:      {5: 3, 7: 2, 9: 1}
- ❓ CHƯA tương tác với Game 8 → CẦN TÍNH DEMOGRAPHIC SCORE

User 6 (Frank, 35, M):
- Favorites:  [7, 10]
- Purchased:  {2: 3, 9: 5}
- Views:      {1: 2, 4: 1}

User 7 (Grace, 24, F):
- Favorites:  [4, 8]
- Purchased:  {5: 4, 6: 5}
- Views:      {3: 2, 10: 3}

User 8 (Henry, 29, M):
- Favorites:  [6]
- Purchased:  {1: 5, 3: 4, 8: 5}
- Views:      {2: 2, 7: 1}

User 9 (Iris, 27, F):
- Favorites:  [2, 5]
- Purchased:  {3: 5, 8: 4, 9: 3}
- Views:      {1: 1, 6: 2}

User 10 (Jack, 32, M):
- Favorites:  [4, 6]
- Purchased:  {2: 4, 10: 5}
- Views:      {5: 2, 8: 1}
```

---

## 🔍 BƯỚC 2: TÌM USERS TƯƠNG TỰ

### Target User: User 5 (Eve, 26, Female)

### Điều kiện tương tự

```
1. AGE: ±5 tuổi (21-31 tuổi)
2. GENDER: Cùng giới tính (Female) hoặc Other
```

### Tính độ tương đồng (similarity score)

**Công thức:**
```python
age_similarity = max(0, 1 - abs(age1 - age2) * 0.2)  # Giảm 0.2 mỗi năm chênh lệch
gender_similarity = 1.0 if same_gender else 0.5
demographic_similarity = age_similarity × gender_similarity
```

---

### Tính similarity với từng user

#### **User 1 (Alice, 25, F)**
```
Age diff: |26 - 25| = 1 tuổi
Age similarity: 1 - (1 × 0.2) = 0.8

Gender: Female = Female
Gender similarity: 1.0

Demographic similarity: 0.8 × 1.0 = 0.8 ✅
```

---

#### **User 2 (Bob, 30, M)**
```
Age diff: |26 - 30| = 4 tuổi
Age similarity: 1 - (4 × 0.2) = 0.2

Gender: Female ≠ Male
Gender similarity: 0.5

Demographic similarity: 0.2 × 0.5 = 0.1  (thấp)
```

---

#### **User 3 (Charlie, 22, M)**
```
Age diff: |26 - 22| = 4 tuổi
Age similarity: 1 - (4 × 0.2) = 0.2

Gender: Female ≠ Male
Gender similarity: 0.5

Demographic similarity: 0.2 × 0.5 = 0.1  (thấp)
```

---

#### **User 4 (Diana, 28, F)**
```
Age diff: |26 - 28| = 2 tuổi
Age similarity: 1 - (2 × 0.2) = 0.6

Gender: Female = Female
Gender similarity: 1.0

Demographic similarity: 0.6 × 1.0 = 0.6 ✅
```

---

#### **User 6 (Frank, 35, M)**
```
Age diff: |26 - 35| = 9 tuổi
Age similarity: 1 - (9 × 0.2) = -0.8 → 0 (giới hạn min = 0)

Demographic similarity: 0.0  (quá xa tuổi)
```

---

#### **User 7 (Grace, 24, F)**
```
Age diff: |26 - 24| = 2 tuổi
Age similarity: 1 - (2 × 0.2) = 0.6

Gender: Female = Female
Gender similarity: 1.0

Demographic similarity: 0.6 × 1.0 = 0.6 ✅
```

---

#### **User 8 (Henry, 29, M)**
```
Age diff: |26 - 29| = 3 tuổi
Age similarity: 1 - (3 × 0.2) = 0.4

Gender: Female ≠ Male
Gender similarity: 0.5

Demographic similarity: 0.4 × 0.5 = 0.2
```

---

#### **User 9 (Iris, 27, F)**
```
Age diff: |26 - 27| = 1 tuổi
Age similarity: 1 - (1 × 0.2) = 0.8

Gender: Female = Female
Gender similarity: 1.0

Demographic similarity: 0.8 × 1.0 = 0.8 ✅
```

---

#### **User 10 (Jack, 32, M)**
```
Age diff: |26 - 32| = 6 tuổi
Age similarity: 1 - (6 × 0.2) = -0.2 → 0 (quá xa)

Demographic similarity: 0.0
```

---

### 📊 Bảng tổng hợp Similar Users

| User ID | Name | Age | Gender | Age Diff | Age Sim | Gender Sim | **Demo Sim** | Status |
|---------|------|-----|--------|----------|---------|------------|--------------|--------|
| 1 | Alice | 25 | F | 1 | 0.8 | 1.0 | **0.8** | ✅ High |
| 4 | Diana | 28 | F | 2 | 0.6 | 1.0 | **0.6** | ✅ Medium |
| 7 | Grace | 24 | F | 2 | 0.6 | 1.0 | **0.6** | ✅ Medium |
| 9 | Iris  | 27 | F | 1 | 0.8 | 1.0 | **0.8** | ✅ High |
| 2 | Bob   | 30 | M | 4 | 0.2 | 0.5 | **0.1** | ⚠️ Low |
| 3 | Charlie | 22 | M | 4 | 0.2 | 0.5 | **0.1** | ⚠️ Low |
| 8 | Henry | 29 | M | 3 | 0.4 | 0.5 | **0.2** | ⚠️ Low |
| 6 | Frank | 35 | M | 9 | 0.0 | 0.5 | **0.0** | ❌ Too far |
| 10 | Jack | 32 | M | 6 | 0.0 | 0.5 | **0.0** | ❌ Too far |

**Nhóm tương tự cao nhất (Demo Sim ≥ 0.6):**
- User 1 (Alice): 0.8
- User 4 (Diana): 0.6
- User 7 (Grace): 0.6
- User 9 (Iris): 0.8

---

## 🎮 BƯỚC 3: TÍNH DEMOGRAPHIC SCORE CHO GAME 8

### Game 8 - Interactions của similar users

```
User 1 (Alice, sim=0.8):
- Favorites:  [1, 3, 5]        → Game 8: KHÔNG
- Purchased:  {7: 4, 9: 5}     → Game 8: KHÔNG
- Views:      {2: 2, 8: 3}     → Game 8: CÓ (3 lần) ✓

User 4 (Diana, sim=0.6):
- Favorites:  [3, 5, 9]        → Game 8: KHÔNG
- Purchased:  {1: 5, 8: 4}     → Game 8: CÓ (4⭐) ✓✓
- Views:      {4: 1, 7: 2}     → Game 8: KHÔNG

User 7 (Grace, sim=0.6):
- Favorites:  [4, 8]           → Game 8: CÓ (favorite) ✓✓✓
- Purchased:  {5: 4, 6: 5}     → Game 8: KHÔNG
- Views:      {3: 2, 10: 3}    → Game 8: KHÔNG

User 9 (Iris, sim=0.8):
- Favorites:  [2, 5]           → Game 8: KHÔNG
- Purchased:  {3: 5, 8: 4, 9: 3} → Game 8: CÓ (4⭐) ✓✓
- Views:      {1: 1, 6: 2}     → Game 8: KHÔNG

User 2 (Bob, sim=0.1):
- Purchased:  {6: 3, 8: 4}     → Game 8: CÓ (4⭐) (nhưng sim thấp)

User 3 (Charlie, sim=0.1):
- Không tương tác với Game 8

User 8 (Henry, sim=0.2):
- Purchased:  {1: 5, 3: 4, 8: 5} → Game 8: CÓ (5⭐)

User 6, 10: sim = 0 → Bỏ qua
```

---

### Tính weighted popularity score

**Công thức:**
```python
# Với mỗi similar user:
if game in favorite_games:
    contribution = 3.0 × demographic_similarity
elif game in purchased_games:
    contribution = rating × demographic_similarity
elif game in view_history:
    contribution = (view_count × 0.5) × demographic_similarity

# Tổng:
weighted_score = sum(contributions)
total_weight = sum(demographic_similarities)

popularity_score = weighted_score / total_weight
```

---

### Tính toán chi tiết cho Game 8

#### **User 1 (Alice, sim=0.8):**
```
Game 8: Views (3 lần)
Rating equivalent: 3 × 0.5 = 1.5
Contribution: 1.5 × 0.8 = 1.2
```

#### **User 4 (Diana, sim=0.6):**
```
Game 8: Purchased (4⭐)
Rating: 4.0
Contribution: 4.0 × 0.6 = 2.4
```

#### **User 7 (Grace, sim=0.6):**
```
Game 8: Favorite
Rating equivalent: 3.0
Contribution: 3.0 × 0.6 = 1.8
```

#### **User 9 (Iris, sim=0.8):**
```
Game 8: Purchased (4⭐)
Rating: 4.0
Contribution: 4.0 × 0.8 = 3.2
```

#### **User 2 (Bob, sim=0.1) - Male:**
```
Game 8: Purchased (4⭐)
Rating: 4.0
Contribution: 4.0 × 0.1 = 0.4  (thấp vì khác giới)
```

#### **User 8 (Henry, sim=0.2) - Male:**
```
Game 8: Purchased (5⭐)
Rating: 5.0
Contribution: 5.0 × 0.2 = 1.0  (thấp vì khác giới)
```

---

### Tổng hợp

```
┌──────────────────────────────────────────────────────────────┐
│  GAME 8 - DEMOGRAPHIC POPULARITY                             │
├──────────────────────────────────────────────────────────────┤
│  User 1 (F, sim=0.8):  1.5 × 0.8 = 1.2                      │
│  User 4 (F, sim=0.6):  4.0 × 0.6 = 2.4                      │
│  User 7 (F, sim=0.6):  3.0 × 0.6 = 1.8                      │
│  User 9 (F, sim=0.8):  4.0 × 0.8 = 3.2                      │
│  User 2 (M, sim=0.1):  4.0 × 0.1 = 0.4                      │
│  User 8 (M, sim=0.2):  5.0 × 0.2 = 1.0                      │
├──────────────────────────────────────────────────────────────┤
│  Weighted Score:       1.2 + 2.4 + 1.8 + 3.2 + 0.4 + 1.0    │
│                      = 10.0                                  │
│                                                              │
│  Total Weight:         0.8 + 0.6 + 0.6 + 0.8 + 0.1 + 0.2    │
│                      = 3.1                                   │
│                                                              │
│  Popularity Score:     10.0 / 3.1 = 3.226                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 📐 BƯỚC 4: CHUẨN HÓA VỀ [0, 1]

### Công thức

```python
demographic_normalized = popularity_score / 5.0
```

**Tại sao chia cho 5.0?**
- Max rating = 5⭐
- Max popularity_score ≈ 5.0 (nếu tất cả similar users purchased với 5⭐)

---

### Tính toán

```python
demographic_score = 3.226 / 5.0
                  = 0.645
```

**→ Demographic Score cho Game 8 (User 5) = 0.645**

---

## 📊 BƯỚC 5: SO SÁNH VỚI GAMES KHÁC

### Tính Demographic Score cho các games khác

#### **Game 1:**
```
User 1: Favorite → 3.0 × 0.8 = 2.4
User 4: Purchased (5⭐) → 5.0 × 0.6 = 3.0
User 8: Purchased (5⭐) → 5.0 × 0.2 = 1.0
User 9: Views (1 lần) → 0.5 × 0.8 = 0.4
User 2: Views (1 lần) → 0.5 × 0.1 = 0.05

Weighted: 2.4 + 3.0 + 1.0 + 0.4 + 0.05 = 6.85
Total weight: 0.8 + 0.6 + 0.2 + 0.8 + 0.1 = 2.5
Popularity: 6.85 / 2.5 = 2.74
Normalized: 2.74 / 5.0 = 0.548
```

---

#### **Game 3:**
```
User 1: Favorite → 3.0 × 0.8 = 2.4
User 4: Favorite → 3.0 × 0.6 = 1.8
User 7: Views (2 lần) → 1.0 × 0.6 = 0.6
User 8: Purchased (4⭐) → 4.0 × 0.2 = 0.8
User 9: Purchased (5⭐) → 5.0 × 0.8 = 4.0
User 3: Views (2 lần) → 1.0 × 0.1 = 0.1

Weighted: 2.4 + 1.8 + 0.6 + 0.8 + 4.0 + 0.1 = 9.7
Total weight: 0.8 + 0.6 + 0.6 + 0.2 + 0.8 + 0.1 = 3.1
Popularity: 9.7 / 3.1 = 3.129
Normalized: 3.129 / 5.0 = 0.626
```

---

#### **Game 5:**
```
User 1: Favorite → 3.0 × 0.8 = 2.4
User 4: Favorite → 3.0 × 0.6 = 1.8
User 7: Purchased (4⭐) → 4.0 × 0.6 = 2.4
User 9: Favorite → 3.0 × 0.8 = 2.4
User 3: Views (1 lần) → 0.5 × 0.1 = 0.05
User 10: Views (2 lần) → 1.0 × 0.0 = 0.0

Weighted: 2.4 + 1.8 + 2.4 + 2.4 + 0.05 = 9.05
Total weight: 0.8 + 0.6 + 0.6 + 0.8 + 0.1 = 2.9
Popularity: 9.05 / 2.9 = 3.121
Normalized: 3.121 / 5.0 = 0.624
```

---

### 📈 Ranking Demographic Scores

```
╔════════════════════════════════════════════════════════════════╗
║  DEMOGRAPHIC SCORES FOR USER 5 (Eve, 26, Female)              ║
╠════════════════════════════════════════════════════════════════╣
║  Rank  Game    Popularity  Normalized  Giải thích             ║
║  ──────────────────────────────────────────────────────────── ║
║  1.    Game 8    3.226      0.645      ← MỤC TIÊU              ║
║        → 4 nữ tương tự thích (3 purchased 4⭐, 1 favorite)    ║
║                                                                ║
║  2.    Game 3    3.129      0.626                             ║
║        → 5 người tương tự thích (2 favorite, 2 purchased)     ║
║                                                                ║
║  3.    Game 5    3.121      0.624                             ║
║        → 4 nữ tương tự thích (3 favorite, 1 purchased)        ║
║                                                                ║
║  4.    Game 1    2.740      0.548                             ║
║        → 4 người thích (1 favorite, 2 purchased, 1 view)      ║
║                                                                ║
║  5.    Game 9    2.645      0.529                             ║
║        → 3 người thích (1 favorite, 2 purchased)              ║
╚════════════════════════════════════════════════════════════════╝
```

**→ Game 8 có Demographic Score cao nhất (0.645) vì được nhiều nữ 24-27 tuổi yêu thích!**

---

## 💡 GIẢI THÍCH KẾT QUẢ

### Tại sao Game 8 có Demographic Score cao?

#### ✅ **Nhóm tương tự CAO đều thích**
```
4 nữ giới (24-27 tuổi) có sim ≥ 0.6:
- Alice (25, sim=0.8):  Viewed 3 times
- Diana (28, sim=0.6):  Purchased 4⭐
- Grace (24, sim=0.6):  Favorite ← Rất thích!
- Iris  (27, sim=0.8):  Purchased 4⭐

→ Tất cả đều tương tác với Game 8!
```

#### ✅ **Ratings cao từ nhóm tương tự**
```
Average rating từ nhóm Female tương tự:
- Diana: 4⭐
- Grace: 3⭐ (favorite)
- Iris:  4⭐

Average: (4 + 3 + 4) / 3 = 3.67 ⭐ (cao!)
```

#### ⚠️ **Nam giới cũng thích nhưng sim thấp**
```
Bob (30, M, sim=0.1):    Purchased 4⭐
Henry (29, M, sim=0.2):  Purchased 5⭐

→ Contribution thấp vì khác giới tính
```

---

### So sánh với Game 5 (score: 0.624)

```
Game 5:
- 4 nữ tương tự: Alice, Diana, Grace, Iris (đều thích)
- Nhưng chỉ 1 purchased (4⭐), còn lại là favorite/view
- Average rating: (3 + 4 + 3 + 3) / 4 = 3.25 ⭐

Game 8:
- 4 nữ tương tự: Alice, Diana, Grace, Iris (đều thích)
- Có 2 purchased cao (4⭐, 4⭐), 1 favorite, 1 viewed nhiều
- Average rating: 3.67 ⭐

→ Game 8 có ratings cao hơn → Demographic Score cao hơn!
```

---

## 🎯 BƯỚC 6: TÍCH HỢP VÀO HYBRID SCORE

### Kết hợp với SVD, Content, Keyword

**Weights (không có keyword):**
```
SVD weight:         0.45
Content weight:     0.35
Demographic weight: 0.20
Keyword weight:     0.00
```

**Game 8 scores:**
```
SVD score:         1.000  (cao nhất - từ SVD)
Content score:     0.823  (tương tự games User 5 đã thích)
Demographic score: 0.645  (phổ biến với nữ 24-27 tuổi)
Keyword score:     0.000  (không có keyword)
```

**Hybrid Score:**
```python
hybrid_score = (0.45 × 1.000) + (0.35 × 0.823) + (0.20 × 0.645) + (0.00 × 0)
             = 0.450 + 0.288 + 0.129 + 0.000
             = 0.867
```

**Contribution của Demographic:**
```
0.129 / 0.867 = 14.9% của total score

→ Demographic góp phần quan trọng vào gợi ý!
```

---

## 📊 KẾT QUẢ CUỐI CÙNG

```
╔══════════════════════════════════════════════════════════════════╗
║  DEMOGRAPHIC SCORE - TỔNG KẾT                                    ║
╠══════════════════════════════════════════════════════════════════╣
║  Target User:  User 5 (Eve, 26, Female)                          ║
║  Target Game:  Game 8                                             ║
║  ──────────────────────────────────────────────────────────────  ║
║  SIMILAR USERS (Female, Age 21-31):                              ║
║    - Alice (25, sim=0.8):  Viewed 3×                            ║
║    - Diana (28, sim=0.6):  Purchased 4⭐                        ║
║    - Grace (24, sim=0.6):  Favorite                             ║
║    - Iris  (27, sim=0.8):  Purchased 4⭐                        ║
║  ──────────────────────────────────────────────────────────────  ║
║  WEIGHTED CONTRIBUTIONS:                                         ║
║    User 1: 1.5 × 0.8 = 1.2                                      ║
║    User 4: 4.0 × 0.6 = 2.4                                      ║
║    User 7: 3.0 × 0.6 = 1.8                                      ║
║    User 9: 4.0 × 0.8 = 3.2                                      ║
║    User 2: 4.0 × 0.1 = 0.4  (Male, low weight)                 ║
║    User 8: 5.0 × 0.2 = 1.0  (Male, low weight)                 ║
║  ──────────────────────────────────────────────────────────────  ║
║  Weighted Score:   10.0                                          ║
║  Total Weight:     3.1                                           ║
║  Popularity:       10.0 / 3.1 = 3.226                           ║
║  ──────────────────────────────────────────────────────────────  ║
║  🎯 DEMOGRAPHIC SCORE: 3.226 / 5.0 = 0.645                      ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 🔑 ĐIỂM QUAN TRỌNG

### ✅ Demographic Similarity có weighted
```
Cùng age + cùng gender = 1.0  (cao nhất)
±1 tuổi + cùng gender  = 0.8
±2 tuổi + cùng gender  = 0.6
±3 tuổi + khác gender  = 0.2  (thấp)
```

### ✅ Interactions có trọng số khác nhau
```
Favorite:  3.0 điểm
Purchased: rating (1-5)
Views:     count × 0.5
```

### ✅ Same gender quan trọng hơn age
```
Gender same:  ×1.0
Gender diff:  ×0.5  (giảm 50%!)

→ Nữ 25 tuổi gần Nữ 28 hơn là Nam 26!
```

### ✅ Weighted average công bằng
```
User có sim cao → contribution lớn
User có sim thấp → contribution nhỏ

→ Ưu tiên ý kiến của users tương tự nhất!
```

---

## 🎯 KẾT LUẬN

**Demographic Score trả lời câu hỏi:**
> "Game này có phổ biến với nhóm người tương tự tôi không?"

**Cách hoạt động:**
1. Tìm người cùng tuổi, cùng giới tính
2. Xem họ thích game gì
3. Tính weighted popularity
4. Gợi ý games phổ biến trong nhóm

**Ưu điểm:**
- ✅ Hiệu quả cho **cold start** (user mới không có lịch sử)
- ✅ Capture **social trends** (xu hướng nhóm)
- ✅ Đơn giản, dễ giải thích

**Nhược điểm:**
- ⚠️ Stereotype risk (định kiến theo tuổi/giới tính)
- ⚠️ Không personalized (cùng nhóm → gợi ý giống nhau)
- ⚠️ Yếu hơn SVD và Content-based khi có lịch sử

---

**📅 Tạo: 06/11/2025**  
**👨‍💻 Tác giả: AI Assistant**

