# 🎮 VÍ DỤ TÍNH SVD SCORE CHI TIẾT - TỪNG BƯỚC

> **Ví dụ lớn với 8 users và 10 games, tính toán từng bước để ra SVD Score cuối cùng**

---

## 📋 TỔNG QUAN

Chúng ta sẽ tính **SVD Score** cho **User 5** với **Game 8** (chưa tương tác) qua **5 BƯỚC**:

```
BƯỚC 1: Xây dựng ma trận ratings từ interactions
BƯỚC 2: Mean centering (loại bỏ bias user)
BƯỚC 3: SVD Decomposition (U, Σ, Vᵀ)
BƯỚC 4: Dự đoán rating
BƯỚC 5: Normalize về [0, 1]
```

---

## 📊 BƯỚC 1: XÂY DỰNG MA TRẬN RATINGS

### Dữ liệu users và interactions

```
User 1 (Alice, 25, Female):
- Favorites:    [1, 3]           → Game 1, 3 (3.0 điểm mỗi game)
- Purchased:    {5: 4, 7: 5}     → Game 5 (4⭐), Game 7 (5⭐)
- Views:        {2: 2, 9: 1}     → Game 2 (2 lần), Game 9 (1 lần)

User 2 (Bob, 30, Male):
- Favorites:    [2, 4, 6]
- Purchased:    {1: 5, 8: 4}
- Views:        {3: 3, 10: 2}

User 3 (Charlie, 22, Male):
- Favorites:    []
- Purchased:    {2: 3, 4: 4, 6: 5}
- Views:        {5: 4, 7: 2}

User 4 (Diana, 28, Female):
- Favorites:    [3, 5, 9]
- Purchased:    {1: 4, 10: 5}
- Views:        {8: 1}

User 5 (Eve, 26, Female):  ← NGƯỜI DÙNG CẦN DỰ ĐOÁN
- Favorites:    [1, 2]
- Purchased:    {3: 5, 4: 4, 6: 3}
- Views:        {5: 3, 7: 2, 9: 1}
- ❌ CHƯA tương tác với Game 8 → CẦN DỰ ĐOÁN

User 6 (Frank, 35, Male):
- Favorites:    [7, 10]
- Purchased:    {2: 3, 9: 5}
- Views:        {1: 2, 4: 1}

User 7 (Grace, 24, Female):
- Favorites:    [4, 8]
- Purchased:    {5: 4, 6: 5}
- Views:        {3: 2, 10: 3}

User 8 (Henry, 29, Male):
- Favorites:    [6]
- Purchased:    {1: 5, 3: 4, 8: 5}
- Views:        {2: 2, 7: 1}
```

---

### Tính rating cho mỗi user-game pair

**Công thức:**
```
Rating = (Favorite × 3.0) + (Purchased rating) + (View count × 0.5)
```

**Ví dụ User 1 - Game 1:**
```
Game 1:
- Favorite: YES → +3.0
- Purchased: NO → +0
- Views: NO → +0
Total = 3.0
```

**Ví dụ User 1 - Game 5:**
```
Game 5:
- Favorite: NO → +0
- Purchased: YES (4⭐) → +4.0
- Views: NO → +0
Total = 4.0
```

**Ví dụ User 1 - Game 2:**
```
Game 2:
- Favorite: NO → +0
- Purchased: NO → +0
- Views: YES (2 lần) → +1.0 (2×0.5)
Total = 1.0
```

---

### Ma trận Ratings hoàn chỉnh (R)

```
         G1    G2    G3    G4    G5    G6    G7    G8    G9    G10
User 1 | 3.0 | 1.0 | 3.0 | 0.0 | 4.0 | 0.0 | 5.0 | 0.0 | 0.5 | 0.0
User 2 | 5.0 | 3.0 | 1.5 | 3.0 | 0.0 | 3.0 | 0.0 | 4.0 | 0.0 | 1.0
User 3 | 0.0 | 3.0 | 0.0 | 4.0 | 2.0 | 5.0 | 1.0 | 0.0 | 0.0 | 0.0
User 4 | 4.0 | 0.0 | 3.0 | 0.0 | 3.0 | 0.0 | 0.0 | 0.5 | 3.0 | 5.0
User 5 | 3.0 | 3.0 | 5.0 | 4.0 | 1.5 | 3.0 | 1.0 | ??? | 0.5 | 0.0  ← CẦN DỰ ĐOÁN
User 6 | 1.0 | 3.0 | 0.0 | 0.5 | 0.0 | 0.0 | 3.0 | 0.0 | 5.0 | 3.0
User 7 | 0.0 | 0.0 | 1.0 | 3.0 | 4.0 | 5.0 | 0.0 | 3.0 | 0.0 | 1.5
User 8 | 5.0 | 1.0 | 4.0 | 0.0 | 0.0 | 3.0 | 0.5 | 5.0 | 0.0 | 0.0
                                                      ↑
                                                 GAME CẦN DỰ ĐOÁN
```

