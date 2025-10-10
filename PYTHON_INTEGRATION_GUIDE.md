# Hướng Dẫn Tích Hợp Python AI Recommendation System

## 📋 Tổng Quan

Hệ thống gợi ý game AI đã được tích hợp trực tiếp vào backend Node.js. Khi người dùng đăng nhập và xem trang Games, hệ thống sẽ:

1. **Sync dữ liệu** từ MySQL database → `predict/game.json`
2. **Chạy Python script** với user ID hiện tại
3. **Đọc kết quả** từ `predict/recommendations.json`
4. **Hiển thị** recommendations cho người dùng

## 🔄 Luồng Hoạt Động

```
User Login → Frontend (GamesPage.tsx) → GET /api/reco/games?user_id=1
                                              ↓
                                  Backend (routes/reco.ts)
                                              ↓
                                  1. syncDataToGameJson()
                                     → Lấy dữ liệu từ MySQL
                                     → Ghi vào predict/game.json
                                              ↓
                                  2. Run Python Script
                                     python game_recommendation_system.py --user 1
                                     → Đọc game.json
                                     → Tính toán AI recommendations
                                     → Ghi vào recommendations.json
                                              ↓
                                  3. Đọc recommendations.json
                                              ↓
                                  4. Transform & Return to Frontend
                                              ↓
                          Frontend hiển thị "Gợi ý dành cho bạn"
```

## 📝 Chi Tiết Thay Đổi

### 1. Backend: `backend/src/routes/reco.ts`

#### Imports mới:
```typescript
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const PYTHON_SCRIPT = path.join(PREDICT_DIR, 'game_recommendation_system.py')
const RECOMMENDATIONS_FILE = path.join(PREDICT_DIR, 'recommendations.json')
```

#### Logic mới trong GET `/api/reco/games`:
```typescript
// 1. Sync data vào game.json
await syncDataToGameJson()

// 2. Chạy Python script
const { stdout, stderr } = await execAsync(
  `python "${PYTHON_SCRIPT}" --user ${userId}`,
  { cwd: PREDICT_DIR }
)

// 3. Đọc recommendations.json
const recommendationsData = JSON.parse(
  fs.readFileSync(RECOMMENDATIONS_FILE, 'utf-8')
)

// 4. Transform và trả về
const recommendations = recommendationsData.games.map(game => ({
  game_id: game.id,
  name: game.name,
  price: game.price,
  image: game.image,
  description: game.description,
  average_rating: game.rating,
  genres: game.genre,
  platforms: game.platform,
  publisher_name: game.publisher,
  score: game.score  // AI recommendation score
}))
```

#### SQL Query đã được bổ sung:
- Thêm `g.link_download` vào SELECT statement
- Lấy đầy đủ thông tin: mode, multiplayer, capacity, age_rating
- Lấy min_spec và rec_spec từ table specification

### 2. Python Script: `predict/game_recommendation_system.py`

#### Thêm score vào output JSON:
```python
game_info = {
    "id": rec['game_id'],
    "name": rec['game_name'],
    # ... các fields khác ...
    "score": rec.get('hybrid_score', 0)  # ✅ Thêm AI recommendation score
}
```

### 3. Frontend: `frontend/src/pages/customer/GamesPage.tsx`

#### Thêm score vào Game interface:
```typescript
interface Game {
  game_id: number
  name: string
  price: number
  // ...
  score?: number  // AI recommendation score
}
```

#### Hiển thị AI recommendations:
```typescript
useEffect(() => {
  if (currentUser) {
    fetchRecommendedGames()  // Gọi API recommendations
  } else {
    fetchGames()  // Hiển thị tất cả games
  }
}, [currentUser])
```

## 🚀 Cách Chạy Hệ Thống

### 1. Khởi động Backend
```bash
cd backend
npm run dev
```

Backend sẽ chạy trên: `http://localhost:3000`

### 2. Khởi động Frontend
```bash
cd frontend
npm run dev
```

