# HỆ THỐNG THÔNG MINH DỰA TRÊN TƯƠNG TÁC NGƯỜI DÙNG

## 📋 TỔNG QUAN

Hệ thống AI thông minh được thiết kế để học hỏi và cải thiện gợi ý game dựa trên hành vi tương tác của người dùng. Hệ thống sử dụng nhiều thuật toán machine learning kết hợp với phân tích hành vi để tạo ra gợi ý cá nhân hóa và chính xác.

## 🏗️ KIẾN TRÚC HỆ THỐNG

### 1. **Cơ sở dữ liệu tương tác (SQLite)**
- **File**: `predict/user_interactions.db`
- **Mục đích**: Lưu trữ tất cả tương tác của người dùng với hệ thống
- **Bảng chính**:
  - `user_interactions`: Log tất cả hành động (view, like, purchase)
  - `user_feedback`: Phản hồi của người dùng về gợi ý
  - `ai_training_log`: Log quá trình training AI
  - `user_behavior_patterns`: Phân tích hành vi người dùng

### 2. **Backend API (Node.js/Express)**
- **File**: `backend/src/routes/ai.ts`
- **Chức năng**: API endpoints để log tương tác và lấy dữ liệu phân tích

### 3. **Hệ thống AI (Python/Flask)**
- **File**: `predict/app.py`
- **Chức năng**: Phân tích hành vi, điều chỉnh trọng số, auto-retrain

### 4. **Frontend Tracking (React)**
- **File**: `frontend/src/services/interactionTracking.ts`
- **Chức năng**: Tự động track tương tác người dùng

## 🔄 QUY TRÌNH HOẠT ĐỘNG

### **Bước 1: Thu thập dữ liệu tương tác**
```
Người dùng tương tác → Frontend track → Backend API → SQLite Database
```

**Các loại tương tác được track:**
- **VIEW**: Xem chi tiết game
- **LIKE**: Thích game (thêm vào wishlist)
- **PURCHASE**: Mua game
- **REVIEW**: Đánh giá game
- **SEARCH**: Tìm kiếm game

### **Bước 2: Phân tích hành vi người dùng**
```python
def analyze_user_behavior(user_id):
    # Phân tích sở thích
    - Thể loại ưa thích (genres)
    - Nhà phát hành ưa thích (publishers)
    - Nền tảng ưa thích (platforms)
    - Khoảng giá chấp nhận được
    - Xu hướng game mới/cũ
    
    # Phân tích mức độ tương tác
    - Điểm tương tác (engagement score)
    - Tỷ lệ chuyển đổi (conversion rate)
    - Mẫu thời gian sử dụng
    
    # Phân tích hành vi mua sắm
    - Tần suất mua game
    - Khoảng thời gian giữa các lần mua
    - Xu hướng mua theo mùa
```

### **Bước 3: Điều chỉnh trọng số động**
```python
def get_dynamic_weights(user_id, keyword=None):
    # 8 quy tắc điều chỉnh thông minh:
    
    1. Người dùng thích game mới → Tăng Content Weight
    2. Tổng tương tác cao → Tăng SVD Weight  
    3. Điểm tương tác cao → Tăng SVD Weight
    4. Sở thích thể loại rõ ràng → Tăng Content Weight
    5. Hoạt động gần đây → Tăng Content Weight
    6. Tỷ lệ chuyển đổi cao → Tăng SVD Weight
    7. Thời gian session dài → Tăng Content Weight
    8. Tương tác với game ngoài top 10 → Giảm Keyword Weight (vì dự đoán không chính xác)
```

### **Bước 4: Auto-retrain mô hình**
```python
def check_and_retrain_svd(user_id):
    # Kiểm tra số lượng tương tác mới
    if new_interactions >= 50:
        # Retrain SVD model với dữ liệu mới
        retrain_svd_model()
        # Log sự kiện retrain
        log_retraining_event(user_id, interactions_count)
```

## 📊 CÁC THUẬT TOÁN AI ĐƯỢC SỬ DỤNG

### 1. **SVD (Singular Value Decomposition)**
- **Mục đích**: Collaborative Filtering
- **Cách hoạt động**: Phân tích ma trận user-item để tìm pattern ẩn
- **Ưu điểm**: Hiệu quả với dữ liệu thưa, phát hiện sở thích ẩn
- **Trọng số**: 35-45% (tùy theo hành vi người dùng)

### 2. **Content-Based Filtering**
- **Mục đích**: Gợi ý dựa trên đặc tính game
- **Features**: Genre, Publisher, Platform, Price, Rating, Specs
- **Ưu điểm**: Không cần dữ liệu người dùng khác
- **Trọng số**: 25-35% (tùy theo hành vi người dùng)

### 3. **Demographic Filtering**
- **Mục đích**: Gợi ý dựa trên tuổi, giới tính
- **Cách hoạt động**: Tìm người dùng tương tự về nhân khẩu học
- **Ưu điểm**: Hoạt động tốt với người dùng mới
- **Trọng số**: 15-20% (cố định)

### 4. **Keyword Matching**
- **Mục đích**: Tìm kiếm theo từ khóa
- **Cách hoạt động**: TF-IDF + Semantic matching
- **Ưu điểm**: Chính xác với tìm kiếm cụ thể
- **Trọng số**: 0-25% (chỉ khi có keyword)