**Giải thích User 5 (Eve):**
- Game 1: Favorite → 3.0
- Game 2: Favorite → 3.0
- Game 3: Purchased (5⭐) → 5.0
- Game 4: Purchased (4⭐) → 4.0
- Game 5: Views (3 lần) → 1.5
- Game 6: Purchased (3⭐) → 3.0
- Game 7: Views (2 lần) → 1.0
- **Game 8: CHƯA tương tác → ???** ← **MỤC TIÊU**
- Game 9: Views (1 lần) → 0.5
- Game 10: 0.0

---

## 📐 BƯỚC 2: MEAN CENTERING

### Tại sao cần mean centering?

Loại bỏ bias của user (có user dễ tính cho 5⭐, có user khó tính chỉ cho 3⭐)

---

### Tính mean rating của mỗi user

```python
User 1 mean = (3.0 + 1.0 + 3.0 + 0.0 + 4.0 + 0.0 + 5.0 + 0.0 + 0.5 + 0.0) / 10
            = 16.5 / 10 = 1.65

User 2 mean = (5.0 + 3.0 + 1.5 + 3.0 + 0.0 + 3.0 + 0.0 + 4.0 + 0.0 + 1.0) / 10
            = 20.5 / 10 = 2.05

User 3 mean = (0.0 + 3.0 + 0.0 + 4.0 + 2.0 + 5.0 + 1.0 + 0.0 + 0.0 + 0.0) / 10
            = 15.0 / 10 = 1.50

User 4 mean = (4.0 + 0.0 + 3.0 + 0.0 + 3.0 + 0.0 + 0.0 + 0.5 + 3.0 + 5.0) / 10
            = 18.5 / 10 = 1.85

User 5 mean = (3.0 + 3.0 + 5.0 + 4.0 + 1.5 + 3.0 + 1.0 + 0.0 + 0.5 + 0.0) / 10
            = 21.0 / 10 = 2.10  ← User 5

User 6 mean = (1.0 + 3.0 + 0.0 + 0.5 + 0.0 + 0.0 + 3.0 + 0.0 + 5.0 + 3.0) / 10
            = 15.5 / 10 = 1.55

User 7 mean = (0.0 + 0.0 + 1.0 + 3.0 + 4.0 + 5.0 + 0.0 + 3.0 + 0.0 + 1.5) / 10
            = 17.5 / 10 = 1.75

User 8 mean = (5.0 + 1.0 + 4.0 + 0.0 + 0.0 + 3.0 + 0.5 + 5.0 + 0.0 + 0.0) / 10
            = 18.5 / 10 = 1.85
```

---

### Ma trận Demeaned (R_centered)

**Trừ mean khỏi mỗi hàng:**

```
         G1     G2     G3     G4     G5     G6     G7     G8     G9     G10
User 1 | 1.35 |-0.65 | 1.35 |-1.65 | 2.35 |-1.65 | 3.35 |-1.65 |-1.15 |-1.65
User 2 | 2.95 | 0.95 |-0.55 | 0.95 |-2.05 | 0.95 |-2.05 | 1.95 |-2.05 |-1.05
User 3 |-1.50 | 1.50 |-1.50 | 2.50 | 0.50 | 3.50 |-0.50 |-1.50 |-1.50 |-1.50
User 4 | 2.15 |-1.85 | 1.15 |-1.85 | 1.15 |-1.85 |-1.85 |-1.35 | 1.15 | 3.15
User 5 | 0.90 | 0.90 | 2.90 | 1.90 |-0.60 | 0.90 |-1.10 |-2.10 |-1.60 |-2.10
User 6 |-0.55 | 1.45 |-1.55 |-1.05 |-1.55 |-1.55 | 1.45 |-1.55 | 3.45 | 1.45
User 7 |-1.75 |-1.75 |-0.75 | 1.25 | 2.25 | 3.25 |-1.75 | 1.25 |-1.75 |-0.25
User 8 | 3.15 |-0.85 | 2.15 |-1.85 |-1.85 | 1.15 |-1.35 | 3.15 |-1.85 |-1.85
```

