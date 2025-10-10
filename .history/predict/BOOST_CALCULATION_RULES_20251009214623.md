# 📐 Boost Factor Calculation Rules

## Tổng quan

Mỗi game được đánh giá qua **6 thuộc tính** với boost factor từ **0.6 - 1.2**:
- **1.2**: Perfect match với preferences
- **1.1**: Good match
- **1.0**: Neutral/OK match
- **0.9-0.8**: Weak match
- **0.7-0.6**: No match (penalty)

**Total Boost** = Publisher × Genre × Price × Age × Mode × Platform

---

## 1️⃣ Publisher (0.6 - 1.2)

### Nguyên tắc:
So sánh publisher của game với danh sách publishers mà user tương tác trong 7 ngày.

### Công thức:

| Publisher Score | Boost Factor | Ý nghĩa |
|----------------|--------------|---------|
| ≥ 0.5 | **1.2** | Top publisher (>50% interactions) |
| ≥ 0.3 | **1.1** | Strong (30-50% interactions) |
| ≥ 0.15 | **1.0** | Medium (15-30%) |
| ≥ 0.05 | **0.9** | Weak (5-15%) |
| < 0.05 | **0.8** | Very weak (<5%) |
| Not in list | **0.7** | ❌ PENALTY: Không match |

### Ví dụ:

**User 7-day history**: 10 games
- EA Sports: 6 games → score = 6/10 = **0.60**
- Riot Games: 3 games → score = 3/10 = **0.30**
- Valve: 1 game → score = 1/10 = **0.10**

**Game test**:
- FIFA 23 (EA Sports) → score 0.60 → **×1.2** ✓
- Valorant (Riot Games) → score 0.30 → **×1.1** ✓
- Elden Ring (FromSoftware) → Không có trong list → **×0.7** ❌

---

## 2️⃣ Genre (0.6 - 1.2)

### Nguyên tắc:
Tính **trung bình** match score của **TẤT CẢ** genres trong game với genres preferences.

### Công thức:

```python
# Game có nhiều genres: ['Sports', 'Football', 'Multiplayer']
# Preferences: {'Sports': 0.7, 'Football': 0.5, 'Racing': 0.3}

matched_genres = ['Sports', 'Football']  # 2/3 genres match
avg_score = (0.7 + 0.5) / 2 = 0.60
```

| Average Genre Score | Boost Factor | Ý nghĩa |
|--------------------|--------------|---------|
| ≥ 0.5 | **1.2** | Very strong average match |
| ≥ 0.35 | **1.15** | Strong match |
| ≥ 0.2 | **1.1** | Medium match |
| ≥ 0.1 | **1.0** | Weak match |
| < 0.1 (có match) | **0.9** | Very weak match |
| **0 match** + 3+ genres | **0.6** | ❌❌ Nhiều genres không match |
| **0 match** + 2 genres | **0.7** | ❌ 2 genres không match |
| **0 match** + 1 genre | **0.75** | ❌ 1 genre không match |
| No genre info | **0.75** | Thiếu dữ liệu |

### Ví dụ 1: **Match tốt**

**User 7-day genres**: (từ 10 games)
- Sports: 7 games → **0.70**
- Football: 5 games → **0.50**
- Basketball: 3 games → **0.30**

**Game: FIFA 23** - Genres: `['Sports', 'Football', 'Simulation']`

```
Matched:
  - Sports: 0.70
  - Football: 0.50
  - Simulation: không có → skip

Average = (0.70 + 0.50) / 2 = 0.60 ≥ 0.5
→ Boost = ×1.2 ✓✓
```

### Ví dụ 2: **Không match - PENALTY**

**User 7-day genres**: Sports (0.7), Football (0.5)

**Game: Elden Ring** - Genres: `['RPG', 'Dark Fantasy', 'Action']`

```
Matched: 0 genres match
Game có 3 genres
→ Boost = ×0.6 ❌❌ (penalty nặng)
```

---