## 🎯 CÁC TÍNH NĂNG THÔNG MINH

### 1. **Phân tích hành vi chi tiết**
```python
behavior_patterns = {
    'preferred_genres': ['Action', 'RPG', 'Strategy'],
    'preferred_platforms': ['PC', 'PS5'],
    'preferred_publishers': ['CD Projekt Red', 'Ubisoft'],
    'price_tolerance': {'min': 100000, 'max': 2000000},
    'prefers_new_games': True,
    'engagement_score': 8.5,
    'conversion_rate': 0.15,
    'session_patterns': 'evening_heavy'
}
```

### 2. **Điều chỉnh trọng số động**
```python
# Ví dụ: Người dùng thích game mới + tương tác cao
weights = {
    'svd': 0.40,      # Tăng do tương tác cao
    'content': 0.40,  # Tăng do thích game mới
    'demographic': 0.15,
    'keyword': 0.05
}
```

### 3. **Auto-retrain thông minh**
- **Trigger**: Mỗi 50 tương tác mới
- **Scope**: Retrain cho user cụ thể
- **Logging**: Ghi lại tất cả sự kiện retrain
- **Performance**: Không ảnh hưởng đến trải nghiệm người dùng

### 4. **Phân tích xu hướng**
```python
# Phân tích xu hướng 7 ngày gần đây
trends = {
    'total_interactions': 1250,
    'new_users': 45,
    'popular_genres': ['Action', 'RPG'],
    'peak_hours': ['19:00-22:00'],
    'conversion_rate': 0.12
}
```

## 📈 DASHBOARD ANALYTICS

### 1. **Thống kê tổng quan**
- Tổng số người dùng
- Tổng số game
- Tổng số tương tác
- Số người dùng có dữ liệu hành vi
- Điểm tương tác trung bình

### 2. **Xu hướng tương tác**
- Biểu đồ tương tác 7 ngày gần đây
- Phân tích theo loại tương tác
- Phân tích theo thời gian

### 3. **Phân tích người dùng cá nhân**
- Sở thích thể loại
- Khoảng giá ưa thích
- Xu hướng game mới/cũ
- Điểm tương tác
- Hoạt động gần đây

## 🔧 API ENDPOINTS

### **Logging APIs**
```typescript
POST /api/ai/log-interaction
{
  "user_id": 1,
  "game_id": 5,
  "interaction_type": "view",
  "metadata": {
    "page": "game_detail",
    "duration": 30
  }
}
```

### **Analytics APIs**
```typescript
GET /api/ai/behavior/:userId
// Trả về phân tích hành vi chi tiết của user

GET /api/ai/analytics
// Trả về thống kê tổng quan hệ thống
```

## 🚀 TÍNH NĂNG NÂNG CAO

### 1. **Real-time Learning**
- Học hỏi từ mỗi tương tác
- Cập nhật mô hình liên tục
- Không cần restart hệ thống

### 2. **Personalized Weights**
- Mỗi người dùng có bộ trọng số riêng
- Điều chỉnh theo hành vi cá nhân
- Tối ưu hóa độ chính xác

### 3. **Smart Caching**
- Cache kết quả phân tích
- Giảm thời gian xử lý
- Cập nhật cache thông minh

### 4. **Error Handling**
- Xử lý lỗi graceful
- Fallback mechanisms
- Logging chi tiết

## 📊 HIỆU SUẤT VÀ METRICS

### **Metrics theo dõi:**
- **Accuracy**: Độ chính xác gợi ý
- **Engagement**: Tỷ lệ tương tác với gợi ý
- **Conversion**: Tỷ lệ mua game từ gợi ý
- **Response Time**: Thời gian phản hồi
- **User Satisfaction**: Điểm hài lòng người dùng

### **Tối ưu hóa:**
- Batch processing cho phân tích
- Async processing cho retrain
- Memory optimization
- Database indexing

## 🔮 TƯƠNG LAI VÀ MỞ RỘNG

### **Các tính năng có thể thêm:**
1. **Deep Learning**: Neural networks cho phân tích phức tạp
2. **Real-time Streaming**: Xử lý tương tác real-time
3. **A/B Testing**: Test các thuật toán khác nhau
4. **Multi-modal**: Kết hợp text, image, audio
5. **Federated Learning**: Học từ nhiều nguồn dữ liệu

### **Cải thiện hiện tại:**
1. **Performance**: Tối ưu hóa tốc độ xử lý
2. **Accuracy**: Cải thiện độ chính xác
3. **Scalability**: Mở rộng cho nhiều người dùng
4. **User Experience**: Giao diện thân thiện hơn

## 📝 KẾT LUẬN

Hệ thống AI thông minh này cung cấp một giải pháp toàn diện cho việc gợi ý game cá nhân hóa. Với khả năng học hỏi liên tục từ hành vi người dùng, hệ thống không ngừng cải thiện độ chính xác và trải nghiệm người dùng.

**Điểm mạnh:**
- ✅ Học hỏi liên tục từ tương tác
- ✅ Điều chỉnh trọng số động
- ✅ Auto-retrain thông minh
- ✅ Phân tích hành vi chi tiết
- ✅ Dashboard analytics đầy đủ

**Hệ thống đã sẵn sàng cho production và có thể mở rộng theo nhu cầu!**