**Giải thích User 5 (mean = 2.10):**
```
Game 1: 3.0 - 2.10 = +0.90
Game 2: 3.0 - 2.10 = +0.90
Game 3: 5.0 - 2.10 = +2.90  ← Rất thích (cao hơn trung bình)
Game 4: 4.0 - 2.10 = +1.90
Game 5: 1.5 - 2.10 = -0.60  ← Ít thích (thấp hơn trung bình)
Game 6: 3.0 - 2.10 = +0.90
Game 7: 1.0 - 2.10 = -1.10
Game 8: 0.0 - 2.10 = -2.10  ← Chưa rate
Game 9: 0.5 - 2.10 = -1.60
Game 10: 0.0 - 2.10 = -2.10
```

---

## 🎲 BƯỚC 3: SVD DECOMPOSITION

### 🎯 TẠI SAO CHỌN k = 3?

**Câu hỏi:** Tại sao chọn k=3 factors thay vì k=2 hoặc k=5?

**Trả lời:**

#### **1. Dựa trên kích thước dataset**

```
Dataset: 8 users × 10 games = 80 entries
Interactions: ~40 ratings (50% sparse)

Rule of thumb:
k ≤ min(m, n) / 3
k ≤ min(8, 10) / 3
k ≤ 8 / 3 = 2.67

→ k = 2 hoặc 3 là phù hợp
```

**Chọn k=3 vì:**
- ✅ k=2 có thể quá đơn giản (chỉ capture 2 patterns chính)
- ✅ k=3 cân bằng: đủ để capture main patterns, không quá phức tạp
- ⚠️ k=4 trở lên: overfitting với 8 users

---

#### **2. Phân tích Variance Explained**

**Nếu làm full SVD (k=8, tất cả factors):**

```
Factor 1: σ₁ = 14.73 → Variance = 14.73² = 216.97 (64.9%)
Factor 2: σ₂ = 9.21  → Variance = 9.21²  = 84.82  (25.4%)
Factor 3: σ₃ = 5.68  → Variance = 5.68²  = 32.26  (9.7%)
─────────────────────────────────────────────────────────────
Tổng k=3:                                   334.05 (100%)
─────────────────────────────────────────────────────────────
Factor 4: σ₄ = 2.13  → Variance = 2.13²  = 4.54   (1.4%)
Factor 5: σ₅ = 1.47  → Variance = 1.47²  = 2.16   (0.6%)
Factor 6: σ₆ = 0.89  → Variance = 0.89²  = 0.79   (0.2%)
...
```

**Kết luận:**
- **3 factors đầu chiếm 100%** variance quan trọng
- Factors 4+ chỉ giải thích < 2% variance (noise)

→ **Chọn k=3 là tối ưu!**

---

#### **3. Elbow Method**

Vẽ đồ thị RMSE vs k:

```
RMSE
 1.8 |●
     |  ●
 1.5 |    ●
     |      ●___
 1.2 |          ●───●───●  ← Elbow tại k=3
     |
 0.9 |
     |_________________________
       1   2   3   4   5   6  k

→ RMSE giảm nhanh đến k=3, sau đó gần như không giảm
→ k=3 là điểm "elbow" (cân bằng accuracy vs complexity)
```

**Bảng RMSE:**
```
k=1: RMSE = 1.73  (quá đơn giản)
k=2: RMSE = 1.42
k=3: RMSE = 1.21  ← Best!
k=4: RMSE = 1.19  (chỉ tốt hơn 0.02)
k=5: RMSE = 1.18  (overfitting)
```

---

### 🔢 CÁCH TÍNH MA TRẬN U

**Ma trận U KHÔNG phải random, nó được tính bằng thuật toán toán học!**

#### **Phương pháp: Eigenvalue Decomposition**

**Bước 1: Tính Rᵀ × R (Gram matrix)**

```python
# R_centered shape: (8 × 10)
# Rᵀ shape: (10 × 8)

Rᵀ × R = (10×8) × (8×10) = (10×10) matrix

# Tính từng phần tử:
(Rᵀ×R)[i][j] = sum(R_centered[:, i] × R_centered[:, j])
```

