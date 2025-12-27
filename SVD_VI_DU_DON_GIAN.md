# 🎯 VÍ DỤ ĐơN GIẢN: TÍNH ĐIỂM SVD

> **Ví dụ siêu ngắn gọn để hiểu SVD hoạt động như thế nào**

---

## 📊 Bài toán

Có **3 người dùng** và **3 game**. Một số ô chưa có điểm (=0), cần dự đoán.

### Ma trận Rating ban đầu

|        | Game A | Game B | Game C |
|--------|--------|--------|--------|
| User 1 | 5      | 4      | **?**  |
| User 2 | 4      | **?**  | 3      |
| User 3 | **?**  | 5      | 4      |

**Mục tiêu:** Dự đoán điểm cho các ô **?** (ví dụ: User 1 sẽ cho Game C bao nhiêu điểm?)

---

## 🔧 Cách SVD hoạt động

### Bước 1: Chuẩn hóa

Trừ mỗi user đi trung bình điểm của họ (để loại bỏ bias cá nhân):

```
User 1: trung bình = (5+4)/2 = 4.5
User 2: trung bình = (4+3)/2 = 3.5  
User 3: trung bình = (5+4)/2 = 4.5
```

### Bước 2: Phân tích SVD (k=2)

SVD tách ma trận thành 3 phần:  
**R = U × Σ × Vᵀ**

Kết quả (số thực tế từ `scipy.sparse.linalg.svds`):

```python
U = [
  [-0.21,  0.79],  # User 1
  [-0.79,  0.21],  # User 2
  [-0.57, -0.58]   # User 3
]

Σ = [0.87, 0.87]  # Độ quan trọng của 2 factors

Vᵀ = [
  [-0.58, -0.21,  0.79],  # Factor 1
  [ 0.57, -0.79,  0.21]   # Factor 2
]
```

**Giải thích:**
- `U`: Vector sở thích ẩn của từng user (2 chiều ẩn)
- `Σ`: Độ quan trọng của từng chiều ẩn
- `Vᵀ`: Đặc trưng ẩn của từng game (2 chiều ẩn)

---

## 🎯 Dự đoán điểm

Nhân lại: **Predicted = U × Σ × Vᵀ + mean**

### Kết quả cuối cùng:

|        | Game A | Game B | Game C |
|--------|--------|--------|--------|
| User 1 | 5.0    | 4.0    | **4.5** ✅ |
| User 2 | 4.0    | **3.5** ✅ | 3.0    |
| User 3 | **4.5** ✅ | 5.0    | 4.0    |

### Ví dụ cụ thể: User 1 - Game C

**Cách tính:**

```python
# Vector của User 1 và Game C
user_vector = [-0.21, 0.79]
game_vector = [0.79, 0.21]  # Cột 3 của Vᵀ
sigma = [0.87, 0.87]

# Tính điểm (trước khi cộng mean)
score = user_vector[0] × sigma[0] × game_vector[0] + 
        user_vector[1] × sigma[1] × game_vector[1]
      = (-0.21) × 0.87 × 0.79 + 
        (0.79) × 0.87 × 0.21
      = -0.14 + 0.14
      = 0.0

# Cộng lại mean của User 1
predicted = 0.0 + 4.5 = 4.5
```

→ **User 1 được dự đoán sẽ cho Game C khoảng 4.5/5 điểm**

---

## 💡 Tại sao SVD biết được?

### Không cần metadata!

SVD **KHÔNG** nhận thông tin về:
- ❌ Game nào thuộc thể loại gì
- ❌ Game nào AAA hay indie
- ❌ User bao nhiêu tuổi, giới tính gì

SVD **CHỈ** nhìn vào **patterns trong ma trận rating**:

```
📌 Nhận xét từ dữ liệu:
- User 1 và User 2: đều thích Game A (5, 4)
- User 2 và User 3: đều thích Game C (3, 4)
- User 1 và User 3: đều thích Game B (4, 5)

→ SVD phát hiện: "Có 2 nhóm sở thích ẩn"
  - Factor 1: Nhóm thích loại game tương tự A
  - Factor 2: Nhóm thích loại game tương tự C

→ User 1 thích A và B → có thể thích C (vì User 3 cũng thích B+C)
```

### Cơ chế hoạt động

1. **Tìm patterns tương quan:**
   - Game nào thường được cùng nhóm user thích?
   - User nào có thói quen tương tự nhau?

2. **Nén thành 2 chiều ẩn (k=2):**
   - Factor 1: Có thể đại diện cho "action vs story"
   - Factor 2: Có thể đại diện cho "single vs multi"
   
   ⚠️ Lưu ý: Tên factors chỉ là **giả thuyết**; SVD không biết ý nghĩa thực sự!

3. **Dự đoán:**
   - User 1 mạnh ở Factor 2 (0.79)
   - Game C mạnh ở Factor 1 (0.79)
   - → Dự đoán dựa trên độ tương đồng giữa user-game vectors

---

## 📈 Chuẩn hóa về [0, 1]

Trong hệ thống thực tế, điểm SVD được normalize:

```python
svd_min = 3.0   # Điểm thấp nhất trong tất cả predictions
svd_max = 5.0   # Điểm cao nhất

# User 1 - Game C: 4.5
svd_normalized = (4.5 - 3.0) / (5.0 - 3.0) = 1.5 / 2.0 = 0.75
```

→ **SVD Score cuối cùng = 0.75** (trên thang [0, 1])

---

## 🎯 Tóm tắt

| Bước | Mô tả | Input | Output |
|------|-------|-------|--------|
| 1 | Tạo ma trận ratings | User-Game interactions | Ma trận 3×3 |
| 2 | Chuẩn hóa | Trừ mean mỗi user | Ma trận centered |
| 3 | SVD phân tích | k=2 latent factors | U, Σ, Vᵀ |
| 4 | Dự đoán | Nhân U×Σ×Vᵀ + mean | Điểm dự đoán |
| 5 | Normalize | Min-max scaling | Score [0, 1] |

**Điểm mạnh:** Tìm được patterns ẩn từ dữ liệu tương tác, không cần metadata.

**Điểm yếu:** Không hoạt động với user/game mới (cold start) - vì chưa có dữ liệu tương tác.