Frontend sẽ chạy trên: `http://localhost:5173`

### 3. Kiểm Tra Python Environment
```bash
cd predict
python game_recommendation_system.py --user 1
```

Đảm bảo Python script chạy được và tạo file `recommendations.json`

## 📦 Dependencies

### Backend (Node.js):
- `child_process` - Built-in, để chạy Python script
- `fs` - Built-in, để đọc/ghi files
- `path` - Built-in, để xử lý đường dẫn

### Python:
```bash
pip install numpy pandas scikit-learn scipy
```

## 🔍 Kiểm Tra Hoạt Động

### 1. Check Backend Logs:
Khi user truy cập trang Games (đã login), backend sẽ log:
```
=== RECOMMENDATION REQUEST ===
User ID: 1
=== SYNCING DATA TO GAME.JSON ===
✅ Data synced successfully
Running Python script: python game_recommendation_system.py --user 1
✅ Python script completed successfully
✅ Recommendations loaded from file
Recommendations count: 20
=== RECOMMENDATION COMPLETED ===
```

### 2. Check Files:
- `predict/game.json` - Chứa dữ liệu từ MySQL
- `predict/recommendations.json` - Chứa AI recommendations

### 3. Check Frontend:
- Login vào hệ thống
- Truy cập trang "Games"
- Sẽ thấy title: **"Gợi ý dành cho bạn"**
- Mỗi game card có:
  - Badge "AI Recommended"
  - Score hiển thị (VD: "Score: 0.856")

## 🐛 Troubleshooting

### Lỗi: Python script không chạy
**Nguyên nhân**: Python không có trong PATH
**Giải pháp**: 
```bash
# Kiểm tra Python
python --version

# Hoặc thử python3
python3 --version

# Sửa trong backend/src/routes/reco.ts nếu cần:
python3 "${PYTHON_SCRIPT}" --user ${userId}
```

### Lỗi: recommendations.json không tồn tại
**Nguyên nhân**: Python script chưa chạy xong hoặc lỗi
**Giải pháp**: 
- Check backend logs để xem stderr
- Chạy Python script thủ công để debug
- Backend sẽ fallback về danh sách games bình thường

### Lỗi: Score không hiển thị
**Nguyên nhân**: recommendations.json thiếu field `score`
**Giải pháp**: 
- Đã fix trong Python script (dòng 1666)
- Chạy lại Python script để tạo file mới

## 📊 Data Flow

### game.json (Input cho Python):
```json
{
  "games": [
    {
      "id": 1,
      "name": "Cyberpunk 2077",
      "price": 1200000,
      "genre": ["RPG", "Action"],
      "platform": ["PC", "PS5"],
      // ... full game info
    }
  ],
  "users": [
    {
      "id": 1,
      "name": "Gamer Pro",
      "purchased_games": [5, 9, 18],
      "favorite_games": [9, 19, 21],
      "view_history": { "5": 12, "7": 5 }
    }
  ]
}
```

### recommendations.json (Output từ Python):
```json
{
  "games": [
    {
      "id": 7,
      "name": "Red Dead Redemption 2",
      "rating": 4.5,
      "price": 1200000,
      "genre": ["Action", "Adventure"],
      "platform": ["PC", "Xbox", "PS4"],
      "score": 0.856,  // ✅ AI recommendation score
      // ... full game info
    }
  ]
}
```

## 🎯 Kết Quả

✅ **Tự động sync data** từ database khi có request  
✅ **Chạy Python AI** với user ID cụ thể  
✅ **Hiển thị recommendations** với score  
✅ **Fallback** về regular games nếu AI lỗi  
✅ **Link download** đã được lấy từ database  

---

## 📞 Support

Nếu có vấn đề gì, check:
1. Backend logs (`npm run dev`)
2. Python script output (chạy manual)
3. Browser console (F12)
4. Network tab để xem API response

Happy Gaming! 🎮