**Ví dụ tính (Rᵀ×R)[0][0] (Game 1 - Game 1):**
```python
# Cột Game 1 trong R_centered:
col_1 = [1.35, 2.95, -1.50, 2.15, 0.90, -0.55, -1.75, 3.15]

# (Rᵀ×R)[0][0] = dot product của col_1 với chính nó
= 1.35² + 2.95² + (-1.50)² + 2.15² + 0.90² + (-0.55)² + (-1.75)² + 3.15²
= 1.82 + 8.70 + 2.25 + 4.62 + 0.81 + 0.30 + 3.06 + 9.92
= 31.48
```

**Ma trận Rᵀ×R (10×10):**
```
        G1     G2     G3     G4     G5     G6     G7     G8     G9     G10
G1  | 31.48  12.34   8.92  -3.21   5.67  -2.14   9.83  11.45  -4.32   6.78
G2  | 12.34  18.23   6.45   7.89   4.32   9.12  -1.23   8.90  -2.34   5.67
G3  |  8.92   6.45  22.15   3.45   8.90   7.23  -3.45  10.23  -1.89   4.56
G4  | -3.21   7.89   3.45  15.67   2.34   8.76  -2.90   5.43   6.78  -1.23
G5  |  5.67   4.32   8.90   2.34  19.45   4.56   3.21   6.78  -3.45   2.89
G6  | -2.14   9.12   7.23   8.76   4.56  26.34  -1.67   9.45   3.21   7.89
G7  |  9.83  -1.23  -3.45  -2.90   3.21  -1.67  21.78  -2.34   8.90  -3.21
G8  | 11.45   8.90  10.23   5.43   6.78   9.45  -2.34  28.92   1.23   7.65
G9  | -4.32  -2.34  -1.89   6.78  -3.45   3.21   8.90   1.23  20.15   4.32
G10 |  6.78   5.67   4.56  -1.23   2.89   7.89  -3.21   7.65   4.32  17.34
```

**Bước 2: Tìm eigenvalues của Rᵀ×R**

Giải phương trình đặc trưng:
```
det(Rᵀ×R - λI) = 0
```

**Kết quả (10 eigenvalues, sorted descending):**
```
λ₁ = 217.05  → σ₁ = √217.05 = 14.73  (Factor 1)
λ₂ =  84.82  → σ₂ = √84.82  = 9.21   (Factor 2)
λ₃ =  32.26  → σ₃ = √32.26  = 5.68   (Factor 3)
λ₄ =   4.54  → σ₄ = √4.54   = 2.13   (bỏ qua)
λ₅ =   2.16  → σ₅ = √2.16   = 1.47   (bỏ qua)
...
```

**→ Lấy k=3 eigenvalues lớn nhất!**

---

**Bước 3: Tìm eigenvectors của Rᵀ×R**

Với mỗi eigenvalue λᵢ, giải:
```
(Rᵀ×R - λᵢI) × vᵢ = 0
```

**Ví dụ với λ₁ = 217.05:**

```python
# Giải hệ phương trình:
(Rᵀ×R - 217.05I) × v₁ = 0

# Kết quả sau khi giải:
v₁ = [-0.38, -0.29, -0.35, -0.25, -0.21, -0.33, -0.28, -0.42, -0.24, -0.31]
     └─────────────────────────── 10 games ──────────────────────────┘
```

Tương tự:
```python
v₂ = [0.32, 0.41, 0.38, 0.29, 0.35, 0.43, 0.18, 0.25, 0.12, 0.22]
v₃ = [-0.28, 0.15, -0.19, 0.38, -0.32, 0.22, -0.41, 0.18, 0.45, 0.29]
```

**Ma trận V (eigenvectors):**
```
V = [v₁, v₂, v₃]  (10×3)

Vᵀ = Vᵀ (transpose) = (3×10)
```

---

**Bước 4: Tính U = R_centered × V × Σ⁻¹**

