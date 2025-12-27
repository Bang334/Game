# 📊 HƯỚNG DẪN TÍNH BASE SCORE (Trước khi Boost)

> **Tài liệu này giải thích chi tiết cách hệ thống tính điểm BASE SCORE cho mỗi game trước khi áp dụng Adaptive Boost.**

---

## 📌 Tổng quan

**Base Score** là điểm gợi ý ban đầu được tính bằng cách kết hợp 4 phương pháp AI:

```
Base Score = (SVD Score × W₁) + (Content Score × W₂) + (Demographic Score × W₃) + (Keyword Score × W₄)
```

Trong đó W₁, W₂, W₃, W₄ là các trọng số được điều chỉnh động dựa trên:
- Trạng thái user (cold start hay không)
- Có keyword tìm kiếm hay không
- Hành vi user (behavior analysis)

---

## 🎯 4 Thành phần của Base Score

### 1️⃣ **SVD Score** (Collaborative Filtering)
> Dự đoán rating của user cho game dựa trên patterns từ users tương tự

#### 📐 Nguyên lý hoạt động:

**SVD (Singular Value Decomposition)** là thuật toán **Matrix Factorization** - phân tích ma trận tương tác user-game thành 3 ma trận nhỏ hơn để tìm ra các **hidden patterns** (latent factors).

**Ý tưởng cốt lõi:**
- Nếu User A và User B thích nhiều games giống nhau → họ có "khẩu vị" tương tự
- Nếu User A thích Game X, và User B cũng có khẩu vị tương tự → User B cũng sẽ thích Game X

#### 🔢 Các bước tính toán chi tiết:

##### **Bước 1: Xây dựng ma trận User-Game (Ratings Matrix)**

Ma trận này lưu trữ mức độ tương tác của mỗi user với mỗi game:

```
        Game 1  Game 2  Game 3  Game 4  Game 5
User 1    5.0     3.0     0       4.0     0
User 2    4.0     0       0       5.0     3.0
User 3    0       4.0     3.0     0       5.0
User 4    3.0     5.0     4.0     0       0
```

**Cách tính interaction weight:**

```python
# 1. Wishlist/Favorite (user đã thêm vào danh sách yêu thích)
if game_id in user.favorite_games:
    weight = 3.0  # Default rating cho wishlist

# 2. Purchased (user đã mua và đánh giá)
elif game_id in user.purchased_games:
    weight = user.purchased_games[game_id]  # Rating thực tế (1-5)

# 3. View History (user đã xem)
elif game_id in user.view_history:
    view_count = user.view_history[game_id]
    weight = view_count * 0.5  # Mỗi lần xem = 0.5 điểm
    weight = min(weight, 5.0)  # Giới hạn tối đa 5.0

# 4. Không tương tác
else:
    weight = 0  # Để trống (missing value)
```

**Ví dụ User 123:**
```python
User 123:
- Wishlist: [Game A, Game B]           → [3.0, 3.0]
- Purchased: {Game C: 4, Game D: 5}    → [4.0, 5.0]
- Views: {Game E: 3 lần, Game F: 7 lần} → [1.5, 3.5]

# Ma trận cho User 123:
ratings_matrix[123] = [3.0, 3.0, 4.0, 5.0, 1.5, 3.5, 0, 0, ...]
```

---

##### **Bước 2: SVD Decomposition (Phân tích ma trận)**

SVD phân tách ma trận **R** (m users × n games) thành 3 ma trận:

```
R ≈ U × Σ × Vᵀ
```

Trong đó:
- **U**: Ma trận User-Factor (m users × k factors)
  - Mỗi hàng = vector đặc trưng của 1 user
  - Ví dụ: User 123 = [0.23, -0.15, 0.87, ...] (k factors)
  
- **Σ**: Ma trận Singular Values (k × k)
  - Ma trận đường chéo chứa các giá trị singular (đo "tầm quan trọng" của mỗi factor)
  
- **Vᵀ**: Ma trận Game-Factor (k factors × n games)
  - Mỗi cột = vector đặc trưng của 1 game
  - Ví dụ: Game X = [0.45, 0.32, -0.18, ...] (k factors)

**Minh họa:**

```
        [User Factors]    [Importance]   [Game Factors]
R   =        U         ×       Σ       ×       Vᵀ

(m×n)      (m×k)            (k×k)           (k×n)

[5 3 ?]   [0.2 0.1]   [3.5  0 ]   [0.4 0.3 0.5]
[4 0 5] = [0.3 0.2] × [ 0  2.1] × [0.1 0.2 0.4]
[0 4 3]   [0.1 0.3]
```

**k là số factors (latent dimensions):**
- Thường chọn k = 50-200
- k nhỏ → model đơn giản, ít overfitting
- k lớn → model phức tạp, capture nhiều patterns

---

##### **🎯 K là gì? Và cách chọn K tối ưu**

###### **1. K (Number of Latent Factors) là gì?**

**K** là số chiều ẩn (hidden dimensions) mà SVD sử dụng để biểu diễn user và game preferences.

**Ví dụ trực quan:**

Thay vì lưu toàn bộ ma trận ratings (có thể rất lớn và thưa):
```
Ma trận R: 10,000 users × 50,000 games = 500 triệu giá trị
```

SVD nén thành 3 ma trận nhỏ hơn với k factors:
```
U: 10,000 × k
Σ: k × k
Vt: k × 50,000

Tổng: 10,000k + k² + 50,000k = 60,000k + k²

Nếu k=100:
- Full matrix: 500,000,000 values
- SVD: 6,010,000 values → Giảm 99%!
```

**K đại diện cho:**
- Factor 1: "Action games with good graphics"
- Factor 2: "Casual indie games"
- Factor 3: "Multiplayer competitive games"
- Factor 4: "Story-driven RPGs"
- ...
- Factor k: "Less important pattern"

---

###### **2. Tác động của K đến model**

**Quan hệ giữa K và độ phức tạp:**

```
K nhỏ (10-30)
├─ ✅ Model đơn giản, generalize tốt
├─ ✅ Training nhanh
├─ ✅ Ít overfitting
├─ ⚠️ Bỏ qua nhiều patterns phức tạp
└─ ⚠️ Có thể underfitting

K trung bình (50-150) ⭐ RECOMMENDED
├─ ✅ Cân bằng tốt
├─ ✅ Capture đủ patterns quan trọng
├─ ✅ Vẫn generalize tốt
└─ ✅ Phù hợp với hầu hết datasets

K lớn (200-500)
├─ ✅ Capture mọi patterns, kể cả nhỏ
├─ ⚠️ Training chậm
├─ ⚠️ Dễ overfitting (ghi nhớ noise)
└─ ⚠️ Cần nhiều data
```

**Minh họa với ví dụ:**

```python
# Dataset: 1000 users, 5000 games, 50,000 ratings

# K = 10 (quá nhỏ)
Train RMSE: 0.95  # Không fit tốt data
Test RMSE:  0.98  # Cũng không tốt
→ UNDERFITTING: Model quá đơn giản

# K = 100 (tối ưu) ⭐
Train RMSE: 0.72
Test RMSE:  0.76
→ GOOD FIT: Generalize tốt

# K = 500 (quá lớn)
Train RMSE: 0.45  # Fit rất tốt training data
Test RMSE:  1.12  # Tệ trên test data
→ OVERFITTING: Ghi nhớ noise
```

---

###### **3. Các phương pháp chọn K**

**Phương pháp 1: Cross-Validation (Khuyến nghị) ⭐**

```python
from sklearn.model_selection import KFold
import numpy as np

def find_optimal_k(ratings_matrix, k_values=[20, 50, 100, 150, 200]):
    """
    Tìm k tối ưu bằng 5-fold cross-validation
    """
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    results = {}
    
    for k in k_values:
        rmse_scores = []
        
        for train_idx, test_idx in kf.split(ratings_matrix):
            # Split data
            train_data = ratings_matrix[train_idx]
            test_data = ratings_matrix[test_idx]
            
            # Train SVD
            U, sigma, Vt = svds(train_data, k=k)
            
            # Predict on test set
            predictions = U @ np.diag(sigma) @ Vt
            
            # Calculate RMSE
            rmse = np.sqrt(np.mean((test_data - predictions) ** 2))
            rmse_scores.append(rmse)
        
        # Average RMSE across folds
        results[k] = {
            'mean_rmse': np.mean(rmse_scores),
            'std_rmse': np.std(rmse_scores)
        }
        
        print(f"k={k}: RMSE = {results[k]['mean_rmse']:.4f} ± {results[k]['std_rmse']:.4f}")
    
    # Chọn k có RMSE thấp nhất
    best_k = min(results, key=lambda k: results[k]['mean_rmse'])
    print(f"\n🎯 Best k: {best_k}")
    
    return best_k, results

# Sử dụng
best_k, cv_results = find_optimal_k(ratings_matrix)
```

