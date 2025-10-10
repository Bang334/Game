# 🎮 Cấu hình hệ thống gợi ý game

## 📊 Các biến toàn cục có thể thay đổi

### 1. **Điểm số tương tác**
```python
FAVORITE_RATING = 5.0      # Điểm cho games user thích
PURCHASED_RATING = 3.0     # Điểm cho games user đã mua
NOT_INTERACTED_RATING = 0.0 # Điểm cho games chưa tương tác
```

### 2. **Trọng số Hybrid Scoring**
```python
# Không có keyword
WEIGHTS_NO_KEYWORD = {
    'svd': 0.45,        # SVD (Collaborative Filtering)
    'content': 0.35,    # Content-based Filtering
    'demographic': 0.20, # Demographic Filtering
    'keyword': 0.0      # Keyword Filtering
}

# Có keyword
WEIGHTS_WITH_KEYWORD = {
    'svd': 0.35,        # SVD (Collaborative Filtering)
    'content': 0.25,    # Content-based Filtering
    'demographic': 0.15, # Demographic Filtering
    'keyword': 0.25     # Keyword Filtering
}
```

## 🔧 Cách thay đổi

**Chỉ cần sửa trực tiếp các biến trong file `game_recommendation_system.py`:**

```python
# Ví dụ: Nhấn mạnh favorite
FAVORITE_RATING = 10.0
PURCHASED_RATING = 2.0

# Ví dụ: Nhấn mạnh SVD
WEIGHTS_NO_KEYWORD = {
    'svd': 0.6, 
    'content': 0.3, 
    'demographic': 0.1, 
    'keyword': 0.0
}
```

## 📈 Ảnh hưởng

- **FAVORITE_RATING cao:** Games favorite có SVD score cao hơn
- **PURCHASED_RATING cao:** Games purchased có SVD score cao hơn
- **SVD cao:** Collaborative filtering chiếm ưu thế
- **Content cao:** Content-based filtering chiếm ưu thế

## ⚠️ Lưu ý

- Tổng trọng số phải = 1.0
- Thay đổi xong cần chạy lại hệ thống
- Games trùng lặp (vừa favorite vừa purchased) = FAVORITE_RATING + PURCHASED_RATING