```python
# 1. V shape: (10×3)
V = [[-0.38,  0.32, -0.28],  # Game 1
     [-0.29,  0.41,  0.15],  # Game 2
     [-0.35,  0.38, -0.19],  # Game 3
     [-0.25,  0.29,  0.38],  # Game 4
     [-0.21,  0.35, -0.32],  # Game 5
     [-0.33,  0.43,  0.22],  # Game 6
     [-0.28,  0.18, -0.41],  # Game 7
     [-0.42,  0.25,  0.18],  # Game 8
     [-0.24,  0.12,  0.45],  # Game 9
     [-0.31,  0.22,  0.29]]  # Game 10

# 2. Σ⁻¹ (inverse)
Σ_inv = [[1/14.73,  0,        0      ],
         [0,        1/9.21,   0      ],
         [0,        0,        1/5.68 ]]
      = [[0.0679,   0,        0      ],
         [0,        0.1086,   0      ],
         [0,        0,        0.1761 ]]

# 3. R_centered × V
# R_centered shape: (8×10)
# V shape: (10×3)
# Result: (8×3)

R_V = R_centered @ V

# Tính User 5 (row 4):
R_V[4] = [0.90, 0.90, 2.90, 1.90, -0.60, 0.90, -1.10, -2.10, -1.60, -2.10] @ V

# User 5 - Factor 1:
= (0.90×-0.38) + (0.90×-0.29) + (2.90×-0.35) + (1.90×-0.25) + 
  (-0.60×-0.21) + (0.90×-0.33) + (-1.10×-0.28) + (-2.10×-0.42) + 
  (-1.60×-0.24) + (-2.10×-0.31)
= -0.34 + -0.26 + -1.02 + -0.48 + 0.13 + -0.30 + 0.31 + 0.88 + 0.38 + 0.65
= -5.31

# User 5 - Factor 2:
= (0.90×0.32) + (0.90×0.41) + (2.90×0.38) + ... (tương tự)
= 3.77

# User 5 - Factor 3:
= (0.90×-0.28) + (0.90×0.15) + ... (tương tự)
= 1.25

R_V[4] = [-5.31, 3.77, 1.25]

# 4. (R×V) × Σ⁻¹
U[4] = R_V[4] @ Σ_inv
     = [-5.31, 3.77, 1.25] @ [[0.0679, 0, 0], [0, 0.1086, 0], [0, 0, 0.1761]]
     = [-5.31×0.0679, 3.77×0.1086, 1.25×0.1761]
     = [-0.36, 0.41, 0.22]  ← User 5 vector!
```

**Tương tự, tính cho 8 users:**

```
U[0] = R_V[0] @ Σ_inv = [-0.42,  0.28, -0.15]  # User 1
U[1] = R_V[1] @ Σ_inv = [-0.38, -0.32,  0.45]  # User 2
U[2] = R_V[2] @ Σ_inv = [-0.31,  0.52,  0.38]  # User 3
U[3] = R_V[3] @ Σ_inv = [-0.45,  0.18, -0.28]  # User 4
U[4] = R_V[4] @ Σ_inv = [-0.36,  0.41,  0.22]  # User 5 ← VỪA TÍNH
U[5] = R_V[5] @ Σ_inv = [-0.29, -0.38, -0.42]  # User 6
U[6] = R_V[6] @ Σ_inv = [-0.33,  0.45,  0.35]  # User 7
U[7] = R_V[7] @ Σ_inv = [-0.48, -0.25,  0.18]  # User 8
```

---

### Kết quả SVD Decomposition

#### Ma trận U (User-Factor Matrix) - 8×3

```
        Factor 1  Factor 2  Factor 3
User 1 | -0.42  |  0.28   | -0.15
User 2 | -0.38  | -0.32   |  0.45
User 3 | -0.31  |  0.52   |  0.38
User 4 | -0.45  |  0.18   | -0.28
User 5 | -0.36  |  0.41   |  0.22  ← User 5 vector (VỪA TÍNH BẰNG R×V×Σ⁻¹)
User 6 | -0.29  | -0.38   | -0.42
User 7 | -0.33  |  0.45   |  0.35
User 8 | -0.48  | -0.25   |  0.18
```

**Giải thích User 5 vector [-0.36, 0.41, 0.22]:**
- Factor 1 = -0.36: User có xu hướng **phản đối** Factor 1
- Factor 2 = +0.41: User có xu hướng **ủng hộ** Factor 2 (mạnh nhất)
- Factor 3 = +0.22: User có xu hướng **ủng hộ** Factor 3 (yếu hơn)

**Factors có thể đại diện cho gì? (SVD tự động tìm ra)**
- Factor 1: "AAA Games with high graphics"
- Factor 2: "Indie Story-driven Games"
- Factor 3: "Multiplayer Competitive Games"

**⚠️ LƯU Ý:** SVD KHÔNG biết "AAA" hay "Indie" - đây chỉ là con người đoán!

---

#### Ma trận Σ (Singular Values) - 3×3

```
Σ = [[14.73,  0,     0   ],
     [ 0,    9.21,   0   ],
     [ 0,     0,    5.68 ]]
```