**Kết quả ví dụ:**
```
k=20:  RMSE = 0.9234 ± 0.0156
k=50:  RMSE = 0.8123 ± 0.0142
k=100: RMSE = 0.7645 ± 0.0128  ← Best!
k=150: RMSE = 0.7689 ± 0.0151
k=200: RMSE = 0.7823 ± 0.0198

🎯 Best k: 100
```

---

**Phương pháp 2: Explained Variance**

```python
def analyze_variance(ratings_matrix, max_k=200):
    """
    Phân tích % variance explained bởi các factors
    """
    # Full SVD (lấy tất cả factors)
    U, sigma, Vt = svds(ratings_matrix, k=min(max_k, min(ratings_matrix.shape)-1))
    
    # Tính % variance explained
    total_variance = np.sum(sigma ** 2)
    explained_variance = []
    cumulative_variance = []
    
    cum_sum = 0
    for i, s in enumerate(sorted(sigma, reverse=True)):
        variance = (s ** 2) / total_variance * 100
        cum_sum += variance
        explained_variance.append(variance)
        cumulative_variance.append(cum_sum)
    
    # Plot
    import matplotlib.pyplot as plt
    
    plt.figure(figsize=(12, 5))
    
    # Subplot 1: Individual variance
    plt.subplot(1, 2, 1)
    plt.bar(range(1, len(explained_variance)+1), explained_variance)
    plt.xlabel('Factor')
    plt.ylabel('% Variance Explained')
    plt.title('Variance by Factor')
    
    # Subplot 2: Cumulative variance
    plt.subplot(1, 2, 2)
    plt.plot(range(1, len(cumulative_variance)+1), cumulative_variance)
    plt.axhline(y=80, color='r', linestyle='--', label='80% threshold')
    plt.axhline(y=90, color='g', linestyle='--', label='90% threshold')
    plt.xlabel('Number of Factors (k)')
    plt.ylabel('Cumulative % Variance')
    plt.title('Cumulative Variance Explained')
    plt.legend()
    
    plt.tight_layout()
    plt.show()
    
    # Tìm k để đạt 80% và 90% variance
    k_80 = next(i+1 for i, v in enumerate(cumulative_variance) if v >= 80)
    k_90 = next(i+1 for i, v in enumerate(cumulative_variance) if v >= 90)
    
    print(f"k for 80% variance: {k_80}")
    print(f"k for 90% variance: {k_90}")
    
    return k_80, k_90

# Sử dụng
k_80, k_90 = analyze_variance(ratings_matrix)
```

**Kết quả ví dụ:**
```
Factor 1: 12.3% variance
Factor 2: 8.7% variance
Factor 3: 6.2% variance
...
Factor 67: 0.5% variance
...
Factor 123: 0.1% variance

k for 80% variance: 67  ← Chọn k này nếu muốn hiệu quả
k for 90% variance: 123 ← Chọn k này nếu muốn đầy đủ hơn
```

**Rule of thumb:**
- Chọn k để đạt **80-90% cumulative variance**
- Nếu k quá lớn (>200), giữ nguyên 200

---

**Phương pháp 3: Elbow Method**

```python
def elbow_method(ratings_matrix, k_range=range(10, 201, 10)):
    """
    Vẽ đồ thị RMSE vs K để tìm "elbow point"
    """
    train_rmse = []
    test_rmse = []
    
    # Split train/test
    from sklearn.model_selection import train_test_split
    train_data, test_data = train_test_split(
        ratings_matrix, test_size=0.2, random_state=42
    )
    
    for k in k_range:
        # Train
        U, sigma, Vt = svds(train_data, k=k)
        
        # Evaluate
        train_pred = U @ np.diag(sigma) @ Vt
        train_rmse.append(np.sqrt(np.mean((train_data - train_pred) ** 2)))
        
        test_pred = U @ np.diag(sigma) @ Vt
        test_rmse.append(np.sqrt(np.mean((test_data - test_pred) ** 2)))
    
    # Plot
    import matplotlib.pyplot as plt
    plt.figure(figsize=(10, 6))
    plt.plot(k_range, train_rmse, 'o-', label='Train RMSE')
    plt.plot(k_range, test_rmse, 's-', label='Test RMSE')
    plt.xlabel('k (Number of Factors)')
    plt.ylabel('RMSE')
    plt.title('Elbow Method for Optimal k')
    plt.legend()
    plt.grid(True)
    plt.show()
    
    # Tìm elbow point (điểm test RMSE bắt đầu tăng)
    min_idx = np.argmin(test_rmse)
    optimal_k = list(k_range)[min_idx]
    
    print(f"🎯 Optimal k: {optimal_k}")
    return optimal_k

# Sử dụng
optimal_k = elbow_method(ratings_matrix)
```

**Đồ thị ví dụ:**
```
RMSE
 1.2 |                              Test ●─────●───●
     |                           ●/              
 1.0 |                      ●/                    
     |                  ●/                        
 0.8 |          ●───●/  ← Elbow (k≈100)          
     |      ●/                                    
 0.6 | ●──●  Train                               
     |_____________________________________________
       10   30   50  100  150  200  250  k

→ Chọn k=100 (điểm test RMSE thấp nhất trước khi tăng)
```

---

###### **4. Quy tắc chọn K dựa trên kích thước dataset**

**Rule of Thumb:**

```python
def estimate_k(n_users, n_games, n_ratings):
    """
    Ước lượng k phù hợp dựa trên dataset size
    """
    # Sparsity
    sparsity = 1 - (n_ratings / (n_users * n_games))
    
    # Quy tắc cơ bản
    if n_ratings < 10000:
        k = 20  # Dataset nhỏ
    elif n_ratings < 100000:
        k = 50  # Dataset trung bình
    elif n_ratings < 1000000:
        k = 100  # Dataset lớn
    else:
        k = 150  # Dataset rất lớn
    
    # Điều chỉnh theo sparsity
    if sparsity > 0.99:  # Rất thưa (>99%)
        k = int(k * 0.7)  # Giảm k
    elif sparsity < 0.95:  # Ít thưa hơn
        k = int(k * 1.3)  # Tăng k
    
    # Giới hạn
    k = max(10, min(k, 200))
    
    print(f"Dataset: {n_users} users, {n_games} games, {n_ratings} ratings")
    print(f"Sparsity: {sparsity*100:.2f}%")
    print(f"Recommended k: {k}")
    
    return k

# Ví dụ
k = estimate_k(n_users=5000, n_games=10000, n_ratings=250000)
# Output:
# Dataset: 5000 users, 10000 games, 250000 ratings
# Sparsity: 99.50%
# Recommended k: 70
```

**Bảng tham khảo:**

| Dataset Size | Sparsity | Recommended k | Ví dụ |
|--------------|----------|---------------|-------|
| < 10K ratings | > 99.5% | **20-30** | Startup mới |
| 10K - 100K | 99-99.5% | **40-60** | Small business |
| 100K - 1M | 98-99% | **80-120** | Medium platform |
| 1M - 10M | 95-98% | **120-180** | Large platform (Netflix) |
| > 10M | < 95% | **150-200** | Very large (YouTube) |

---

###### **5. Trade-offs khi chọn K**

| Yếu tố | K nhỏ (20-50) | K trung bình (80-120) ⭐ | K lớn (150-200) |
|--------|---------------|-------------------------|-----------------|
| **Training time** | ⚡ Rất nhanh (1-2 phút) | ⚡ Nhanh (5-10 phút) | 🐌 Chậm (20-30 phút) |
| **Memory usage** | 💾 Thấp (100 MB) | 💾 Trung bình (500 MB) | 💾 Cao (2 GB) |
| **Accuracy** | ⚠️ Thấp (RMSE ~0.9) | ✅ Cao (RMSE ~0.75) | ✅ Rất cao (RMSE ~0.72) |
| **Overfitting risk** | ✅ Thấp | ✅ Thấp | ⚠️ Cao |
| **Generalization** | ✅ Tốt | ✅ Rất tốt | ⚠️ Có thể tệ |
| **Cold start handling** | ✅ Tốt | ✅ Khá tốt | ⚠️ Tệ hơn |

**Khuyến nghị:**
```
🎯 Start with k=100
   ↓
   Test với cross-validation
   ↓
   ├─ RMSE tốt → Keep k=100
   ├─ Underfitting → Tăng k lên 150-200
   └─ Overfitting → Giảm k xuống 50-80
```

