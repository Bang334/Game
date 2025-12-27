# 🎓 NGUYÊN LÝ TOÁN HỌC ĐẰNG SAU SVD

> **Tài liệu này giải thích TOÁN HỌC và NGUYÊN LÝ đằng sau việc tính các ma trận U, Σ, Vᵀ trong SVD. Tại sao phải tính như vậy? Dựa trên lý thuyết nào?**

---

## 📌 Câu hỏi cốt lõi

**Q1:** Tại sao phải tính **Rᵀ × R** rồi mới tìm eigenvectors?  
**Q2:** Tại sao **Σ = √λ** (căn bậc 2 của eigenvalues)?  
**Q3:** Tại sao **U = R × V × Σ⁻¹** chứ không phải công thức khác?  
**Q4:** Nguyên lý toán học nào đảm bảo SVD hoạt động?

---

## 🧮 PHẦN 1: Định nghĩa SVD (Singular Value Decomposition)

### 1.1. Định nghĩa toán học

**SVD** là phép phân tích ma trận thành tích 3 ma trận:

```
R = U × Σ × Vᵀ
```

Trong đó:
- **R**: Ma trận ban đầu (m × n) - **ĐÃ BIẾT**
- **U**: Ma trận trực giao (m × m hoặc m × k) - **CẦN TÌM**
- **Σ**: Ma trận đường chéo (m × n hoặc k × k) - **CẦN TÌM**
- **Vᵀ**: Ma trận trực giao (n × n hoặc k × n) - **CẦN TÌM**

**Tính chất quan trọng:**
```
Uᵀ × U = I  (ma trận đơn vị)
V × Vᵀ = I  (ma trận đơn vị)
```

→ U và V là **orthonormal matrices** (ma trận trực chuẩn)

---

### 1.2. Tại sao cần SVD?

SVD giúp:
1. **Phân tích cấu trúc** của ma trận
2. **Giảm chiều** (dimensionality reduction)
3. **Tìm patterns ẩn** (latent factors)
4. **Dự đoán missing values** (recommendation systems)

---

## 🔬 PHẦN 2: TẠI SAO TÍNH Vᵀ TỪ Rᵀ×R?

### 2.1. Xuất phát từ định nghĩa SVD

Bắt đầu từ:
```
R = U × Σ × Vᵀ
```

**Nhân cả 2 vế với Rᵀ (transpose của R):**

```
Rᵀ × R = (U × Σ × Vᵀ)ᵀ × (U × Σ × Vᵀ)
```

**Sử dụng tính chất transpose:**
```
(A × B × C)ᵀ = Cᵀ × Bᵀ × Aᵀ
```

Ta có:
```
Rᵀ × R = (Vᵀ)ᵀ × Σᵀ × Uᵀ × U × Σ × Vᵀ
       = V × Σᵀ × Uᵀ × U × Σ × Vᵀ
```

**Vì Uᵀ × U = I (ma trận đơn vị):**
```
Rᵀ × R = V × Σᵀ × I × Σ × Vᵀ
       = V × Σᵀ × Σ × Vᵀ
```

**Vì Σ là ma trận đường chéo, nên Σᵀ = Σ:**
```
Rᵀ × R = V × Σ² × Vᵀ
```

**Viết lại:**
```
(Rᵀ × R) × V = V × Σ²
```

→ **Đây chính là phương trình eigenvalue!**

---

### 2.2. Phương trình Eigenvalue

**Định nghĩa:** Ma trận A có eigenvalue λ và eigenvector v nếu:
```
A × v = λ × v
```

So sánh với:
```
(Rᵀ × R) × V = V × Σ²
```

Ta thấy:
- **A = Rᵀ × R** (ma trận Gram)
- **λ = σ²** (eigenvalue = singular value bình phương)
- **v** là cột của **V** (eigenvector = right singular vector)

**KẾT LUẬN:**
```
┌─────────────────────────────────────────────────────────┐
│ V là eigenvectors của ma trận Rᵀ × R                    │
│ Σ² là eigenvalues của ma trận Rᵀ × R                    │
└─────────────────────────────────────────────────────────┘
```

**Đây là lý do toán học tại sao ta tính Rᵀ × R!**

---

### 2.3. Ví dụ minh họa cụ thể

Giả sử:
```
R = [[3, 1],
     [2, 2],
     [2, 0]]  # (3×2)
```

**Bước 1: Tính Rᵀ × R**