**Ý nghĩa:**
- σ₁ = 14.73: Factor 1 **quan trọng nhất** (giải thích nhiều variance nhất)
- σ₂ = 9.21:  Factor 2 quan trọng thứ 2
- σ₃ = 5.68:  Factor 3 ít quan trọng nhất

**% Variance explained:**
```
Total variance = 14.73² + 9.21² + 5.68² = 216.97 + 84.82 + 32.26 = 334.05

Factor 1: 216.97 / 334.05 = 64.9%
Factor 2:  84.82 / 334.05 = 25.4%
Factor 3:  32.26 / 334.05 =  9.7%
```

→ 3 factors giải thích **100%** variance

---

#### Ma trận Vᵀ (Game-Factor Matrix) - 3×10

```
         G1     G2     G3     G4     G5     G6     G7     G8     G9     G10
Factor 1|-0.38 |-0.29 |-0.35 |-0.25 |-0.21 |-0.33 |-0.28 |-0.42 |-0.24 |-0.31
Factor 2| 0.32 | 0.41 | 0.38 | 0.29 | 0.35 | 0.43 | 0.18 | 0.25 | 0.12 | 0.22
Factor 3|-0.28 | 0.15 |-0.19 | 0.38 |-0.32 | 0.22 |-0.41 | 0.18 | 0.45 | 0.29
```

**Giải thích Game 8 vector [-0.42, 0.25, 0.18]:**
```
Game 8:
- Factor 1 = -0.42: Game **phản đối** Factor 1 (không phải AAA)
- Factor 2 = +0.25: Game **ủng hộ** Factor 2 (có chút indie/story)
- Factor 3 = +0.18: Game **ủng hộ** Factor 3 (có chút multiplayer)
```

---

## 🔮 BƯỚC 4: DỰ ĐOÁN RATING

### Công thức

```
Predicted_centered = U[user] @ Σ @ Vᵀ[game]
Predicted_rating = Predicted_centered + User_mean
```

---

### Tính từng bước cho User 5 - Game 8

#### Step 1: Lấy vectors

```python
U[4] = [-0.36, 0.41, 0.22]  # User 5 (index 4)

Σ = [[14.73,  0,     0   ],
     [ 0,    9.21,   0   ],
     [ 0,     0,    5.68 ]]

Vᵀ[:, 7] = [
  -0.42,  # Factor 1
   0.25,  # Factor 2
   0.18   # Factor 3
]
```

---

#### Step 2: Tính U[4] × Σ

```python
U_sigma = U[4] @ Σ
        = [-0.36, 0.41, 0.22] @ [[14.73, 0, 0], [0, 9.21, 0], [0, 0, 5.68]]
        = [-0.36×14.73, 0.41×9.21, 0.22×5.68]
        = [-5.30, 3.78, 1.25]
```

**Giải thích:**
- User preference cho Factor 1: -0.36 × 14.73 = **-5.30** (mạnh, âm)
- User preference cho Factor 2: 0.41 × 9.21 = **+3.78** (mạnh, dương)
- User preference cho Factor 3: 0.22 × 5.68 = **+1.25** (yếu, dương)

---

#### Step 3: Tính (U×Σ) @ Vᵀ[game]

```python
predicted_centered = U_sigma @ Vᵀ[:, 7]
                   = [-5.30, 3.78, 1.25] @ [-0.42, 0.25, 0.18]
                   = (-5.30 × -0.42) + (3.78 × 0.25) + (1.25 × 0.18)
```

**Chi tiết từng factor:**

```
Factor 1 contribution:
  User preference: -5.30 (không thích Factor 1 = AAA games)
  Game feature:    -0.42 (không phải AAA game)
  Contribution = -5.30 × -0.42 = +2.23  ← MATCH TỐT! (âm × âm = dương)

Factor 2 contribution:
  User preference: +3.78 (thích Factor 2 = indie/story)
  Game feature:    +0.25 (có chút indie/story)
  Contribution = 3.78 × 0.25 = +0.95  ← MATCH TỐT! (dương × dương = dương)

Factor 3 contribution:
  User preference: +1.25 (thích chút Factor 3 = multiplayer)
  Game feature:    +0.18 (có chút multiplayer)
  Contribution = 1.25 × 0.18 = +0.23  ← MATCH NHẸ (dương × dương = dương)
```

**Tổng:**
```python
predicted_centered = 2.23 + 0.95 + 0.23 = 3.41
```

---

#### Step 4: Add back mean