---

###### **6. Code tổng hợp: Tự động chọn k tối ưu**

```python
import numpy as np
from scipy.sparse.linalg import svds
from sklearn.model_selection import train_test_split

def auto_select_k(ratings_matrix, k_candidates=[50, 80, 100, 120, 150]):
    """
    Tự động chọn k tối ưu bằng validation set
    """
    print("🔍 Finding optimal k...")
    print("=" * 60)
    
    # Split data: 70% train, 15% validation, 15% test
    train_val, test = train_test_split(ratings_matrix, test_size=0.15, random_state=42)
    train, val = train_test_split(train_val, test_size=0.176, random_state=42)  # 0.176 ≈ 15/85
    
    best_k = None
    best_rmse = float('inf')
    results = []
    
    for k in k_candidates:
        # Train SVD
        U, sigma, Vt = svds(train, k=k)
        
        # Predict on validation
        val_pred = U @ np.diag(sigma) @ Vt
        val_rmse = np.sqrt(np.mean((val - val_pred) ** 2))
        
        # Also compute train RMSE to check overfitting
        train_pred = U @ np.diag(sigma) @ Vt
        train_rmse = np.sqrt(np.mean((train - train_pred) ** 2))
        
        results.append({
            'k': k,
            'train_rmse': train_rmse,
            'val_rmse': val_rmse,
            'overfitting': val_rmse - train_rmse
        })
        
        print(f"k={k:3d} | Train RMSE: {train_rmse:.4f} | Val RMSE: {val_rmse:.4f} | Gap: {val_rmse-train_rmse:.4f}")
        
        if val_rmse < best_rmse:
            best_rmse = val_rmse
            best_k = k
    
    print("=" * 60)
    print(f"🎯 Best k: {best_k} (Val RMSE: {best_rmse:.4f})")
    
    # Final evaluation on test set
    U, sigma, Vt = svds(train_val, k=best_k)
    test_pred = U @ np.diag(sigma) @ Vt
    test_rmse = np.sqrt(np.mean((test - test_pred) ** 2))
    
    print(f"📊 Test RMSE with k={best_k}: {test_rmse:.4f}")
    
    return best_k, results

# Sử dụng
best_k, results = auto_select_k(ratings_matrix)
```

**Output ví dụ:**
```
🔍 Finding optimal k...
============================================================
k= 50 | Train RMSE: 0.8234 | Val RMSE: 0.8567 | Gap: 0.0333
k= 80 | Train RMSE: 0.7756 | Val RMSE: 0.7989 | Gap: 0.0233
k=100 | Train RMSE: 0.7423 | Val RMSE: 0.7645 | Gap: 0.0222 ← Best
k=120 | Train RMSE: 0.7312 | Val RMSE: 0.7698 | Gap: 0.0386
k=150 | Train RMSE: 0.7089 | Val RMSE: 0.7823 | Gap: 0.0734 ← Overfitting!
============================================================
🎯 Best k: 100 (Val RMSE: 0.7645)
📊 Test RMSE with k=100: 0.7701
```

---

###### **7. Tóm tắt: Checklist chọn K**

✅ **Quick Start (không có thời gian tune):**
```python
k = 100  # Default an toàn cho hầu hết trường hợp
```

✅ **Có thời gian tune (khuyến nghị):**
```python
# 1. Estimate dựa trên dataset
k_estimate = estimate_k(n_users, n_games, n_ratings)

# 2. Cross-validation
k_optimal = auto_select_k(ratings_matrix, 
                          k_candidates=[k_estimate-20, k_estimate, k_estimate+20])

# 3. Validate
# - Check train/val RMSE gap < 0.05 (không overfitting)
# - Check test RMSE acceptable
```

✅ **Production:**
```python
# Monitor và re-tune k định kỳ (3-6 tháng)
# Khi dataset tăng → có thể tăng k
```

---

##### **🔬 Chi tiết: Cách tính ma trận U, Σ, Vᵀ**

**SVD là thuật toán toán học thuần túy**, không cần training như Neural Networks. Các bước tính:

###### **1. Thuật toán SVD (Linear Algebra)**

```python
import numpy as np
from scipy.sparse.linalg import svds

# Ma trận ratings (m users × n games)
R = np.array([
    [5, 3, 0, 4, 0],  # User 1
    [4, 0, 0, 5, 3],  # User 2
    [0, 4, 3, 0, 5],  # User 3
    [3, 5, 4, 0, 0],  # User 4
])

# Thực hiện SVD với k factors
k = 2  # Số latent factors
U, sigma, Vt = svds(R, k=k)

# Kết quả:
# U: (4 users × 2 factors)
# sigma: (2,) - array 1D chứa singular values
# Vt: (2 factors × 5 games)
```

**Output ví dụ:**
```python
U = [
    [-0.58, -0.15],  # User 1 preferences
    [-0.45, -0.32],  # User 2 preferences
    [-0.41,  0.61],  # User 3 preferences
    [-0.54,  0.70],  # User 4 preferences
]

sigma = [9.72, 5.22]  # Importance of factors

Vt = [
    [-0.46, -0.38, -0.30, -0.43, -0.32],  # Factor 1
    [ 0.14, -0.52, -0.72,  0.19, -0.39],  # Factor 2
]
```

###### **2. Giải thích từng ma trận**

**Ma trận U (User-Factor):**

Mỗi hàng đại diện cho "khẩu vị ẩn" của user:

```
User 1: [-0.58, -0.15]
         ↓       ↓
    Factor 1  Factor 2
    
Giải thích:
- Factor 1 = -0.58 (cao): User thích "action games với đồ họa đẹp"
- Factor 2 = -0.15 (thấp): User ít quan tâm "indie games"
```

**Ma trận Σ (Singular Values):**

Đo "tầm quan trọng" của mỗi factor:

```
sigma = [9.72, 5.22]
         ↓     ↓
    Factor 1: Quan trọng nhất (giải thích 65% variance)
    Factor 2: Ít quan trọng hơn (giải thích 35% variance)
```

Công thức tính % variance explained:
```python
variance_explained = sigma[i]² / sum(sigma²)
# Factor 1: 9.72² / (9.72² + 5.22²) = 94.4 / 121.7 = 77.6%
# Factor 2: 5.22² / (9.72² + 5.22²) = 27.2 / 121.7 = 22.4%
```

**Ma trận Vᵀ (Game-Factor):**

Mỗi cột đại diện cho "đặc trưng ẩn" của game:

```
Game 1: [-0.46, 0.14]
          ↓      ↓
     Factor 1  Factor 2

Giải thích:
- Factor 1 = -0.46: Game có "action + graphics" cao
- Factor 2 = 0.14: Game có chút "indie style"
```

###### **3. Quá trình tính toán bên trong SVD**

SVD có thể được tính bằng **2 cách**:

---

##### **CÁCH 1: Thuật toán toán học chính xác (Mathematical SVD)**

Đây là cách SVD "thật" trong Linear Algebra, tính **exact decomposition**.

**🔢 Các bước toán học:**

**Bước 1: Tính ma trận Rᵀ×R (Gram matrix)**

```
A = Rᵀ × R
```

Với R là ma trận (m × n):
```python
# R: 4 users × 5 games
R = [[5, 3, 0, 4, 0],
     [4, 0, 0, 5, 3],
     [0, 4, 3, 0, 5],
     [3, 5, 4, 0, 0]]

# Rᵀ: 5 games × 4 users (transpose)
Rᵀ = [[5, 4, 0, 3],
      [3, 0, 4, 5],
      [0, 0, 3, 4],
      [4, 5, 0, 0],
      [0, 3, 5, 0]]

# A = Rᵀ × R (5×4 × 4×5 = 5×5)
A = [[50, 27, 12, 35,  9],
     [27, 50, 20,  0, 25],
     [12, 20, 25,  0, 20],
     [35,  0,  0, 41,  0],
     [ 9, 25, 20,  0, 34]]
```

**Bước 2: Tìm eigenvalues và eigenvectors của A**

Ma trận A là **symmetric positive semi-definite** → có eigenvalues thực, eigenvectors trực giao.

```
A × v = λ × v
```

Giải phương trình đặc trưng:
```
det(A - λI) = 0
```

**Chi tiết tính toán:**

