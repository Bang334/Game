# HƯỚNG DẪN CHẠY DỰ ÁN GAME RECOMMENDATION

Bước 1: Chạy Backend (API Server)
Mở terminal thứ nhất:
```bash
cd backend
npm run export:json
npm run dev
```
*(File dữ liệu sẽ được lưu vào `predict/game.json`)*
Bước 2: Chạy Frontend (Web App)
Mở terminal thứ hai:
```bash
cd frontend
npm run dev
```
Bước 3: Chạy Predict
Mở terminal thứ ba:
```bash
cd predict
python unified_ai_service.py
```

Muốn chạy chi tiết xem điểm,... thì chạy
```bash
cd predict
python game_recommendation_system.py --user 1 --chart 1 --adaptive 1
```

Giải thích tham số:
`--user [ID]`: ID người dùng (VD: 1, 2, 3).
`--chart 1`: Xuất báo cáo `scores_table.txt` và vẽ biểu đồ.
`--adaptive 1`: Bật chế độ Adaptive Boosting (Tăng điểm theo hành vi gần đây).