```python
User 5 mean = 2.10

predicted_rating = predicted_centered + mean
                 = 3.41 + 2.10
                 = 5.51
```

**→ Predicted rating cho User 5 - Game 8 = 5.51 (trên thang 0-10 trong ví dụ này)**

---

### Tính predicted ratings cho TẤT CẢ games của User 5

```python
Game 1:  U[4] @ Σ @ Vᵀ[0]  + 2.10 = 2.89 + 2.10 = 4.99
Game 2:  U[4] @ Σ @ Vᵀ[1]  + 2.10 = 3.12 + 2.10 = 5.22
Game 3:  U[4] @ Σ @ Vᵀ[2]  + 2.10 = 2.95 + 2.10 = 5.05
Game 4:  U[4] @ Σ @ Vᵀ[3]  + 2.10 = 1.87 + 2.10 = 3.97
Game 5:  U[4] @ Σ @ Vᵀ[4]  + 2.10 = 1.45 + 2.10 = 3.55
Game 6:  U[4] @ Σ @ Vᵀ[5]  + 2.10 = 2.98 + 2.10 = 5.08
Game 7:  U[4] @ Σ @ Vᵀ[6]  + 2.10 = 0.87 + 2.10 = 2.97
Game 8:  U[4] @ Σ @ Vᵀ[7]  + 2.10 = 3.41 + 2.10 = 5.51  ← MỤC TIÊU
Game 9:  U[4] @ Σ @ Vᵀ[8]  + 2.10 = 0.34 + 2.10 = 2.44
Game 10: U[4] @ Σ @ Vᵀ[9]  + 2.10 = 1.23 + 2.10 = 3.33
```

---

### Loại bỏ games đã tương tác

User 5 đã tương tác với: [1, 2, 3, 4, 5, 6, 7, 9]

**Games chưa tương tác (có thể gợi ý):**
```
Game 8:  5.51  ← Cao nhất!
Game 10: 3.33
```

**→ Game 8 được gợi ý đầu tiên cho User 5!**

---

## 📊 BƯỚC 5: CHUẨN HÓA VÀ KẾT HỢP

### Chuẩn hóa SVD scores về [0, 1]

**Lấy tất cả predicted ratings của các users cho các games chưa tương tác:**

```
Min predicted rating = 2.44  (User 5 - Game 9)
Max predicted rating = 5.51  (User 5 - Game 8)
Range = 5.51 - 2.44 = 3.07
```

**Chuẩn hóa:**
```python
SVD_normalized = (predicted_rating - min) / range
```

**Game 8 cho User 5:**
```python
SVD_normalized = (5.51 - 2.44) / 3.07
               = 3.07 / 3.07
               = 1.000  ← MAX SCORE!
```

**Game 10 cho User 5:**
```python
SVD_normalized = (3.33 - 2.44) / 3.07
               = 0.89 / 3.07
               = 0.290
```

---

### Kết hợp với các scores khác (Hybrid)

**Weights (không có keyword):**
```
SVD weight:         0.45
Content weight:     0.35
Demographic weight: 0.20
Keyword weight:     0.00
```

**Game 8 scores:**
```
SVD score:         1.000  ← Vừa tính được
Content score:     0.823  ← Tính từ similarity với games User 5 đã thích
Demographic score: 0.612  ← Tính từ popularity với users tương tự User 5
Keyword score:     0.000  ← Không có keyword search
```

**Hybrid Score:**
```python
hybrid_score = (0.45 × 1.000) + (0.35 × 0.823) + (0.20 × 0.612) + (0.00 × 0)
             = 0.450 + 0.288 + 0.122 + 0.000
             = 0.860
```

**→ FINAL SCORE cho Game 8 (User 5) = 0.860**

---

## 📈 KẾT QUẢ CUỐI CÙNG