```python
# Công thức: (A - λI) × v = 0

# 1. Tìm eigenvalues λ bằng cách giải:
|A - λI| = 0

# Ví dụ với ma trận 2×2 đơn giản:
A = [[5, 2],
     [2, 3]]

# Det:
|5-λ   2  | = (5-λ)(3-λ) - 4 = 0
| 2   3-λ | 

λ² - 8λ + 11 = 0
λ₁ = 6.24, λ₂ = 1.76

# 2. Với mỗi λ, tìm eigenvector v:
(A - λI) × v = 0

# Với λ₁ = 6.24:
[[5-6.24,  2    ], [v₁] = [0]
 [2,      3-6.24]] [v₂]   [0]

[[-1.24,  2   ], [v₁] = [0]
 [ 2,    -3.24]] [v₂]   [0]

# Giải hệ:
-1.24v₁ + 2v₂ = 0
v₂ = 0.62v₁

# Chuẩn hóa (||v|| = 1):
v₁² + v₂² = 1
v₁² + (0.62v₁)² = 1
v₁ = 0.85, v₂ = 0.53

# Eigenvector 1: [0.85, 0.53]
```

Với ma trận 5×5 ở trên, ta có:
```python
# Eigenvalues (sorted descending):
λ₁ = 121.5
λ₂ = 45.8
λ₃ = 23.1
λ₄ = 8.6
λ₅ = 1.0

# Eigenvectors (5×5 matrix V):
V = [[ 0.52, -0.31,  0.68, -0.38,  0.15],
     [ 0.48, -0.45, -0.39,  0.61,  0.17],
     [ 0.39,  0.28, -0.58, -0.64, -0.12],
     [ 0.45,  0.71,  0.11,  0.15, -0.52],
     [ 0.38, -0.34,  0.23,  0.32,  0.81]]
```

**Bước 3: Tính singular values (Σ)**

```
σᵢ = √λᵢ
```

```python
# Từ eigenvalues → singular values
σ₁ = √121.5 = 11.02
σ₂ = √45.8  = 6.77
σ₃ = √23.1  = 4.81
σ₄ = √8.6   = 2.93
σ₅ = √1.0   = 1.00

# Ma trận Σ (diagonal):
Σ = [[11.02,  0,     0,     0,     0   ],
     [ 0,     6.77,  0,     0,     0   ],
     [ 0,     0,     4.81,  0,     0   ],
     [ 0,     0,     0,     2.93,  0   ],
     [ 0,     0,     0,     0,     1.00]]
```

**Bước 4: Tính ma trận Vᵀ**

Ma trận V từ eigenvectors chính là Vᵀ (sau khi truncate k factors):

```python
# Lấy k=3 factors quan trọng nhất
Vᵀ = V[:k, :]  # (3 × 5)

Vᵀ = [[ 0.52, -0.31,  0.68, -0.38,  0.15],
      [ 0.48, -0.45, -0.39,  0.61,  0.17],
      [ 0.39,  0.28, -0.58, -0.64, -0.12]]
```

**Bước 5: Tính ma trận U**

```
U = R × V × Σ⁻¹
```

```python
# V: eigenvectors (5×3)
# Σ⁻¹: inverse singular values (3×3)
Σ_inv = [[1/11.02,  0,        0      ],
         [0,        1/6.77,   0      ],
         [0,        0,        1/4.81 ]]

# U = R × V × Σ⁻¹
U = [[5, 3, 0, 4, 0],     [[ 0.52,  0.48,  0.39],     [[0.091,  0,      0    ],
     [4, 0, 0, 5, 3],   ×   [-0.31, -0.45,  0.28],  ×   [0,      0.148,  0    ],
     [0, 4, 3, 0, 5],       [ 0.68, -0.39, -0.58],      [0,      0,      0.208]]
     [3, 5, 4, 0, 0]]       [-0.38,  0.61, -0.64],
                            [ 0.15,  0.17, -0.12]]

# Kết quả (4 users × 3 factors):
U = [[-0.58, -0.15,  0.34],
     [-0.45, -0.32, -0.61],
     [-0.41,  0.61,  0.58],
     [-0.54,  0.70, -0.23]]
```

**Tóm tắt công thức:**

```
1. A = Rᵀ × R                    (Gram matrix)
2. A × v = λ × v                 (Eigenvalue problem)
3. σᵢ = √λᵢ                      (Singular values)
4. Vᵀ = eigenvectors(A)ᵀ        (Right singular vectors)
5. U = R × V × Σ⁻¹              (Left singular vectors)
```

---

##### **CÁCH 2: Alternating Least Squares (ALS) - Approximate SVD**

Đây là phương pháp **iterative approximation**, thường dùng cho ma trận lớn và sparse.

**🔄 Ý tưởng:**

Thay vì giải exact eigenvalue problem (tốn kém với ma trận lớn), ta:
1. Khởi tạo U, Σ, Vt ngẫu nhiên
2. Lặp lại: fix 2 ma trận, tối ưu 1 ma trận
3. Dừng khi error đủ nhỏ

**Bước 1: Khởi tạo ngẫu nhiên**

```python
import numpy as np

# Ma trận R: m users × n games
m, n = 4, 5
k = 3  # Number of factors

# Random initialization
np.random.seed(42)
U = np.random.randn(m, k) * 0.1   # (4×3)
sigma = np.ones(k)                 # (3,)
Vt = np.random.randn(k, n) * 0.1  # (3×5)

# Ví dụ:
U = [[ 0.05,  0.04, -0.02],
     [ 0.09,  0.02,  0.05],
     [-0.01,  0.04,  0.03],
     [ 0.08, -0.03,  0.01]]

Vt = [[ 0.04,  0.08, -0.05,  0.02,  0.06],
      [-0.03,  0.02,  0.07, -0.04,  0.01],
      [ 0.06, -0.01,  0.03,  0.05, -0.02]]
```

**Bước 2: Alternating optimization**

Lặp lại cho đến khi hội tụ:

```python
for iteration in range(max_iterations):
    # === Sub-step A: Fix Vt và Σ, tối ưu U ===
    for i in range(m):  # Mỗi user
        # Minimize: ||Rᵢ - uᵢ @ Σ @ Vt||²
        # 
        # Giải: uᵢ = Rᵢ @ Vt.T @ Σ⁻¹ @ (Vt @ Vt.T + λI)⁻¹
        
        # 1. Lấy ratings của user i
        Ri = R[i, :]  # (1×5)
        
        # 2. Tính A = Vt @ Vt.T + λI
        A = Vt @ Vt.T + lambda_reg * np.eye(k)
        # A shape: (k×k)
        
        # 3. Tính b = Ri @ Vt.T @ diag(sigma)
        b = Ri @ Vt.T @ np.diag(sigma)
        # b shape: (1×k)
        
        # 4. Giải hệ: A @ ui = b
        U[i, :] = np.linalg.solve(A, b)
    
    # === Sub-step B: Fix U và Σ, tối ưu Vt ===
    for j in range(n):  # Mỗi game
        # Minimize: ||Rⱼ - U @ Σ @ vtⱼ||²
        
        # 1. Lấy ratings của game j
        Rj = R[:, j]  # (m×1)
        
        # 2. Tính A = U.T @ U @ diag(sigma²) + λI
        A = U.T @ U @ np.diag(sigma**2) + lambda_reg * np.eye(k)
        
        # 3. Tính b = U.T @ diag(sigma) @ Rj
        b = U.T @ np.diag(sigma) @ Rj
        
        # 4. Giải hệ: A @ vtj = b
        Vt[:, j] = np.linalg.solve(A, b)
    
    # === Sub-step C: Fix U và Vt, tối ưu Σ ===
    for f in range(k):  # Mỗi factor
        # Tính optimal sigma[f]
        numerator = 0
        denominator = 0
        
        for i in range(m):
            for j in range(n):
                if R[i, j] != 0:  # Chỉ tính với known ratings
                    # Predicted contribution của factor f
                    pred_f = U[i, f] * Vt[f, j]
                    
                    # Residual (không tính factor f)
                    residual = R[i, j]
                    for f2 in range(k):
                        if f2 != f:
                            residual -= sigma[f2] * U[i, f2] * Vt[f2, j]
                    
                    numerator += pred_f * residual
                    denominator += pred_f ** 2
        
        sigma[f] = numerator / (denominator + 1e-10)
    
    # === Tính error để check convergence ===
    R_pred = U @ np.diag(sigma) @ Vt
    error = np.sqrt(np.mean((R - R_pred) ** 2))
    
    print(f"Iteration {iteration}: RMSE = {error:.4f}")
    
    # Kiểm tra hội tụ
    if iteration > 0 and abs(prev_error - error) < threshold:
        print(f"Converged after {iteration} iterations")
        break
    
    prev_error = error
```

**Minh họa chi tiết 1 iteration:**

**Iteration 1:**