```python
Rᵀ = [[3, 2, 2],
      [1, 2, 0]]  # (2×3)

Rᵀ × R = [[3, 2, 2],  ×  [[3, 1],
          [1, 2, 0]]      [2, 2],
                          [2, 0]]

# Tính từng phần tử:
# (Rᵀ×R)[0,0] = 3×3 + 2×2 + 2×2 = 9 + 4 + 4 = 17
# (Rᵀ×R)[0,1] = 3×1 + 2×2 + 2×0 = 3 + 4 + 0 = 7
# (Rᵀ×R)[1,0] = 1×3 + 2×2 + 0×2 = 3 + 4 + 0 = 7
# (Rᵀ×R)[1,1] = 1×1 + 2×2 + 0×0 = 1 + 4 + 0 = 5

Rᵀ × R = [[17, 7],
          [ 7, 5]]  # (2×2) - Ma trận symmetric!
```

**Bước 2: Tìm eigenvalues của Rᵀ×R**

Giải:
```
det(Rᵀ×R - λI) = 0

|17-λ   7  | = 0
| 7    5-λ |

(17-λ)(5-λ) - 49 = 0
85 - 17λ - 5λ + λ² - 49 = 0
λ² - 22λ + 36 = 0

# Sử dụng công thức nghiệm:
λ = (22 ± √(484 - 144)) / 2
  = (22 ± √340) / 2
  = (22 ± 18.44) / 2

λ₁ = 20.22
λ₂ = 1.78
```

**Bước 3: Tìm eigenvectors**

**Với λ₁ = 20.22:**
```
(Rᵀ×R - 20.22I) × v₁ = 0

[[17-20.22,  7      ],  [v₁₁] = [0]
 [7,         5-20.22]]  [v₁₂]   [0]

[[-3.22,  7    ],  [v₁₁] = [0]
 [ 7,    -15.22]]  [v₁₂]   [0]

# Từ hàng 1: -3.22v₁₁ + 7v₁₂ = 0
# → v₁₂ = 0.46v₁₁

# Chuẩn hóa: v₁₁² + v₁₂² = 1
# v₁₁² + (0.46v₁₁)² = 1
# v₁₁²(1 + 0.21) = 1
# v₁₁ = 0.91, v₁₂ = 0.42

v₁ = [0.91, 0.42]ᵀ
```

**Với λ₂ = 1.78:**
```
# Tương tự, ta có:
v₂ = [-0.42, 0.91]ᵀ
```

**Bước 4: Ma trận V**

```python
V = [v₁, v₂] = [[0.91, -0.42],
                [0.42,  0.91]]
```

**Verify orthogonal:**
```python
Vᵀ × V = [[0.91,  0.42],  ×  [[0.91, -0.42],
          [-0.42, 0.91]]      [0.42,  0.91]]

       = [[1, 0],  # = I ✓
          [0, 1]]
```

→ **V là ma trận trực giao!**

---

## 🔢 PHẦN 3: TẠI SAO Σ = √λ?

### 3.1. Từ định nghĩa

Ta đã có:
```
Rᵀ × R = V × Σ² × Vᵀ
```

**Eigenvalues của Rᵀ×R là λ, và λ = σ²**

Vậy:
```
σ = √λ
```

**Nhưng tại sao lại là căn bậc 2?**

---

### 3.2. Chứng minh từ R = U×Σ×Vᵀ

**Tính ||R × v||² (norm bình phương của R×v):**

Với v là eigenvector của Rᵀ×R:
```
Rᵀ×R × v = λ × v
```

Nhân cả 2 vế trái với vᵀ:
```
vᵀ × Rᵀ×R × v = λ × vᵀ×v
vᵀ × Rᵀ×R × v = λ  (vì ||v|| = 1)
```

**Biến đổi vế trái:**
```
vᵀ × Rᵀ×R × v = (vᵀ × Rᵀ) × (R × v)
                = (R×v)ᵀ × (R×v)
                = ||R×v||²
```

**Vậy:**
```
||R×v||² = λ
||R×v|| = √λ = σ
```

**Ý nghĩa:**
- **σ (singular value)** là độ dài của vector **R×v**
- **λ (eigenvalue)** là bình phương độ dài đó

→ **Đây là lý do σ = √λ!**

---

### 3.3. Ví dụ số học

Từ ví dụ trước:
```
λ₁ = 20.22  →  σ₁ = √20.22 = 4.50
λ₂ = 1.78   →  σ₂ = √1.78  = 1.33

Σ = [[4.50,  0  ],
     [ 0,   1.33]]
```

