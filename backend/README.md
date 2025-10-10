# 🎮 Game Store - Hướng dẫn chạy hệ thống

## 🔄 **Luồng hoạt động:**

1. **User đăng nhập** → Backend xác thực
2. **Frontend gọi API** → `GET /api/reco/games?user_id=123&keyword=hành động`
3. **Backend lấy dữ liệu** → Từ database cho user đó
4. **Backend cập nhật game.json** → Ghi đè dữ liệu user vào file game.json
5. **Backend gọi Flask API** → Truyền user_id và keyword
6. **Flask xử lý** → Recommendation System đọc game.json đã cập nhật và dự đoán
7. **Backend trả kết quả** → Frontend hiển thị trên GamePage

## 🚀 **Cách chạy hệ thống:**

### **Bước 1: Khởi động Backend**
```bash
cd backend
npm run dev
```
- Backend sẽ chạy trên: **http://localhost:3001**

### **Bước 2: Khởi động Recommendation System**
Mở terminal mới và chạy:
```bash
cd predict
python app.py --data game.json
```
- Recommendation System sẽ chạy trên: **http://localhost:5000**

## 🌐 **API Endpoints:**

### **Backend API:**
- `GET /api/reco/games?user_id=123` - Lấy games với recommendations
- `GET /api/reco/games?user_id=123&keyword=hành động` - Tìm kiếm với keyword

### **Flask API:**
- `GET /api/recommendations/123` - Lấy recommendations cho user
- `GET /api/recommendations/123?keyword=hành động` - Tìm kiếm với keyword

## 📊 **Logging và Debug:**

Khi user đăng nhập và vào trang GamePage, hệ thống sẽ log ra:

### **Frontend Console:**
- User info và request details
- API response data
- First 3 recommended games với scores

### **Backend Console:**
- User data từ database
- Current game.json info
- Updated game.json info
- Flask API call details
- Flask API response với recommendations

### **Flask Console:**
- Request details (user_id, keyword)
- Data loading info
- User data từ game.json
- Recommendations generation
- Final results với scores

## ✅ **Kiểm tra hệ thống:**

Sau khi chạy cả 2, bạn sẽ thấy:
- Terminal 1: "API listening on http://localhost:3001"
- Terminal 2: "Running on http://127.0.0.1:5000"

## 🎯 **Tính năng:**

- ✅ **Tích hợp database**: Backend tự động cập nhật game.json từ database
- ✅ **Recommendations thông minh**: SVD + Content + Demographic + Keyword
- ✅ **Tìm kiếm**: Hỗ trợ keyword search
- ✅ **Fallback**: Nếu Flask API không khả dụng, vẫn trả về games
- ✅ **Không cần file tạm**: Sử dụng trực tiếp game.json
- ✅ **Detailed logging**: Theo dõi toàn bộ quá trình từ frontend đến Flask

## 🛑 **Dừng hệ thống:**

- Nhấn `Ctrl+C` trong từng terminal để dừng từng service
- Hoặc đóng các cửa sổ terminal