## 3️⃣ Price (0.6 - 1.2)

### Nguyên tắc:
Dựa trên **% deviation** từ average price trong 7 ngày.

### Công thức:

```python
deviation = |game_price - avg_price| / avg_price
# VD: avg = 700k
#     game = 1000k
#     deviation = |1000k - 700k| / 700k = 300k / 700k = 0.43 (43%)
```

| Deviation | Range (avg=700k) | Boost | Ý nghĩa |
|-----------|------------------|-------|---------|
| ≤ 15% | 595k - 805k | **1.2** | Perfect price range |
| ≤ 30% | 490k - 910k | **1.1** | Good price range |
| ≤ 50% | 350k - 1,050k | **1.0** | OK price range |
| ≤ 75% | 175k - 1,225k | **0.9** | Weak match |
| ≤ 100% | 0k - 1,400k | **0.8** | Poor match |
| ≤ 150% | Far from range | **0.7** | Very poor |
| > 150% | Quá xa | **0.6** | ❌ Penalty nặng |

### Trường hợp đặc biệt:

| Tình huống | Boost | Giải thích |
|-----------|-------|-----------|
| Game FREE & User chơi FREE | **1.2** | Perfect match |
| Game FREE & User mua games | **0.9** | User thích paid games |
| Game có giá & User chơi FREE | **0.7** | ❌ User không muốn trả tiền |

### Ví dụ:

**User 7-day price**: avg = 700k

| Game | Price | Deviation | Boost |
|------|-------|-----------|-------|
| FIFA 23 | 750k | 7% | **×1.2** ✓ |
| Among Us | 83k | 88% | **×0.8** ❌ |
| Elden Ring | 1,200k | 71% | **×0.9** ~ |
| GTA V | 2,000k | 186% | **×0.6** ❌❌ |

---

## 4️⃣ Age Rating (0.6 - 1.2)

### Nguyên tắc:
So sánh age rating với age preferences trong 7 ngày.

### Age Ratings:
- **E**: Everyone (mọi người)
- **T**: Teen (13+)
- **M**: Mature (17+)

### Công thức:

| Age Score trong Preferences | Boost | Ý nghĩa |
|----------------------------|-------|---------|
| ≥ 0.5 | **1.2** | Very strong (>50% games) |
| ≥ 0.3 | **1.15** | Strong (30-50%) |
| ≥ 0.15 | **1.1** | Medium (15-30%) |
| ≥ 0.05 | **1.0** | Weak (5-15%) |
| < 0.05 | **0.9** | Very weak |
| Not in preferences | **0.7** | ❌ PENALTY |

### Ví dụ:

**User 7-day history**: 10 games
- E rating: 7 games → **0.70**
- T rating: 3 games → **0.30**
- M rating: 0 games → **0.00**

| Game | Age Rating | Score | Boost |
|------|-----------|-------|-------|
| FIFA 23 | E | 0.70 | **×1.2** ✓ |
| Valorant | T | 0.30 | **×1.15** ✓ |
| Elden Ring | M | 0.00 | **×0.7** ❌ |
| GTA V | M | 0.00 | **×0.7** ❌ |

---

## 5️⃣ Mode (0.6 - 1.2)

### Nguyên tắc:
So sánh game mode với mode preferences.

### Game Modes:
- **Single Player**: Chơi đơn
- **Multiplayer**: Chơi nhiều người
- **Co-op**: Hợp tác

### Công thức:

| Mode Score | Boost | Ý nghĩa |
|-----------|-------|---------|
| ≥ 0.6 | **1.2** | Very strong preference |
| ≥ 0.4 | **1.15** | Strong preference |
| ≥ 0.2 | **1.1** | Medium preference |
| ≥ 0.1 | **1.0** | Weak preference |
| < 0.1 | **0.9** | Very weak |
| Not in preferences | **0.7** | ❌ PENALTY |

### Ví dụ:

**User 7-day modes**:
- Multiplayer: 8/10 games → **0.80**
- Single Player: 2/10 games → **0.20**

| Game | Mode | Score | Boost |
|------|------|-------|-------|
| Valorant | Multiplayer | 0.80 | **×1.2** ✓ |
| FIFA 23 | Multiplayer | 0.80 | **×1.2** ✓ |
| Elden Ring | Single Player | 0.20 | **×1.1** ~ |
| Portal | Co-op | 0.00 | **×0.7** ❌ |

---

## 6️⃣ Platform (0.6 - 1.2)

### Nguyên tắc:
Tính **trung bình** match score của platforms (game có thể có nhiều platforms).

### Platforms:
- PC
- PlayStation
- Xbox
- Nintendo Switch
- Mobile

### Công thức:

Giống như Genre, tính trung bình:

```python
# Game: ['PC', 'PlayStation', 'Xbox']
# Preferences: {'PC': 1.0, 'PlayStation': 0.5}

matched = ['PC', 'PlayStation']
avg = (1.0 + 0.5) / 2 = 0.75
```

| Average Platform Score | Boost | Ý nghĩa |
|-----------------------|-------|---------|
| ≥ 0.7 | **1.2** | Very strong |
| ≥ 0.5 | **1.15** | Strong |
| ≥ 0.3 | **1.1** | Medium |
| ≥ 0.15 | **1.0** | Weak |
| < 0.15 | **0.9** | Very weak |
| **0 match** | **0.7** | ❌ PENALTY |

### Ví dụ:

**User 7-day platforms**:
- PC: 10/10 games → **1.00**
- PlayStation: 5/10 games → **0.50**

| Game | Platforms | Calculation | Boost |
|------|-----------|-------------|-------|
| Valorant | PC | avg = 1.0 | **×1.2** ✓ |
| FIFA 23 | PC, PS, Xbox | avg = (1.0+0.5)/2 = 0.75 | **×1.2** ✓ |
| Elden Ring | PC, PS | avg = (1.0+0.5)/2 = 0.75 | **×1.2** ✓ |
| Zelda | Nintendo Switch | avg = 0 (no match) | **×0.7** ❌ |

---

## 📊 Ví dụ tổng hợp: FIFA 23

### User preferences (7 days):
```
Publishers: {'EA Sports': 0.60, 'Riot Games': 0.30}
Genres: {'Sports': 0.70, 'Football': 0.50, 'Basketball': 0.30}
Price: avg = 700k
Age Ratings: {'E': 0.70, 'T': 0.30}
Modes: {'Multiplayer': 0.80, 'Single Player': 0.20}
Platforms: {'PC': 1.00, 'PlayStation': 0.50}
```

### Game: FIFA 23
```json
{
  "name": "FIFA 23",
  "publisher": "EA Sports",
  "genre": ["Sports", "Football", "Simulation"],
  "price": 750000,
  "age_rating": "E",
  "mode": "Multiplayer",
  "platform": ["PC", "PlayStation", "Xbox"]
}
```

### Tính toán từng factor:

#### 1. Publisher:
```
EA Sports có trong preferences: 0.60 ≥ 0.5
→ ×1.2 ✓
```

#### 2. Genre:
```
Matched: Sports (0.70), Football (0.50)
Simulation không có → skip
Average = (0.70 + 0.50) / 2 = 0.60 ≥ 0.5
→ ×1.2 ✓
```

#### 3. Price:
```
Deviation = |750k - 700k| / 700k = 50k / 700k = 0.07 (7%)
7% ≤ 15%
→ ×1.2 ✓
```

#### 4. Age:
```
E rating: 0.70 ≥ 0.5
→ ×1.2 ✓
```

#### 5. Mode:
```
Multiplayer: 0.80 ≥ 0.6
→ ×1.2 ✓
```

#### 6. Platform:
```
Matched: PC (1.0), PlayStation (0.50)
Xbox không có → skip
Average = (1.0 + 0.50) / 2 = 0.75 ≥ 0.7
→ ×1.2 ✓
```

