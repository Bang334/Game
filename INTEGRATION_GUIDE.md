# Hướng dẫn Tích hợp Hệ thống Gợi ý Game AI

## Tổng quan
Hệ thống gồm 3 phần chính:
1. **Backend Node.js** (port 3001) - API chính cho web app
2. **Flask AI Service** (port 5000) - Hệ thống gợi ý game sử dụng AI
3. **Frontend React** - Giao diện người dùng

## Kiến trúc Tích hợp

```
User Login → Frontend → Backend Node.js → Sync MySQL to game.json → Flask AI → Recommendations → Frontend
```

## Các Thành phần Đã Tích hợp

### 1. Backend Route: `/api/reco/games`
- **File**: `backend/src/routes/reco.ts`
- **Chức năng**:
  - Tự động sync dữ liệu từ MySQL database sang `predict/game.json`
  - Gọi Flask API để lấy recommendations
  - Fallback về danh sách game thông thường nếu Flask không available

### 2. Data Sync
- **Dữ liệu sync**: Games, Users, Purchases, Wishlists, Views, Reviews
- **Format**: JSON structure tương thích với AI model
- **Trigger**: Tự động mỗi khi request recommendations

### 3. Frontend Integration
- **File**: `frontend/src/pages/customer/GamesPage.tsx`
- **Features**:
  - Hiển thị "Gợi ý dành cho bạn" khi user đăng nhập
  - Show AI recommendation score cho mỗi game
  - Badge "AI Recommended" khi có recommendations
  - Fallback về regular games nếu AI không available

## Cách Chạy Hệ thống

### Bước 1: Khởi động Flask AI Service
```bash
cd predict
python app.py
```
Server sẽ chạy tại: `http://localhost:5000`

### Bước 2: Khởi động Backend Node.js
```bash
cd backend
npm install
npm run dev
```
Server sẽ chạy tại: `http://localhost:3001`

### Bước 3: Khởi động Frontend
```bash
cd frontend
npm install
npm run dev
```
App sẽ chạy tại: `http://localhost:5173` (hoặc port Vite assign)

## Luồng Hoạt động

### Khi User Chưa Đăng Nhập:
1. Hiển thị tất cả games theo pagination (20 games/page)
2. Có thể filter, search, sort như bình thường

### Khi User Đã Đăng Nhập:
1. **Frontend** gọi API: `GET /api/reco/games?user_id={userId}`
2. **Backend** thực hiện:
   - Sync toàn bộ dữ liệu từ MySQL sang `predict/game.json`
   - Gọi Flask API: `GET http://localhost:5000/api/recommendations/{userId}`
3. **Flask AI** xử lý:
   - Load `game.json`
   - Chạy AI model (SVD + Content-based + Demographic + Keyword)
   - Trả về list recommendations với scores
4. **Backend** transform data và trả về frontend
5. **Frontend** hiển thị:
   - "Gợi ý dành cho bạn" thay vì "Tất cả Games"
   - Badge "AI Recommended"
   - AI score cho mỗi game (nếu có)
   - Message: "Những game phù hợp nhất dựa trên sở thích và lịch sử của bạn"

## API Endpoints

### Backend (Node.js)

#### GET `/api/reco/games`
**Query Parameters:**
- `user_id` (required): ID của user cần gợi ý

**Response:**
```json
{
  "success": true,
  "games": [
    {
      "game_id": 1,
      "name": "Game Name",
      "price": 100000,
      "image": "url",
      "average_rating": 4.5,
      "genres": ["Action", "Adventure"],
      "platforms": ["PC", "PS5"],
      "publisher_name": "Publisher",
      "score": 0.856
    }
  ],
  "total": 50,
  "message": "AI recommendations generated successfully"
}
```

#### POST `/api/reco/sync`
Manually trigger data sync (optional, auto sync on recommendations)

**Response:**
```json
{
  "success": true,
  "message": "Data synced successfully to game.json"
}
```

### Flask AI Service

#### GET `/api/recommendations/{user_id}`
Returns AI-powered game recommendations

**Response:** Array of game objects with scores

## Dữ liệu Sync sang game.json

### Games Structure:
```json
{
  "id": 1,
  "name": "Game Name",
  "description": "...",
  "price": 100000,
  "rating": 4.5,
  "release_year": 2024,
  "publisher": "Publisher Name",
  "genre": ["Action", "Adventure"],
  "platform": ["PC", "PS5"],
  "language": ["English", "Vietnamese"],
  "min_spec": {
    "cpu": "Intel Core i5",
    "gpu": "GTX 1060",
    "ram": "8GB",
    "storage": "50GB",
    "os": "Windows 10"
  },
  "rec_spec": {...},
  "downloads": 10000,
  "multiplayer": false,
  "capacity": 50,
  "age_rating": "Everyone",
  "mode": "Single Player",
  "link_download": "",
  "image": "url"
}
```