```python
# Initial (random):
U = [[ 0.05,  0.04, -0.02],
     [ 0.09,  0.02,  0.05],
     [-0.01,  0.04,  0.03],
     [ 0.08, -0.03,  0.01]]

sigma = [1.0, 1.0, 1.0]

Vt = [[ 0.04,  0.08, -0.05,  0.02,  0.06],
      [-0.03,  0.02,  0.07, -0.04,  0.01],
      [ 0.06, -0.01,  0.03,  0.05, -0.02]]

# Predicted:
R_pred = U @ diag(sigma) @ Vt
R_pred = [[0.01, 0.01, 0.00, ...],  # Rất sai!
          [0.00, 0.01, 0.01, ...],
          ...]

RMSE = 3.47  # Cao
```

**Update U (user 0):**

```python
# User 0: R[0] = [5, 3, 0, 4, 0]

# A = Vt @ Vt.T + 0.01*I
A = [[0.014, -0.001,  0.003],
     [-0.001, 0.006,  -0.002],
     [ 0.003, -0.002, 0.010]]

# b = R[0] @ Vt.T @ diag(sigma)
b = [5, 3, 0, 4, 0] @ Vt.T @ [1, 1, 1]
b = [0.46, 0.18, 0.31]

# Solve: A @ u = b
U[0] = [34.12, 15.67, 28.43]  # Giá trị mới!
```

**Sau nhiều iterations:**

```python
# Iteration 50 (converged):
U = [[-0.58, -0.15,  0.34],
     [-0.45, -0.32, -0.61],
     [-0.41,  0.61,  0.58],
     [-0.54,  0.70, -0.23]]

sigma = [11.02, 6.77, 4.81]

Vt = [[ 0.52, -0.31,  0.68, -0.38,  0.15],
      [ 0.48, -0.45, -0.39,  0.61,  0.17],
      [ 0.39,  0.28, -0.58, -0.64, -0.12]]

RMSE = 0.021  # Rất nhỏ → Hội tụ!
```

**Tóm tắt ALS:**

```
1. Initialize: U, Σ, Vt ~ random
2. Repeat until convergence:
   a. Fix Vt, Σ → Optimize U (solve least squares for each user)
   b. Fix U, Σ → Optimize Vt (solve least squares for each game)
   c. Fix U, Vt → Optimize Σ (closed-form update)
3. Check RMSE → stop if change < threshold
```

---

##### **So sánh 2 cách:**

| Tiêu chí | Mathematical SVD | ALS Approximate |
|----------|------------------|-----------------|
| **Chính xác** | ✅ Exact decomposition | ⚠️ Approximate |
| **Tốc độ** | 🐌 Chậm (O(mn²) hoặc O(m²n)) | ⚡ Nhanh hơn với sparse matrix |
| **Ma trận lớn** | ⚠️ Không khả thi (10K×10K+) | ✅ Xử lý được (1M×1M+) |
| **Sparse matrix** | ⚠️ Phải fill 0s | ✅ Chỉ tính known ratings |
| **Regularization** | ❌ Không có | ✅ Có λ để tránh overfitting |
| **Thư viện** | `numpy.linalg.svd` | `scipy.sparse.linalg.svds` |

**Khi nào dùng cách nào?**

```
Mathematical SVD:
- Ma trận nhỏ (< 1000×1000)
- Cần exact decomposition
- Dense matrix

ALS Approximate:
- Ma trận lớn (> 10K×10K)  ← Recommendation systems
- Sparse matrix (99% zeros)
- Cần regularization
- Muốn tốc độ
```

###### **4. Ví dụ minh họa từng bước**

**Input:**
```python
R = [[5, 3, 0],
     [4, 0, 5],
     [0, 4, 3]]
k = 2
```

**Iteration 1:**
```python
# Random init
U = [[0.1, 0.2],
     [0.3, 0.1],
     [0.2, 0.3]]

Vt = [[0.4, 0.2, 0.3],
      [0.1, 0.5, 0.2]]

# Compute error
R_predicted = U @ Σ @ Vt
error = ||R - R_predicted||² = 25.3
```

**Iteration 2:**
```python
# Update U (fix Vt)
U = [[-0.52, -0.18],
     [-0.41, -0.29],
     [-0.38,  0.58]]

# Update Vt (fix U)
Vt = [[-0.43, -0.35, -0.28],
       [ 0.12, -0.48, -0.68]]

# Update Σ
Σ = [8.94, 4.81]

error = 3.7  # Giảm!
```

**Iteration 50:**
```python
# Converged!
U = [[-0.58, -0.15],
     [-0.45, -0.32],
     [-0.41,  0.61]]

Σ = [9.72, 5.22]

Vt = [[-0.46, -0.38, -0.30],
      [ 0.14, -0.52, -0.72]]

error = 0.001  # Rất nhỏ → dừng
```

###### **5. Tại sao U có giá trị âm?**

**U và Vt có thể âm** vì chúng đại diện cho **directions** (hướng), không phải magnitudes (độ lớn):

```
User 1: [-0.58, -0.15]
         ↓
    Giá trị âm → User "phản đối" factor này
    Giá trị dương → User "ủng hộ" factor này

Ví dụ:
- Factor 1 có thể là "Casual Games"
- User 1: -0.58 → Không thích casual → Thích hardcore games
- User 3: +0.41 → Thích casual games
```

**Dấu của U và Vt phải match:**
```
predicted_rating = U[user] @ Σ @ Vt[game]

Nếu:
- U[user][0] = -0.58 (âm)
- Vt[0][game] = -0.46 (âm)
→ Contribution = -0.58 × 9.72 × -0.46 = +2.59 (dương!)

→ User "không thích casual" × Game "không casual" = Rating cao!
```

###### **6. Code implementation thực tế**

```python
from scipy.sparse.linalg import svds
import numpy as np

def train_svd(ratings_matrix, k=100):
    """
    Train SVD model
    
    Args:
        ratings_matrix: (m users × n games) sparse matrix
        k: number of latent factors
    
    Returns:
        U, sigma, Vt
    """
    # Handle missing values (0s in sparse matrix)
    # SVD works best with mean-centered data
    user_ratings_mean = np.mean(ratings_matrix, axis=1)
    R_demeaned = ratings_matrix - user_ratings_mean.reshape(-1, 1)
    
    # Perform SVD
    U, sigma, Vt = svds(R_demeaned, k=k)
    
    # Sort by singular values (descending)
    idx = sigma.argsort()[::-1]
    U = U[:, idx]
    sigma = sigma[idx]
    Vt = Vt[idx, :]
    
    return U, sigma, Vt, user_ratings_mean

def predict_rating(user_id, game_id, U, sigma, Vt, user_means):
    """
    Predict rating for user-game pair
    """
    # Dot product through sigma
    prediction = np.dot(
        np.dot(U[user_id, :], np.diag(sigma)),
        Vt[:, game_id]
    )
    
    # Add back user mean
    prediction += user_means[user_id]
    
    # Clip to valid range [1, 5]
    prediction = np.clip(prediction, 1, 5)
    
    return prediction
```

**Sử dụng:**
```python
# Train
U, sigma, Vt, means = train_svd(ratings_matrix, k=100)

# Predict
predicted_rating = predict_rating(
    user_id=123,
    game_id=456,
    U=U,
    sigma=sigma,
    Vt=Vt,
    user_means=means
)

print(f"Predicted rating: {predicted_rating:.2f}")
# Output: Predicted rating: 4.28
```

---

##### **Bước 3: Dự đoán rating cho game mới**

Khi user chưa tương tác với game, ta dự đoán rating bằng công thức:

```python
predicted_rating[user_id][game_id] = U[user_id] @ Σ @ Vᵀ[game_id]
```

**Chi tiết phép tính:**

```python
# 1. Lấy user vector (k factors)
user_vector = U[user_id]  # Shape: (k,)
# Ví dụ: [0.23, -0.15, 0.87, 0.42]

# 2. Lấy game vector (k factors)
game_vector = Vᵀ[:, game_id]  # Shape: (k,)
# Ví dụ: [0.45, 0.32, -0.18, 0.61]

# 3. Tính tích vô hướng (dot product) qua Σ
predicted_rating = sum(
    user_vector[i] * singular_values[i] * game_vector[i]
    for i in range(k)
)

# Với Σ = [3.5, 2.8, 2.1, 1.6]:
# = 0.23*3.5*0.45 + (-0.15)*2.8*0.32 + 0.87*2.1*(-0.18) + 0.42*1.6*0.61
# = 0.362 + (-0.134) + (-0.329) + 0.410
# = 0.309 (trước khi rescale)
```