**Verify bằng ||R×v||:**
```python
R × v₁ = [[3, 1],  ×  [0.91] = [3.15]
          [2, 2],     [0.42]   [2.66]
          [2, 0]]               [1.82]

||R×v₁|| = √(3.15² + 2.66² + 1.82²)
         = √(9.92 + 7.08 + 3.31)
         = √20.31
         = 4.51  ≈ σ₁ ✓
```

---

## 🎯 PHẦN 4: TẠI SAO U = R × V × Σ⁻¹?

### 4.1. Xuất phát từ định nghĩa

Ta cần:
```
R = U × Σ × Vᵀ
```

**Mục tiêu:** Tìm công thức tính U từ R, V, Σ

**Nhân cả 2 vế phải với V:**
```
R × V = U × Σ × Vᵀ × V
```

**Vì Vᵀ × V = I:**
```
R × V = U × Σ × I
R × V = U × Σ
```

**Nhân cả 2 vế phải với Σ⁻¹:**
```
R × V × Σ⁻¹ = U × Σ × Σ⁻¹
R × V × Σ⁻¹ = U × I
R × V × Σ⁻¹ = U
```

**KẾT LUẬN:**
```
┌─────────────────────────────────────────────┐
│ U = R × V × Σ⁻¹                             │
│                                             │
│ Đây là công thức CHÍNH XÁC từ định nghĩa!  │
└─────────────────────────────────────────────┘
```

---

### 4.2. Ý nghĩa hình học

**U = R × V × Σ⁻¹** có thể hiểu là:

1. **V**: Biến đổi không gian (rotation)
2. **R × V**: Ánh xạ V vào không gian của R
3. **Σ⁻¹**: Chuẩn hóa theo singular values

**Hình ảnh trực quan:**

```
     V           R×V         (R×V)×Σ⁻¹ = U
    ───>        ───>           ───>
  [0.91]      [4.10]          [0.91]
  [0.42]      [3.66]    ÷4.5  [0.81]
              [1.82]    ÷4.5  [0.40]

  Right      Scaled        Normalized
  singular   by R          left singular
  vector                   vector
```

---

### 4.3. Ví dụ tính U

Từ ví dụ trước:
```python
R = [[3, 1],
     [2, 2],
     [2, 0]]

V = [[0.91, -0.42],
     [0.42,  0.91]]

Σ⁻¹ = [[1/4.50,   0    ],
       [  0,    1/1.33 ]]
    = [[0.222,  0    ],
       [0,      0.752]]
```

**Tính U = R × V × Σ⁻¹:**

**Bước 1: R × V**
```python
R × V = [[3, 1],  ×  [[0.91, -0.42],
         [2, 2],      [0.42,  0.91]]
         [2, 0]]

# Column 1 của R×V:
# [3×0.91 + 1×0.42,  = [3.15,
#  2×0.91 + 2×0.42,     2.66,
#  2×0.91 + 0×0.42]     1.82]

# Column 2 của R×V:
# [3×(-0.42) + 1×0.91,  = [−0.35,
#  2×(-0.42) + 2×0.91,      0.98,
#  2×(-0.42) + 0×0.91]     -0.84]

R × V = [[3.15, -0.35],
         [2.66,  0.98],
         [1.82, -0.84]]
```

**Bước 2: (R×V) × Σ⁻¹**
```python
(R×V) × Σ⁻¹ = [[3.15, -0.35],  ×  [[0.222,  0    ],
               [2.66,  0.98],      [0,      0.752]]
               [1.82, -0.84]]

# Column 1:
# [3.15 × 0.222,  = [0.70,
#  2.66 × 0.222,     0.59,
#  1.82 × 0.222]     0.40]

# Column 2:
# [-0.35 × 0.752,  = [-0.26,
#   0.98 × 0.752,      0.74,
#  -0.84 × 0.752]     -0.63]

U = [[0.70, -0.26],
     [0.59,  0.74],
     [0.40, -0.63]]
```

**Verify orthogonal:**
```python
Uᵀ × U = [[0.70, 0.59, 0.40],  ×  [[0.70, -0.26],
          [-0.26, 0.74, -0.63]]     [0.59,  0.74],
                                    [0.40, -0.63]]

       = [[0.70² + 0.59² + 0.40²,  ...],
          [...,  0.26² + 0.74² + 0.63²]]

       = [[0.99 ≈ 1,  0.01 ≈ 0],  # ≈ I ✓
          [0.01 ≈ 0,  0.99 ≈ 1]]
```

→ **U là ma trận trực giao (gần đúng do làm tròn)!**

---