### Users Structure:
```json
{
  "id": 1,
  "name": "Username",
  "email": "user@email.com",
  "age": 25,
  "gender": "Male",
  "favorite_games": [1, 2, 3],
  "purchased_games": [4, 5],
  "view_history": {
    "6": 5,
    "7": 3
  }
}
```

## Fallback Behavior

Nếu Flask AI service không available:
1. Backend log error và fallback
2. Trả về 20 games thông thường từ database
3. Frontend vẫn hiển thị bình thường với message "Showing regular games (AI service unavailable)"
4. User experience không bị gián đoạn

## Troubleshooting

### Flask không trả về recommendations:
- Kiểm tra Flask server đang chạy: `http://localhost:5000`
- Kiểm tra file `predict/game.json` đã được tạo chưa
- Xem logs trong Flask console
- Test Flask API trực tiếp: `curl http://localhost:5000/api/recommendations/1`

### Backend không sync được data:
- Kiểm tra MySQL connection
- Xem logs trong backend console
- Kiểm tra quyền write vào folder `predict/`

### Frontend không hiển thị recommendations:
- Mở DevTools console để xem errors
- Kiểm tra user đã đăng nhập chưa (`currentUser` có giá trị)
- Kiểm tra API response trong Network tab
- Xem logs trong backend console

## Tính năng AI Recommendation

### Các thuật toán được sử dụng:
1. **SVD (Singular Value Decomposition)** - Collaborative filtering
2. **Content-based filtering** - Based on game attributes
3. **Demographic filtering** - Based on user age, gender
4. **Hybrid scoring** - Weighted combination of all methods

### Trọng số mặc định:
- SVD: 45%
- Content: 35%
- Demographic: 20%

### Dynamic weights:
- Tự động điều chỉnh dựa trên:
  - Số lượng tương tác của user
  - Preferences rõ ràng về genre
  - Hoạt động gần đây
  - User behavior patterns

## Tùy chỉnh

### Thay đổi Flask API URL:
```typescript
// backend/src/routes/reco.ts
const FLASK_API_URL = process.env.FLASK_API_URL ?? 'http://localhost:5000'
```

### Thay đổi số lượng recommendations:
```typescript
// Flask trả về tất cả games available, frontend có thể limit
const recommendations = flaskData.slice(0, 50) // Limit to 50
```

### Disable auto sync (nếu muốn manual sync):
Comment out sync trong `GET /api/reco/games` và chỉ dùng `POST /api/reco/sync`

## Monitoring & Logs

### Backend logs:
- `=== SYNCING DATA TO GAME.JSON ===` - Bắt đầu sync
- `✅ Synced X games and Y users` - Sync thành công
- `=== RECOMMENDATION REQUEST ===` - Nhận request
- `✅ Flask API responded successfully` - Flask trả về OK
- `❌ Flask API Error` - Flask lỗi, fallback

### Flask logs:
- `🚀 Khởi tạo Game Recommendation System...`
- `✅ Hệ thống đã sẵn sàng!`
- Request logs cho mỗi recommendation

## Performance

- **Sync time**: ~1-3 giây (depends on database size)
- **AI processing**: ~2-5 giây (depends on user history)
- **Total response time**: ~3-8 giây
- **Caching**: Consider adding cache for repeated requests

## Security Notes

- Token validation được thực hiện ở frontend (AuthContext)
- Backend không require authentication cho `/api/reco/games` (có thể thêm nếu cần)
- Sensitive data không được expose trong recommendations response

## Future Improvements

1. **Add caching** cho recommendations (Redis)
2. **Async sync** để không block request
3. **Incremental sync** thay vì full sync mỗi lần
4. **WebSocket** để real-time updates
5. **A/B testing** để optimize AI weights
6. **User feedback** để improve recommendations
7. **Batch processing** cho multiple users

## Liên hệ & Support

Nếu gặp vấn đề, kiểm tra:
1. Tất cả services đang chạy (MySQL, Backend, Flask, Frontend)
2. Logs trong console của từng service
3. Network requests trong browser DevTools
4. Database có dữ liệu đầy đủ

Chúc may mắn! 🎮