**Giải thích:**
- Nếu user_vector và game_vector **cùng hướng** (dot product lớn) → user sẽ thích game
- Nếu **ngược hướng** (dot product nhỏ) → user không thích game

---

##### **Bước 4: Chuẩn hóa về khoảng [0, 1]**

```python
# Tìm min/max predicted ratings trong toàn bộ dataset
min_rating = min(all_predicted_ratings)  # Ví dụ: 0.8
max_rating = max(all_predicted_ratings)  # Ví dụ: 4.9

# Normalize
svd_normalized = (predicted_rating - min_rating) / (max_rating - min_rating)

# Ví dụ với predicted_rating = 4.2:
svd_normalized = (4.2 - 0.8) / (4.9 - 0.8) = 3.4 / 4.1 = 0.829
```

---

#### 📊 Ví dụ đầy đủ:

```python
# === Bước 1: Xây dựng ma trận ===
User 123:
- Wishlist: [Game A, Game B]          → weight = [3.0, 3.0]
- Purchased: {Game C: 4, Game D: 5}   → weight = [4.0, 5.0]
- Views: {Game E: 3, Game F: 7}       → weight = [1.5, 3.5]

ratings_matrix[123] = [3.0, 3.0, 4.0, 5.0, 1.5, 3.5, 0, 0, ...]

# === Bước 2: SVD Decomposition ===
U, Σ, Vᵀ = SVD(ratings_matrix, k=100)  # 100 latent factors

# User 123 vector (100 dimensions):
U[123] = [0.23, -0.15, 0.87, 0.42, ..., 0.19]

# Game X vector (100 dimensions):
Vᵀ[:, game_x] = [0.45, 0.32, -0.18, 0.61, ..., -0.12]

# Singular values (100 values):
Σ = [3.5, 2.8, 2.1, 1.6, ..., 0.03]

# === Bước 3: Dự đoán rating ===
predicted_rating = U[123] @ Σ @ Vᵀ[:, game_x]
predicted_rating = 4.28  # Raw prediction

# === Bước 4: Normalize ===
min_rating = 0.8
max_rating = 4.9
svd_normalized = (4.28 - 0.8) / (4.9 - 0.8)
svd_normalized = 0.849

# 🎯 SVD Score cho Game X = 0.849
```

---

#### 🔍 Tại sao SVD hoạt động tốt?

1. **Tìm hidden patterns:**
   - Factor 1 có thể đại diện cho "Games bạo lực"
   - Factor 2 có thể đại diện cho "Games đồ họa đẹp"
   - Factor 3 có thể đại diện cho "Games multiplayer"
   - ...

2. **Xử lý sparsity (ma trận thưa):**
   - Hầu hết users chỉ tương tác với < 1% games
   - SVD "điền vào chỗ trống" dựa trên patterns từ users tương tự

3. **Generalization:**
   - Không cần game và user giống hệt nhau
   - Chỉ cần "latent preferences" tương tự

---

#### ⚠️ Giới hạn của SVD:

1. **Cold Start Problem:**
   - User mới không có lịch sử → U[new_user] không chính xác
   - Game mới không ai tương tác → Vᵀ[:, new_game] không chính xác
   - **Giải pháp:** Kết hợp với Content Score và Demographic Score

2. **Overfitting:**
   - Nếu k quá lớn → model "ghi nhớ" noise
   - **Giải pháp:** Sử dụng SVD++ hoặc cross-validation để chọn k tối ưu

3. **Không giải thích được:**
   - Factors là trừu tượng, không có ý nghĩa rõ ràng
   - **Giải pháp:** Kết hợp với content-based để giải thích gợi ý

---

### 2️⃣ **Content Score** (Content-based Filtering)
> Đo độ tương đồng giữa game và games mà user đã thích

#### 📐 Cách tính:
- Sử dụng **TF-IDF + Cosine Similarity**
- Đặc trưng game:
  - `genre` (thể loại): Action, RPG, Strategy...
  - `platform`: Windows, Mac, Linux...
  - `publisher`: EA, Ubisoft, Valve...
  - `language`: English, Vietnamese...
  - `mode`: Single Player, Multiplayer, Co-op...
  - `age_rating`: Everyone, Teen, Mature...

#### 🔢 Công thức:
```python
# 1. Tạo feature vector cho mỗi game
game_features = [genre, platform, publisher, language, mode, age_rating]

# 2. TF-IDF vectorization
tfidf_matrix = TF_IDF(all_games_features)

# 3. Cosine similarity matrix
similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)

# 4. Content score cho game mới = trung bình similarity với games đã tương tác
content_score = mean([
    similarity_matrix[new_game_id][interacted_game_id] 
    for interacted_game_id in user_interacted_games
])

# 5. Điều chỉnh để đảm bảo dương (nếu có giá trị âm)
if min_content_score < 0:
    content_score += abs(min_content_score)
```

#### 📊 Ví dụ:
```
User đã thích:
- Game A: Action, Windows, EA → similarity = 0.85 với Game X
- Game B: RPG, Windows, EA → similarity = 0.62 với Game X
- Game C: Action, Mac, Ubisoft → similarity = 0.73 với Game X

Content Score của Game X = (0.85 + 0.62 + 0.73) / 3 = 0.733
```

---

### 3️⃣ **Demographic Score**
> Gợi ý games phổ biến với nhóm người dùng tương tự (age, gender)

#### 📐 Cách tính:
- Tìm users có demographic tương tự:
  - `age`: ±5 tuổi
  - `gender`: cùng giới tính hoặc `Other`
  
- Tính popularity score của game trong nhóm:

#### 🔢 Công thức:
```python
# 1. Tìm similar users
similar_users = [
    user for user in all_users
    if abs(user.age - current_user.age) <= 5
    and (user.gender == current_user.gender or user.gender == 'Other')
]

# 2. Tính popularity trong nhóm
popularity_score = 0
for user in similar_users:
    if game_id in user.purchased_games:
        popularity_score += user.purchased_games[game_id]  # rating 1-5
    elif game_id in user.favorite_games:
        popularity_score += 3  # default rating
    elif game_id in user.view_history:
        popularity_score += user.view_history[game_id] * 0.5

# 3. Normalize
demographic_score = popularity_score / len(similar_users)

# 4. Normalize to 0-1
demographic_normalized = demographic_score / 5.0
```

#### 📊 Ví dụ:
```
User: age=25, gender=Male
Similar users: 15 users (age 20-30, Male)

Game X popularity:
- 5 users purchased (avg rating: 4.2)
- 3 users wishlisted
- 7 users viewed (avg: 2 views)

Demographic Score = (5×4.2 + 3×3 + 7×2×0.5) / 15 = 3.13
Normalized = 3.13 / 5.0 = 0.626
```

---

### 4️⃣ **Keyword Score** (Semantic Search)
> Đo độ liên quan của game với từ khóa tìm kiếm

#### 📐 Cách tính:
Keyword score được tính dựa trên 8 trường (whole word matching):

| Trường | Điểm nếu match | Ví dụ |
|--------|----------------|-------|
| `name` | 3.0 | "Call of Duty" match "call" |
| `genre` | 2.5 | ["Action", "FPS"] match "action" |
| `description` | 2.0 | Mô tả có "multiplayer shooter" |
| `publisher` | 1.5 | "Activision" match "activision" |
| `platform` | 1.5 | ["Windows", "Xbox"] match "windows" |
| `language` | 1.5 | ["English", "Vietnamese"] match "vietnamese" |
| `mode` | 1.0 | ["Single", "Multi"] match "single" |
| `age_rating` | 1.0 | "Mature" match "mature" |

#### 🔢 Công thức:
```python
def get_keyword_score(game, keyword):
    if not keyword:
        return 0.0
    
    score = 0.0
    keywords_to_search = keyword.lower().split()
    
    searchable_fields = {
        'name': 3.0,           # Tên game quan trọng nhất
        'genre': 2.5,          # Genre quan trọng
        'description': 2.0,    # Mô tả quan trọng thứ 2
        'publisher': 1.5,      # Publisher
        'platform': 1.5,       # Platform
        'language': 1.5,       # Language
        'mode': 1.0,           # Mode
        'age_rating': 1.0,     # Age rating
    }
    
    # Tìm trong text fields (whole word matching)
    for field, weight in searchable_fields.items():
        field_value = game.get(field, '')
        if isinstance(field_value, list):
            field_value = ' '.join(field_value)
        field_value = str(field_value).lower()
        
        # Tách thành từng từ
        field_words = field_value.split()
        for kw in keywords_to_search:
            if len(kw) >= 2 and kw in field_words:  # Whole word match
                score += weight
                break  # Chỉ tính 1 lần cho mỗi field
    
    # Normalize to 0-1 (max possible score = 13.5)
    return score / 13.5
```