## 🔬 PHẦN 5: TẠI SAO CÁCH NÀY HOẠT ĐỘNG?

### 5.1. Định lý cơ sở (Fundamental Theorem)

**Định lý SVD:**

> Mọi ma trận thực R (m×n) đều có thể phân tách thành:
> ```
> R = U × Σ × Vᵀ
> ```
> với U, V là orthogonal và Σ là diagonal.

**Chứng minh tồn tại:**

1. Ma trận **Rᵀ×R** là **symmetric positive semi-definite**
2. Theo Spectral Theorem, Rᵀ×R có eigendecomposition:
   ```
   Rᵀ×R = V × Λ × Vᵀ
   ```
   với Λ = diag(λ₁, λ₂, ..., λₙ), λᵢ ≥ 0

3. Đặt **σᵢ = √λᵢ** và **Σ = diag(σ₁, σ₂, ..., σₙ)**

4. Định nghĩa **U = R × V × Σ⁻¹**

5. Verify:
   ```
   U × Σ × Vᵀ = (R × V × Σ⁻¹) × Σ × Vᵀ
              = R × V × Σ⁻¹ × Σ × Vᵀ
              = R × V × I × Vᵀ
              = R × V × Vᵀ
              = R × I
              = R  ✓
   ```

→ **SVD luôn tồn tại và duy nhất (với singular values khác 0)!**

---

### 5.2. Tại sao phải orthogonal?

**Orthogonal matrices** (Uᵀ×U = I, Vᵀ×V = I) có tính chất:

1. **Bảo toàn độ dài:**
   ```
   ||U×x|| = ||x||  (không thay đổi norm)
   ```

2. **Bảo toàn góc:**
   ```
   cos(θ) giữa U×x và U×y = cos(θ) giữa x và y
   ```

3. **Dễ tính nghịch đảo:**
   ```
   U⁻¹ = Uᵀ  (rất nhanh!)
   ```

**Ứng dụng trong SVD:**
- **V** xoay không gian input (rotation in feature space)
- **Σ** co giãn theo các trục chính (scaling along principal axes)
- **U** xoay không gian output (rotation in user space)

→ **SVD là phân tách "tự nhiên nhất" của ma trận!**

---

### 5.3. Kết nối với PCA (Principal Component Analysis)

**SVD và PCA có mối liên hệ mật thiết:**

**PCA:**
- Tìm directions có variance lớn nhất
- Eigendecomposition của covariance matrix

**SVD:**
- Phân tách ma trận thành 3 thành phần orthogonal
- Singular values = độ lớn của variance

**Mối liên hệ:**
```
Covariance matrix: C = (1/n) × Rᵀ×R

Eigenvalues của C = (1/n) × Eigenvalues của Rᵀ×R
                   = (1/n) × σ²
```

→ **SVD on R ≡ PCA on Rᵀ×R!**

---

## 📊 PHẦN 6: TÓM TẮT CÔNG THỨC VÀ NGUYÊN LÝ

### 6.1. Bảng tổng hợp

| Thành phần | Công thức | Nguyên lý | Tại sao? |
|------------|-----------|-----------|----------|
| **V** | Eigenvectors của **Rᵀ×R** | Spectral Theorem | Rᵀ×R symmetric → có eigendecomposition |
| **λ** | Eigenvalues của **Rᵀ×R** | Phương trình đặc trưng | det(Rᵀ×R - λI) = 0 |
| **Σ** | **σᵢ = √λᵢ** | Định nghĩa singular value | ||R×v||² = λ → ||R×v|| = √λ = σ |
| **U** | **R × V × Σ⁻¹** | Từ R = U×Σ×Vᵀ | Giải U: R×V = U×Σ → U = R×V×Σ⁻¹ |

---

### 6.2. Sơ đồ logic

```
      R (ma trận ban đầu - ĐÃ BIẾT)
      │
      ├─── Tính Rᵀ×R (Gram matrix)
      │    │
      │    ├─── Tìm eigenvalues λᵢ
      │    │    └─→ Giải det(Rᵀ×R - λI) = 0
      │    │
      │    ├─── Tìm eigenvectors vᵢ
      │    │    └─→ Giải (Rᵀ×R - λᵢI)×vᵢ = 0
      │    │
      │    └─── Tạo ma trận V = [v₁, v₂, ..., vₙ]
      │
      ├─── Tính Σ từ λ
      │    └─→ σᵢ = √λᵢ (căn bậc 2)
      │
      └─── Tính U từ R, V, Σ
           └─→ U = R × V × Σ⁻¹
```

