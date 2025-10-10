# 🎮 Quick Start - Hệ thống Gợi ý Game AI

## Chạy Hệ thống (3 bước)

### 1️⃣ Khởi động Flask AI Service
```bash
cd predict
python app.py
```
✅ Chạy tại: http://localhost:5000

### 2️⃣ Khởi động Backend API
```bash
cd backend
npm run dev
```
✅ Chạy tại: http://localhost:3001

### 3️⃣ Khởi động Frontend
```bash
cd frontend
npm run dev
```
✅ Chạy tại: http://localhost:5173

## Cách Sử dụng

### Người dùng CHƯA đăng nhập:
- Xem tất cả games với pagination
- Filter, search, sort bình thường

### Người dùng ĐÃ đăng nhập:
- Tự động hiển thị "Gợi ý dành cho bạn"
- Badge "AI Recommended" 
- Điểm AI score cho mỗi game
- Games được sắp xếp theo mức độ phù hợp

## Luồng Hoạt động

```
User Login → Frontend → Backend Node.js
                           ↓
                    Sync MySQL → game.json
                           ↓
                    Call Flask AI
                           ↓
                    Get Recommendations
                           ↓
                    Display in Frontend
```

## Kiểm tra Hệ thống

### Test Flask đang chạy:
```bash
curl http://localhost:5000/api/recommendations/1
```

### Test Backend API:
```bash
curl http://localhost:3001/api/reco/games?user_id=1
```

### Test Manual Sync:
```bash
curl -X POST http://localhost:3001/api/reco/sync
```

## Data Flow

1. **MySQL Database** → Chứa toàn bộ dữ liệu (games, users, purchases, reviews, views)
2. **game.json** → File tạm để Flask AI đọc dữ liệu
3. **Flask AI** → Xử lý recommendations với ML models
4. **Backend API** → Trung gian giữa Frontend và Flask
5. **Frontend** → Hiển thị recommendations cho user

## Tính năng AI

- ✅ **SVD Algorithm** - Collaborative filtering
- ✅ **Content-based** - Based on game attributes  
- ✅ **Demographic** - Based on user profile
- ✅ **Hybrid Scoring** - Kết hợp tất cả phương pháp
- ✅ **Auto Sync** - Tự động đồng bộ data
- ✅ **Fallback** - Vẫn hoạt động khi Flask down

## Troubleshooting

❌ **Flask không chạy?**
```bash
cd predict
pip install -r requirements.txt
python app.py
```

❌ **Backend lỗi?**
```bash
cd backend
npm install
npm run dev
```

❌ **Frontend lỗi?**
```bash
cd frontend
npm install
npm run dev
```

❌ **Không thấy recommendations?**
- Kiểm tra user đã đăng nhập chưa
- Xem console logs (Backend & Flask)
- Kiểm tra file `predict/game.json` đã được tạo chưa

## Xem Logs

### Backend logs:
```
=== SYNCING DATA TO GAME.JSON ===
✅ Synced X games and Y users to game.json
Calling Flask API: http://localhost:5000/api/recommendations/1
✅ Flask API responded successfully
```

### Flask logs:
```
🚀 Khởi tạo Game Recommendation System...
✅ Hệ thống đã sẵn sàng!
🌐 Khởi động Game Recommendation Web App...
📱 Truy cập: http://localhost:5000
```

## File Quan trọng

- `backend/src/routes/reco.ts` - API recommendations
- `frontend/src/pages/customer/GamesPage.tsx` - UI hiển thị
- `predict/app.py` - Flask AI service
- `predict/game.json` - Data sync file (auto generated)

## Tài liệu Chi tiết

Xem thêm: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

---
🎉 Enjoy your AI-powered game recommendations!

