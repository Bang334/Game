# 📊 TÓM TẮT TRỌNG SỐ HỆ THỐNG AI

## 🎯 **TRỌNG SỐ HIỆN TẠI**

### **1. KHÔNG có keyword tìm kiếm:**
- **SVD (Collaborative Filtering)**: `45%` - Thuật toán chính
- **Content-Based**: `35%` - Dựa trên đặc tính game
- **Demographic**: `20%` - Dựa trên tuổi/giới tính
- **Keyword**: `0%` - Không áp dụng

### **2. CÓ keyword tìm kiếm:**
- **SVD (Collaborative Filtering)**: `15%` - Giảm để nhường chỗ cho keyword
- **Content-Based**: `15%` - Giảm để nhường chỗ cho keyword
- **Demographic**: `10%` - Giảm để nhường chỗ cho keyword
- **Keyword**: `60%` - Ưu tiên cao nhất khi có từ khóa

## 🔧 **BIẾN TOÀN CỤC ĐỂ QUẢN LÝ**

### **File: `predict/game_recommendation_system.py`**
```python
# Trọng số khi KHÔNG có keyword
DEFAULT_SVD_WEIGHT_NO_KEYWORD = 0.45        # 45% SVD
DEFAULT_CONTENT_WEIGHT_NO_KEYWORD = 0.35    # 35% Content-based
DEFAULT_DEMOGRAPHIC_WEIGHT_NO_KEYWORD = 0.20 # 20% Demographic
DEFAULT_KEYWORD_WEIGHT_NO_KEYWORD = 0.0     # 0% Keyword

# Trọng số khi CÓ keyword
DEFAULT_SVD_WEIGHT_WITH_KEYWORD = 0.15      # 15% SVD
DEFAULT_CONTENT_WEIGHT_WITH_KEYWORD = 0.15  # 15% Content-based
DEFAULT_DEMOGRAPHIC_WEIGHT_WITH_KEYWORD = 0.10 # 10% Demographic
DEFAULT_KEYWORD_WEIGHT_WITH_KEYWORD = 0.60  # 60% Keyword
```

### **File: `predict/app.py`**
```python
# Cùng các biến toàn cục như trên
# Được sử dụng trong hàm get_dynamic_weights()
```

## 📈 **LOGIC ĐIỀU CHỈNH TRỌNG SỐ**

### **8 Nguyên tắc thông minh:**

1. **Người dùng thích game mới** → Tăng Content Weight
2. **Tổng tương tác cao** → Tăng SVD Weight  
3. **Điểm tương tác cao** → Tăng SVD Weight
4. **Sở thích thể loại rõ ràng** → Tăng Content Weight
5. **Hoạt động gần đây** → Tăng Content Weight
6. **Tỷ lệ chuyển đổi cao** → Tăng SVD Weight
7. **Thời gian session dài** → Tăng Content Weight
8. **🆕 Tương tác với game ngoài top 10** → Giảm Keyword Weight (dự đoán không chính xác)

### **Khi có keyword:**
- **Keyword chiếm ưu thế (60%)** - Tập trung vào tìm kiếm
- **Các thuật toán khác giảm** - Hỗ trợ bổ sung
- **Phù hợp với tìm kiếm** - User đang tìm game cụ thể
- **🆕 User tương tác ngoài top 10** - Keyword giảm xuống 50% (dự đoán không chính xác)

### **Khi không có keyword:**
- **SVD chiếm ưu thế (45%)** - Dựa trên hành vi tương tác
- **Content-Based (35%)** - Dựa trên sở thích game
- **Demographic (20%)** - Dựa trên đặc điểm cá nhân
- **Phù hợp với gợi ý** - User muốn khám phá game mới
- **🆕 User tương tác ngoài top 10** - SVD tăng lên 50%, Content 40% (cải thiện gợi ý)

## ✅ **KIỂM TRA CHẤT LƯỢNG**

### **Tổng trọng số luôn = 100%:**
- ✅ Không có keyword: `45% + 35% + 20% + 0% = 100%`
- ✅ Có keyword: `15% + 15% + 10% + 60% = 100%`

### **Thống nhất giữa các file:**
- ✅ `game_recommendation_system.py` và `app.py` sử dụng cùng trọng số
- ✅ Biến toàn cục giúp dễ dàng thay đổi và quản lý

## 🚀 **CÁCH THAY ĐỔI TRỌNG SỐ**

### **Để thay đổi trọng số:**
1. **Sửa biến toàn cục** trong cả 2 file
2. **Đảm bảo tổng = 1.0** (100%)
3. **Test lại hệ thống** để đảm bảo hoạt động đúng

### **Ví dụ thay đổi:**
```python
# Nếu muốn tăng SVD lên 50% khi không có keyword
DEFAULT_SVD_WEIGHT_NO_KEYWORD = 0.50        # 50% SVD
DEFAULT_CONTENT_WEIGHT_NO_KEYWORD = 0.30    # 30% Content-based
DEFAULT_DEMOGRAPHIC_WEIGHT_NO_KEYWORD = 0.20 # 20% Demographic
# Tổng vẫn = 100%
```

## 📊 **TÁC ĐỘNG CỦA TRỌNG SỐ**

### **Trọng số cao SVD (45%):**
- ✅ Gợi ý dựa trên hành vi tương tác
- ✅ Phù hợp với user có lịch sử mua game
- ❌ Kém hiệu quả với user mới

### **Trọng số cao Keyword (60%):**
- ✅ Tìm kiếm chính xác theo từ khóa
- ✅ Phù hợp khi user biết rõ muốn gì
- ❌ Có thể bỏ lỡ game hay khác

### **Cân bằng tốt:**
- ✅ Kết hợp nhiều thuật toán
- ✅ Linh hoạt theo tình huống
- ✅ Trải nghiệm người dùng tốt