---

### 6.3. Ví dụ đầy đủ với số

**Input:**
```
R = [[3, 1],
     [2, 2],
     [2, 0]]
```

**Step 1: Rᵀ×R**
```
Rᵀ×R = [[17, 7],
        [ 7, 5]]
```

**Step 2: Eigenvalues**
```
det(Rᵀ×R - λI) = 0
λ² - 22λ + 36 = 0
→ λ₁ = 20.22, λ₂ = 1.78
```

**Step 3: Eigenvectors**
```
(Rᵀ×R - λᵢI)×vᵢ = 0
→ v₁ = [0.91, 0.42]ᵀ
→ v₂ = [-0.42, 0.91]ᵀ
```

**Step 4: V**
```
V = [[0.91, -0.42],
     [0.42,  0.91]]
```

**Step 5: Σ**
```
σ₁ = √20.22 = 4.50
σ₂ = √1.78  = 1.33

Σ = [[4.50,  0  ],
     [ 0,   1.33]]
```

**Step 6: U**
```
U = R × V × Σ⁻¹

U = [[3, 1],  ×  [[0.91, -0.42],  ×  [[0.222,  0   ],
     [2, 2],      [0.42,  0.91]]      [0,      0.752]]
     [2, 0]]

U = [[0.70, -0.26],
     [0.59,  0.74],
     [0.40, -0.63]]
```

**Verify:**
```
U × Σ × Vᵀ = [[0.70, -0.26],  ×  [[4.50,  0  ],  ×  [[0.91, 0.42],
             [0.59,  0.74],      [ 0,   1.33]]      [-0.42, 0.91]]
             [0.40, -0.63]]

          = [[3.0, 1.0],
             [2.0, 2.0],  ≈ R ✓
             [2.0, 0.0]]
```

---

## 🎓 PHẦN 7: KẾT LUẬN

### 7.1. Câu trả lời cho các câu hỏi ban đầu

**Q1: Tại sao tính Rᵀ×R?**
> **A:** Từ R = U×Σ×Vᵀ → Rᵀ×R = V×Σ²×Vᵀ (eigenvalue equation)

**Q2: Tại sao Σ = √λ?**
> **A:** Vì ||R×v||² = λ → ||R×v|| = √λ = σ (singular value là độ dài)

**Q3: Tại sao U = R×V×Σ⁻¹?**
> **A:** Từ R = U×Σ×Vᵀ, nhân 2 vế với V×Σ⁻¹ → U = R×V×Σ⁻¹

**Q4: Nguyên lý gì đảm bảo SVD hoạt động?**
> **A:** Spectral Theorem: Ma trận symmetric có eigendecomposition với eigenvectors orthogonal

---

### 7.2. Những điểm quan trọng

✅ **SVD không phải "magic"** - nó dựa trên lý thuyết toán học chặt chẽ

✅ **Rᵀ×R** là công cụ để chuyển SVD về bài toán eigenvalue (đã biết cách giải)

✅ **√λ** có ý nghĩa hình học rõ ràng (độ dài của R×v)

✅ **U = R×V×Σ⁻¹** là hệ quả trực tiếp từ định nghĩa R = U×Σ×Vᵀ

✅ **Orthogonality** (Uᵀ×U = I, Vᵀ×V = I) là tính chất tự nhiên từ eigenvectors

---

### 7.3. Ứng dụng thực tế

**Trong Recommendation Systems:**

1. **R**: Ma trận user-game ratings (sparse, nhiều missing values)
2. **U**: User preferences trong latent space
3. **Σ**: Tầm quan trọng của các factors
4. **V**: Game features trong latent space

**Prediction:**
```
rating[user][game] = U[user] @ Σ @ Vᵀ[game]
```

→ SVD "điền vào chỗ trống" bằng cách:
- Tìm patterns ẩn (latent factors)
- Kết hợp preferences của users tương tự
- Generalize từ known ratings sang unknown ratings

---

## 📚 Tài liệu tham khảo

1. **Gilbert Strang** - "Linear Algebra and Its Applications" (Chapter 7: SVD)
2. **Golub & Van Loan** - "Matrix Computations" (Chapter 8: Singular Value Decomposition)
3. **Wikipedia** - Singular Value Decomposition: https://en.wikipedia.org/wiki/Singular_value_decomposition
4. **MIT OpenCourseWare** - 18.06 Linear Algebra (Lecture 29: SVD)

---

**📅 Tạo: 03/11/2025**
**👨‍💻 Tác giả: AI Assistant**