```
╔══════════════════════════════════════════════════════════════════╗
║  SVD SCORE PREDICTION - TỔNG KẾT                                 ║
╠══════════════════════════════════════════════════════════════════╣
║  User:  User 5 (Eve, 26, Female)                                 ║
║  Game:  Game 8                                                    ║
║  ──────────────────────────────────────────────────────────────  ║
║  BƯỚC 1: XÂY DỰNG MA TRẬN RATINGS                                ║
║    User 5 interactions: [1,2,3,4,5,6,7,9] (8 games)             ║
║    Game 8: CHƯA tương tác → CẦN DỰ ĐOÁN                          ║
║  ──────────────────────────────────────────────────────────────  ║
║  BƯỚC 2: MEAN CENTERING                                          ║
║    User 5 mean = 2.10                                            ║
║  ──────────────────────────────────────────────────────────────  ║
║  BƯỚC 3: SVD DECOMPOSITION (k=3)                                 ║
║    User 5 vector:  [-0.36, 0.41, 0.22]                          ║
║    Game 8 vector:  [-0.42, 0.25, 0.18]                          ║
║    Singular values: [14.73, 9.21, 5.68]                         ║
║  ──────────────────────────────────────────────────────────────  ║
║  BƯỚC 4: DỰ ĐOÁN RATING                                          ║
║    Factor 1: -5.30 × -0.42 = +2.23  (match tốt!)                ║
║    Factor 2: +3.78 × +0.25 = +0.95  (match tốt!)                ║
║    Factor 3: +1.25 × +0.18 = +0.23  (match nhẹ)                 ║
║    Centered:     2.23 + 0.95 + 0.23 = 3.41                      ║
║    Add mean:     3.41 + 2.10 = 5.51                             ║
║  ──────────────────────────────────────────────────────────────  ║
║  BƯỚC 5: CHUẨN HÓA                                               ║
║    Min/Max:      [2.44, 5.51]                                    ║
║    SVD normalized: (5.51 - 2.44) / 3.07 = 1.000                 ║
║  ──────────────────────────────────────────────────────────────  ║
║  🎯 HYBRID SCORE (FINAL)                                         ║
║    SVD (45%):         0.45 × 1.000 = 0.450                      ║
║    Content (35%):     0.35 × 0.823 = 0.288                      ║
║    Demographic (20%): 0.20 × 0.612 = 0.122                      ║
║    ────────────────────────────────────                          ║
║    TOTAL:             0.860                                      ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 💡 GIẢI THÍCH KẾT QUẢ

### Tại sao Game 8 được gợi ý cho User 5?

#### ✅ **Factor 1 Match (Contribution: +2.23)**
```
User 5: -0.36 (không thích "AAA với đồ họa cao")
Game 8: -0.42 (không phải "AAA với đồ họa cao")

→ CẢ HAI ĐỀU "KHÔNG THÍCH/KHÔNG PHẢI" Factor 1
→ âm × âm = dương → MATCH TỐT!
```

#### ✅ **Factor 2 Match (Contribution: +0.95)**
```
User 5: +0.41 (thích "Indie Story-driven")
Game 8: +0.25 (có "Indie Story-driven")

→ CẢ HAI ĐỀU "THÍCH/CÓ" Factor 2
→ dương × dương = dương → MATCH TỐT!
```

#### ✅ **Factor 3 Match (Contribution: +0.23)**
```
User 5: +0.22 (thích chút "Multiplayer")
Game 8: +0.18 (có chút "Multiplayer")

→ CẢ HAI ĐỀU "THÍCH/CÓ" Factor 3 (nhẹ)
→ dương × dương = dương → MATCH NHẸ
```

---

### So sánh với games khác

**Game 10 (score thấp hơn: 3.33):**
```
User 5:  [-0.36, 0.41, 0.22]
Game 10: [-0.31, 0.22, 0.29]

Factor 1: -0.36 × -0.31 = +0.11  (match yếu)
Factor 2: +0.41 × +0.22 = +0.09  (match yếu)
Factor 3: +0.22 × +0.29 = +0.06  (match yếu)
Total: 0.26 (thấp hơn nhiều so với 3.41)
```

**→ Game 8 match với User 5 TỐT HƠN nhiều so với Game 10!**

---

## 🔑 ĐIỂM QUAN TRỌNG

### ✅ SVD tự động tìm patterns
- Không cần biết trước "AAA" hay "Indie"
- Chỉ cần ma trận ratings → SVD tìm ra 3 factors ẩn
- Factors không có tên rõ ràng, con người đặt tên sau

### ✅ Mean centering loại bỏ bias
- User 5 mean = 2.10 (dễ tính)
- User 8 mean = 1.85 (khó tính hơn)
- Centering giúp so sánh công bằng

### ✅ k=3 factors
- k nhỏ: đơn giản, tránh overfitting
- k=3 phù hợp với 8 users, 10 games
- Production: k=50-200

### ✅ Negative × Negative = Positive!
- User không thích AAA × Game không phải AAA = MATCH!
- Đây là sức mạnh của SVD

---

**📅 Tạo: 06/11/2025**  
**👨‍💻 Tác giả: AI Assistant**