#### 📊 Ví dụ:
```
Keyword: "call of duty"
Keywords to search: ["call", "of", "duty"]

Game: Call of Duty: Modern Warfare
- Name: "Call of Duty Modern Warfare" → words: ["call", "of", "duty", ...] → match "call" → +3.0
- Genre: ["Action", "FPS"] → không match → +0
- Description: "...popular shooter..." → không match → +0
- Publisher: "Activision" → không match → +0

Total: 3.0
Normalized: 3.0 / 13.5 = 0.222

Game: Battlefield 2042
- Name: "Battlefield 2042" → không match → +0
- Genre: ["Action", "FPS"] → match "action" → +2.5
- Description: "multiplayer shooter" → không match → +0

Total: 2.5
Normalized: 2.5 / 13.5 = 0.185
```

---

## ⚖️ Trọng số (Weights) - Điều chỉnh động

Hệ thống sử dụng **3 bộ trọng số** khác nhau tùy theo tình huống:

### 📊 Bảng trọng số

| Tình huống | SVD (W₁) | Content (W₂) | Demographic (W₃) | Keyword (W₄) | Tổng |
|------------|----------|--------------|------------------|--------------|------|
| **Regular (No Keyword)** | 0.50 | 0.30 | 0.20 | 0.00 | 1.00 |
| **With Keyword** | 0.15 | 0.15 | 0.10 | 0.60 | 1.00 |
| **Cold Start (No Keyword)** | 0.50 | 0.00 | 0.50 | 0.00 | 1.00 |
| **Cold Start (With Keyword)** | 0.20 | 0.00 | 0.20 | 0.60 | 1.00 |

### 🎯 Giải thích từng trường hợp:

#### 1. **Regular User - No Keyword** (W = 0.50, 0.30, 0.20, 0.00)
```python
WEIGHTS_NO_KEYWORD = {
    'svd': 0.50,         # ↑ Ưu tiên collaborative filtering
    'content': 0.30,     # ↑ Content similarity quan trọng
    'demographic': 0.20, # ↓ Demographic ít quan trọng hơn
    'keyword': 0.00      # Không có keyword
}
```

**Lý do:**
- User có lịch sử tương tác → SVD hoạt động tốt
- Content similarity giúp tìm games tương tự những gì user thích
- Demographic có tác động nhỏ

#### 2. **Regular User - With Keyword** (W = 0.15, 0.15, 0.10, 0.60)
```python
WEIGHTS_WITH_KEYWORD = {
    'svd': 0.15,         # ↓ Giảm SVD vì user đang tìm cái cụ thể
    'content': 0.15,     # ↓ Giảm content
    'demographic': 0.10, # ↓ Giảm demographic
    'keyword': 0.60      # ↑↑ Ưu tiên keyword search
}
```

**Lý do:**
- User đang tìm game cụ thể → keyword là ưu tiên hàng đầu
- Các thành phần khác có vai trò phụ để re-rank kết quả

#### 3. **Cold Start User - No Keyword** (W = 0.50, 0.00, 0.50, 0.00)
```python
WEIGHTS_COLD_START_NO_KEYWORD = {
    'svd': 0.50,         # ↑ SVD vẫn hoạt động (dùng patterns từ all users)
    'content': 0.00,     # ⚠️ Không có lịch sử → không tính content
    'demographic': 0.50, # ↑↑ Dựa vào demographic similarity
    'keyword': 0.00      # Không có keyword
}
```

**Lý do:**
- User mới chưa có lịch sử → không tính được content similarity
- Demographic trở thành yếu tố chính (gợi ý games phổ biến với nhóm tuổi/giới tính)

#### 4. **Cold Start User - With Keyword** (W = 0.20, 0.00, 0.20, 0.60)
```python
WEIGHTS_COLD_START_WITH_KEYWORD = {
    'svd': 0.20,         # ↓ SVD có vai trò nhỏ
    'content': 0.00,     # ⚠️ Không tính content
    'demographic': 0.20, # ↓ Demographic có vai trò phụ
    'keyword': 0.60      # ↑↑ Ưu tiên keyword
}
```

**Lý do:**
- User mới + có keyword → keyword là chính
- SVD và demographic chỉ để re-rank

---

## 🤖 Dynamic Weight Adjustment (Điều chỉnh trọng số thông minh)

Hệ thống tự động điều chỉnh trọng số dựa trên **hành vi user**:

### 📊 Case 1: User thường khám phá ngoài top 10 gợi ý

**Điều kiện:**
- `ratio_outside_top10 > 0.5` (50% games user chọn nằm ngoài top 10 gợi ý)

**Điều chỉnh:**
```python
# Công thức giảm keyword weight
keyword_reduction_percent = (ratio_outside_top10 - 0.5) * 50

# Ví dụ: ratio = 0.70 → giảm 10%
# (0.70 - 0.5) * 50 = 10%

new_keyword_weight = 0.60 - (0.60 * keyword_reduction_percent / 100)
# = 0.60 - 0.06 = 0.54

# Phân bổ lượng giảm:
content_increase = keyword_reduction * 0.6  # 60% cho content
demographic_increase = keyword_reduction * 0.4  # 40% cho demographic

new_content_weight = 0.15 + content_increase
new_demographic_weight = 0.10 + demographic_increase
```

**Bảng điều chỉnh:**

| Ratio Outside Top 10 | Keyword Reduction | New Weights (SVD, Content, Demo, Keyword) |
|----------------------|-------------------|-------------------------------------------|
| 50% | 0% | 0.15, 0.15, 0.10, 0.60 (không đổi) |
| 60% | 5% | 0.15, 0.168, 0.112, 0.57 |
| 70% | 10% | 0.15, 0.186, 0.124, 0.54 |
| 80% | 15% | 0.15, 0.204, 0.136, 0.51 |
| 90% | 20% | 0.15, 0.222, 0.148, 0.48 |
| 100% | 25% | 0.15, 0.240, 0.160, 0.45 |

**Lý do:**
- User thường khám phá → giảm ảnh hưởng của keyword
- Tăng content và demographic để đa dạng hóa gợi ý

---

### 📊 Case 2: User có preferences mạnh (publisher/genre)

**Điều kiện:**
- `preference_strength >= 0.4` (user có preferences rõ ràng về publisher hoặc genre)

**Điều chỉnh:**
```python
adjusted_weights = {
    'svd': 0.10,          # ↓ Giảm SVD
    'content': 0.25,      # ↑ Tăng content (từ 0.15 → 0.25)
    'demographic': 0.05,  # ↓ Giảm demographic
    'keyword': 0.60       # Giữ keyword
}
```

**Lý do:**
- User có preferences mạnh → content similarity hoạt động rất tốt
- Tăng content weight để ưu tiên games có genre/publisher giống với những gì user thích

---

## 🧮 Ví dụ tính Base Score đầy đủ

### Tình huống: User 123 tìm kiếm "action game"

**Thông tin user:**
```
User 123:
- Age: 25, Gender: Male
- Wishlist: [Game A (Action), Game B (RPG)]
- Purchased: {Game C (Action): rating=4, Game D (FPS): rating=5}
- Views: {Game E (Strategy): 3 views, Game F (Action): 7 views}
- Behavior: 40% games ngoài top 10 (không trigger adjustment)
- Preference strength: 0.6 (strong genre preference for Action)
```

**Game X cần tính score:**
```
Game X: "Call of Duty: Modern Warfare"
- Genre: ["Action", "FPS"]
- Platform: ["Windows", "Xbox"]
- Publisher: "Activision"
- Price: 1,500,000 VND
- Rating: 4.5/5
```

---

### Bước 1: Tính từng component score

#### 1.1. SVD Score
```python
# User interactions:
# - Game A (wishlist): 3.0
# - Game B (wishlist): 3.0
# - Game C (purchased): 4.0
# - Game D (purchased): 5.0
# - Game E (3 views): 1.5
# - Game F (7 views): 3.5

# SVD prediction
predicted_rating = 4.3  # từ ma trận decomposition

# Normalize
svd_min = 1.0
svd_max = 5.0
svd_normalized = (4.3 - 1.0) / (5.0 - 1.0) = 0.825
```

**SVD Score = 0.825**

---

