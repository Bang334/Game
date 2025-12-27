# 🎯 SVD SCORE - TÓM TẮT NGẮN GỌN

## 📥 INPUT
```
Ma trận Ratings (m users × n games) - CHỈ CÓ ĐIỂM SỐ:
- User 1: [5, 3, 0, 4, 0, 0]  ← Wishlist games = 3.0, Purchased = rating, Views = count×0.5
- User 2: [4, 0, 0, 5, 3, 0]
- User 3: [0, 4, 3, 0, 5, ?]  ← Cần dự đoán dấu "?"
- ...
```

## 📤 OUTPUT
```
Predicted Rating (đã normalize 0-1): 0.8173
→ User 3 có khả năng thích Game F với độ tin cậy 81.73%
```

## ⚙️ NGUYÊN LÝ HOẠT ĐỘNG

### 1. **Phân tách ma trận (Matrix Factorization)**
```
R = U × Σ × Vᵀ

R (5×6)  =  U (5×3)  ×  Σ (3×3)  ×  Vᵀ (3×6)
[Ratings]   [User     [Importance]   [Game
             Factors]                 Factors]
```

### 2. **Ý nghĩa từng thành phần**
- **U**: Mỗi user = 1 vector k số (preferences ẩn)
  - User 3 = [-0.46, 0.61, -0.12] ← "khẩu vị" của user
- **Σ**: k singular values (tầm quan trọng của factors)
  - [12.35, 6.79, 3.46] ← Factor 1 quan trọng nhất
- **Vᵀ**: Mỗi game = 1 vector k số (đặc trưng ẩn)
  - Game F = [-0.57, 0.25, 0.12] ← "tính chất" của game

### 3. **Dự đoán rating**
```python
predicted_rating = U[user_id] @ Σ @ Vᵀ[game_id]

# Chi tiết:
= (-0.46 × 12.35 × -0.57) + (0.61 × 6.79 × 0.25) + (-0.12 × 3.46 × 0.12)
= 3.20 + 1.02 + (-0.05)
= 4.17 / 5.0
```

### 4. **Normalize về [0, 1]**
```python
svd_score = (4.17 - min_rating) / (max_rating - min_rating)
          = (4.17 - 0.54) / (4.98 - 0.54)
          = 0.8173
```

## 🧠 TẠI SAO HOẠT ĐỘNG?

**Collaborative Filtering**: Tìm patterns ẩn từ users tương tự
- User 3 có vector [-0.46, 0.61, -0.12]
- User 4 (đã rate Game F = 5⭐) có vector [-0.51, 0.70, -0.19] ← Rất giống!
- → User 3 cũng sẽ thích Game F

**Factors không có tên - chỉ là patterns số:**
- Factor 1 có thể liên quan "AAA vs indie" (con người đoán sau)
- Factor 2 có thể liên quan "story vs action" (con người đoán sau)
- SVD **KHÔNG BIẾT** ý nghĩa - chỉ tìm patterns toán học!

## ✅ ƯU ĐIỂM vs ⚠️ HẠN CHẾ

**Ưu điểm:**
- Chỉ cần ratings, không cần metadata
- Tìm patterns phức tạp mà con người không nghĩ tới
- Xử lý tốt ma trận thưa (99% missing values)

**Hạn chế:**
- Cold start: User/game mới không có lịch sử → prediction kém
- Black box: Khó giải thích "tại sao gợi ý"
- Chậm với dataset lớn (cần retrain khi có data mới)

---

**📝 Tóm tắt 1 câu:** SVD phân tích ma trận ratings thành user vectors và game vectors, dự đoán rating mới = dot product của 2 vectors qua importance weights.