### Total Boost:
```
Total = 1.2 × 1.2 × 1.2 × 1.2 × 1.2 × 1.2
      = 1.2⁶
      = 2.99 ≈ 3.0 ✓✓✓

→ Perfect match! FIFA 23 boost ×3.0!
```

### Impact lên score:
```
Base score: 0.122
Boosted score: 0.122 × 3.0 = 0.366
Impact: +0.244 (tăng 200%!)
```

---

## 📊 Ví dụ penalty: Elden Ring

### User preferences (Sports lover):
```
Publishers: {'EA Sports': 0.60, '2K Sports': 0.40}
Genres: {'Sports': 0.70, 'Football': 0.50}
Price: avg = 700k
Age: {'E': 0.80}
Mode: {'Multiplayer': 0.90}
Platforms: {'PC': 1.00}
```

### Game: Elden Ring
```json
{
  "name": "Elden Ring",
  "publisher": "FromSoftware",
  "genre": ["RPG", "Dark Fantasy", "Action"],
  "price": 1200000,
  "age_rating": "M",
  "mode": "Single Player",
  "platform": ["PC", "PlayStation"]
}
```

### Tính toán:

#### 1. Publisher:
```
FromSoftware không có trong preferences
→ ×0.7 ❌
```

#### 2. Genre:
```
RPG, Dark Fantasy, Action → 0 genres match
Game có 3 genres không match
→ ×0.6 ❌❌
```

#### 3. Price:
```
Deviation = |1200k - 700k| / 700k = 500k / 700k = 0.71 (71%)
71% ≤ 75%
→ ×0.9 ~
```

#### 4. Age:
```
M rating không có trong preferences (chỉ có E)
→ ×0.7 ❌
```

#### 5. Mode:
```
Single Player: 0 (preferences chỉ có Multiplayer)
→ ×0.7 ❌
```

#### 6. Platform:
```
PC: 1.0, PlayStation: 0 (skip)
Average = 1.0 ≥ 0.7
→ ×1.2 ✓ (duy nhất 1 factor match!)
```

### Total Boost:
```
Total = 0.7 × 0.6 × 0.9 × 0.7 × 0.7 × 1.2
      = 0.22 ❌❌❌

→ Heavy penalty! Elden Ring giảm 78%!
```

### Impact:
```
Base score: 0.599
Boosted score: 0.599 × 0.22 = 0.132
Impact: -0.467 (giảm 78%!)
```

---

## 🎯 Tóm tắt

### Boost Range cho mỗi factor:
| Factor | Min | Max | Neutral |
|--------|-----|-----|---------|
| Publisher | 0.7 | 1.2 | 1.0 |
| Genre | 0.6 | 1.2 | 0.75 |
| Price | 0.6 | 1.2 | 1.0 |
| Age | 0.7 | 1.2 | 1.0 |
| Mode | 0.7 | 1.2 | 1.0 |
| Platform | 0.7 | 1.2 | 1.0 |

### Total Boost Range:
- **Maximum**: 1.2⁶ = **2.99** (tất cả factors perfect match)
- **Minimum**: 0.6⁷ = **0.03** (tất cả factors penalty)
- **Typical boost**: 1.2 - 1.8
- **Typical penalty**: 0.3 - 0.8

### Quy tắc chung:
1. **Match nhiều factors** → Boost cao → Rank lên
2. **Không match** → Penalty → Rank xuống
3. **Genre & Publisher** có impact mạnh nhất (có thể xuống 0.6)
4. **Price** quan trọng với budget gamers
5. **Platform** ít bị penalty (thường games có nhiều platforms)

---

## 🔧 Cách test

```bash
cd predict
python test_boost_scenarios.py
```

Xem chi tiết breakdown cho từng scenario!

---

**Last updated**: 2025-10-09
**Boost range**: 0.6 - 1.2 per factor
**Total range**: 0.03 - 2.99