#### 1.2. Content Score
```python
# Game X features:
game_x_features = "Action FPS Windows Xbox Activision"

# User đã tương tác với:
# - Game A (Action, Windows, EA)
# - Game B (RPG, Mac, Ubisoft)
# - Game C (Action, Windows, EA)
# - Game D (FPS, Windows, Valve)
# - Game F (Action, Xbox, Activision) ← 7 views (high weight)

# Cosine similarity:
similarity_with_A = 0.78
similarity_with_B = 0.42
similarity_with_C = 0.81
similarity_with_D = 0.85
similarity_with_E = 0.35
similarity_with_F = 0.92  # Very similar!

# Weighted average (dựa trên interaction strength)
content_score = (
    3.0 * 0.78 +  # Game A (wishlist)
    3.0 * 0.42 +  # Game B (wishlist)
    4.0 * 0.81 +  # Game C (purchased, rating=4)
    5.0 * 0.85 +  # Game D (purchased, rating=5)
    1.5 * 0.35 +  # Game E (3 views)
    3.5 * 0.92    # Game F (7 views)
) / (3.0 + 3.0 + 4.0 + 5.0 + 1.5 + 3.5)

content_score = 14.17 / 20.0 = 0.709
```

**Content Score = 0.709**

---

#### 1.3. Demographic Score
```python
# Similar users (age 20-30, Male): 18 users

# Game X popularity trong nhóm:
# - 6 users purchased (avg rating: 4.3)
# - 4 users wishlisted
# - 8 users viewed (avg: 2.5 views)

popularity_score = (
    6 * 4.3 +        # Purchased
    4 * 3.0 +        # Wishlisted (default rating = 3)
    8 * 2.5 * 0.5    # Viewed
) / 18

popularity_score = (25.8 + 12.0 + 10.0) / 18 = 2.656

# Normalize to 0-1
demographic_normalized = 2.656 / 5.0 = 0.531
```

**Demographic Score = 0.531**

---

#### 1.4. Keyword Score
```python
keyword = "action game"
keywords_to_search = ["action", "game"]

# Game X: "Call of Duty: Modern Warfare"
# - Name: "Call of Duty Modern Warfare" → không match → 0
# - Genre: ["Action", "FPS"] → match "action" → +2.5
# - Description: "...multiplayer shooter game..." → match "game" → +2.0
# - Publisher: "Activision" → 0
# - Platform: ["Windows", "Xbox"] → 0
# - Language: ["English"] → 0
# - Mode: ["Multiplayer"] → 0
# - Age rating: "Mature" → 0

total_score = 2.5 + 2.0 = 4.5

# Normalize
keyword_score = 4.5 / 13.5 = 0.333
```

**Keyword Score = 0.333**

---

### Bước 2: Chọn trọng số

**User 123 có:**
- ✅ Lịch sử tương tác (không phải cold start)
- ✅ Có keyword tìm kiếm ("action game")
- ⚠️ Preference strength = 0.6 (>0.4) → Trigger Case 2 adjustment!

**Adjusted Weights:**
```python
weights = {
    'svd': 0.10,         # ↓ Giảm SVD
    'content': 0.25,     # ↑ Tăng content (vì preference mạnh)
    'demographic': 0.05, # ↓ Giảm demographic
    'keyword': 0.60      # Giữ keyword
}
```

---

### Bước 3: Tính Base Score

```python
base_score = (
    svd_weight       * svd_score +
    content_weight   * content_score +
    demographic_weight * demographic_score +
    keyword_weight   * keyword_score
)

base_score = (
    0.10 * 0.825 +
    0.25 * 0.709 +
    0.05 * 0.531 +
    0.60 * 0.333
)

base_score = 0.0825 + 0.1773 + 0.0266 + 0.1998

base_score = 0.4862
```

### 📊 Kết quả Base Score

```
╔════════════════════════════════════════════════════════════╗
║  GAME: Call of Duty: Modern Warfare                        ║
║  USER: 123 (Age: 25, Male)                                 ║
║  KEYWORD: "action game"                                    ║
╠════════════════════════════════════════════════════════════╣
║  Component Scores:                                         ║
║  ─────────────────────────────────────────────────────────║
║  • SVD Score:         0.825  (× 0.10) = 0.0825            ║
║  • Content Score:     0.709  (× 0.25) = 0.1773            ║
║  • Demographic Score: 0.531  (× 0.05) = 0.0266            ║
║  • Keyword Score:     0.333  (× 0.60) = 0.1998            ║
║  ─────────────────────────────────────────────────────────║
║  🎯 BASE SCORE:       0.4862                               ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🎯 Lưu ý quan trọng

### ✅ Base Score vs Boosted Score

```
Base Score: 0.4382  ← Điểm ban đầu (trước boost)
                     
                     ↓ Áp dụng Adaptive Boost (nếu enable_adaptive=true)
                     
Boosted Score: 0.526 ← Điểm cuối cùng (sau boost)
```

### 📊 Khi nào Base Score cao?

Base Score cao khi game có:
- ✅ **SVD Score cao**: User tương tự đã thích game này
- ✅ **Content Score cao**: Game tương tự những gì user đã thích
- ✅ **Demographic Score cao**: Phổ biến trong nhóm tuổi/giới tính
- ✅ **Keyword Score cao**: Match tốt với từ khóa tìm kiếm

### ⚠️ Các trường hợp đặc biệt

#### Cold Start User
- Content Score = 0 (không có lịch sử)
- Chỉ dựa vào SVD + Demographic + Keyword
- Base Score thường thấp hơn regular users

#### No Keyword Search
- Keyword Score = 0
- Trọng số phân bổ lại cho SVD + Content + Demographic
- Base Score phụ thuộc nhiều vào collaborative và content filtering

---

## 📈 So sánh Base Score giữa các games

### Ví dụ: Top 5 games cho User 123 (keyword: "action game")

| Rank | Game Name | SVD | Content | Demo | Keyword | **Base Score** |
|------|-----------|-----|---------|------|---------|----------------|
| 1 | Call of Duty: MW | 0.825 | 0.757 | 0.531 | 0.233 | **0.4382** |
| 2 | Battlefield 2042 | 0.712 | 0.823 | 0.612 | 0.200 | **0.4316** |
| 3 | Apex Legends | 0.645 | 0.689 | 0.734 | 0.167 | **0.3845** |
| 4 | Valorant | 0.598 | 0.712 | 0.689 | 0.133 | **0.3623** |
| 5 | Overwatch 2 | 0.534 | 0.645 | 0.723 | 0.100 | **0.3356** |

**Phân tích:**
- Call of Duty dẫn đầu vì có **SVD cao** (0.825) và **Content match tốt** (0.757)
- Battlefield xếp thứ 2 do **Content Score rất cao** (0.823) nhưng SVD thấp hơn
- Apex, Valorant, Overwatch có keyword score thấp hơn → xếp sau

---

## 🔗 Tài liệu liên quan

- 📄 [HUONG_DAN_ADAPTIVE_BOOST.md](./HUONG_DAN_ADAPTIVE_BOOST.md) - Giải thích cách boost factor được áp dụng sau base score
- 📄 [baocao.md](./baocao.md) - Báo cáo tổng quan về hệ thống gợi ý

---

## ❓ FAQ

### Q1: Tại sao Content Score có thể âm?
**A:** Content Score dựa trên cosine similarity, có thể âm nếu hai vectors ngược hướng. Hệ thống tự động điều chỉnh bằng cách cộng thêm `abs(min_content_score)` để đảm bảo tất cả scores dương.

### Q2: Base Score có giá trị từ 0-1?
**A:** Đúng, base score được chuẩn hóa về khoảng [0, 1] nhờ:
- SVD normalized về 0-1
- Content score về 0-1 (sau adjustment)
- Demographic normalized về 0-1 (chia cho 5)
- Keyword score về 0-1 (chia cho 15)

### Q3: Tại sao cùng 1 user nhưng base score của game thay đổi khi có/không keyword?
**A:** Vì trọng số thay đổi:
- **No keyword**: SVD=0.50, Content=0.30, Demo=0.20
- **With keyword**: SVD=0.15, Content=0.15, Demo=0.10, Keyword=0.60

Keyword score khác 0 → công thức tính base score khác → kết quả khác.

### Q4: Base Score có thể > 1 không?
**A:** Lý thuyết không (vì các component đã normalized 0-1 và weights tổng = 1.0). Nhưng trong thực tế hiếm khi đạt 1.0 vì không có game nào perfect match tất cả 4 tiêu chí.

### Q5: Adaptive Boost ảnh hưởng đến Base Score?
**A:** **KHÔNG**. Base Score tính trước, sau đó mới áp dụng boost factor:
```
Final Score = Base Score × Boost Factor
```

---

**📅 Cập nhật lần cuối: 02/11/2025**
**👨‍💻 Tác giả: AI Assistant**

