# ⏰ Hướng dẫn thêm Timestamps cho 7 ngày tracking

## 📌 Tổng quan

Hiện tại hệ thống đã hỗ trợ phân tích preferences theo **N ngày gần đây** (ví dụ: 7 ngày), nhưng cần thêm timestamps vào dữ liệu user.

## ✅ Sử dụng tính năng (hiện tại - không cần timestamps)

```bash
# Phân tích preferences dựa trên TẤT CẢ lịch sử (mặc định)
python game_recommendation_system.py --user 1 --adaptive 1

# Phân tích preferences từ 7 ngày gần đây (cần timestamps)
python game_recommendation_system.py --user 1 --adaptive 1 --days 7

# Phân tích từ 30 ngày gần đây
python game_recommendation_system.py --user 1 --adaptive 1 --days 30
```

## 🔧 Cách thêm Timestamps vào dữ liệu

### Bước 1: Cập nhật cấu trúc `game.json`

Thêm 3 trường timestamps cho mỗi user:

```json
{
  "users": [
    {
      "id": 1,
      "name": "Gamer Pro",
      "favorite_games": [9, 19, 21],
      "purchased_games": {
        "5": 3,
        "9": 3,
        "18": 3
      },
      "view_history": {
        "5": 12,
        "7": 5
      },
      
      // ⭐ THÊM 3 TRƯỜNG MỚI:
      "favorite_games_timestamps": {
        "9": "2025-01-05T10:30:00",
        "19": "2025-01-08T14:20:00",
        "21": "2025-01-09T09:15:00"
      },
      "purchased_games_timestamps": {
        "5": "2025-01-03T08:00:00",
        "9": "2025-01-06T16:45:00",
        "18": "2025-01-07T11:30:00"
      },
      "view_history_timestamps": {
        "5": "2025-01-08T20:15:00",
        "7": "2025-01-09T18:30:00"
      }
    }
  ]
}
```

### Bước 2: Format Timestamps

Sử dụng format ISO 8601: `"YYYY-MM-DDTHH:MM:SS"`

Ví dụ:
- `"2025-01-09T14:30:00"` - 9/1/2025 lúc 14:30
- `"2025-01-02T08:15:00"` - 2/1/2025 lúc 08:15

### Bước 3: Timestamps cho View History

Với view_history, timestamp là **lần xem gần nhất**:

```json
"view_history": {
  "5": 12,    // Đã xem 12 lần
  "7": 5      // Đã xem 5 lần
},
"view_history_timestamps": {
  "5": "2025-01-09T20:15:00",  // Lần xem cuối cùng
  "7": "2025-01-08T18:30:00"   // Lần xem cuối cùng
}
```

## 📊 Ví dụ đầy đủ

```json
{
  "games": [...],
  "users": [
    {
      "id": 1,
      "name": "Gamer Pro",
      "email": "gamer_pro@example.com",
      "age": 25,
      "gender": "male",
      
      "favorite_games": [9, 19, 21],
      "favorite_games_timestamps": {
        "9": "2025-01-02T10:00:00",
        "19": "2025-01-05T14:30:00",
        "21": "2025-01-08T09:15:00"
      },
      
      "purchased_games": {
        "5": 4,
        "9": 5,
        "18": 3
      },
      "purchased_games_timestamps": {
        "5": "2025-01-01T08:00:00",
        "9": "2025-01-03T16:45:00",
        "18": "2025-01-06T11:30:00"
      },
      
      "view_history": {
        "5": 12,
        "7": 5,
        "11": 8
      },
      "view_history_timestamps": {
        "5": "2025-01-09T20:15:00",
        "7": "2025-01-08T18:30:00",
        "11": "2025-01-07T22:00:00"
      }
    }
  ]
}
```

## 🎯 Kịch bản sử dụng

### Scenario 1: Phân tích 7 ngày gần đây

```bash
python game_recommendation_system.py --user 1 --adaptive 1 --days 7
```

**Kết quả:**
- Hệ thống chỉ phân tích games user tương tác từ **2/1/2025 đến 9/1/2025**
- Loại bỏ games từ trước 2/1/2025
- Preferences chính xác hơn với xu hướng gần đây

### Scenario 2: So sánh All time vs 7 days

```bash
# All time
python game_recommendation_system.py --user 1 --adaptive 1 --days 0

# 7 days
python game_recommendation_system.py --user 1 --adaptive 1 --days 7
```

## 🔍 Output khi có timestamps

```
🎯 Adaptive Preference Boosting Enabled
   Time Window: Last 7 days ⏰
   Top Publishers: ['FromSoftware', 'Epic Games']
   Top Genres: ['Action', 'Dark Fantasy']
   Price Range: 500,000 VND (±200,000)
   ✓ Boosted 45/50 games based on preferences
```

vs không có timestamps:

```
🎯 Adaptive Preference Boosting Enabled
   Time Window: All time history
   Top Publishers: ['FromSoftware', 'miHoYo', 'Epic Games']
   Top Genres: ['RPG', 'Action', 'Dark Fantasy']
   Price Range: 635,000 VND (±691,574)
   ✓ Boosted 57/57 games based on preferences
```

## 🚀 Auto-generate Timestamps (Script)

Tạo script Python để tự động generate timestamps cho dữ liệu hiện tại:

```python
import json
from datetime import datetime, timedelta
import random

# Load data
with open('game.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Generate timestamps (7-30 ngày gần đây)
for user in data['users']:
    # Favorite games timestamps
    if 'favorite_games' in user:
        user['favorite_games_timestamps'] = {}
        for game_id in user['favorite_games']:
            # Random timestamp trong 30 ngày gần đây
            days_ago = random.randint(1, 30)
            timestamp = datetime.now() - timedelta(days=days_ago)
            user['favorite_games_timestamps'][str(game_id)] = timestamp.isoformat()
    
    # Purchased games timestamps
    if 'purchased_games' in user:
        user['purchased_games_timestamps'] = {}
        for game_id in user['purchased_games'].keys():
            days_ago = random.randint(1, 30)
            timestamp = datetime.now() - timedelta(days=days_ago)
            user['purchased_games_timestamps'][str(game_id)] = timestamp.isoformat()
    
    # View history timestamps
    if 'view_history' in user:
        user['view_history_timestamps'] = {}
        for game_id in user['view_history'].keys():
            # Lần xem gần nhất (1-14 ngày)
            days_ago = random.randint(1, 14)
            timestamp = datetime.now() - timedelta(days=days_ago)
            user['view_history_timestamps'][str(game_id)] = timestamp.isoformat()

# Save
with open('game_with_timestamps.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✅ Generated timestamps and saved to game_with_timestamps.json")
```

## 📈 Lợi ích của Timestamps

1. **Phân tích xu hướng gần đây**
   - User thay đổi sở thích theo thời gian
   - Ví dụ: 6 tháng trước thích RPG, giờ thích Shooter

2. **Giảm noise từ dữ liệu cũ**
   - Game xem 2 năm trước ít liên quan
   - Chỉ phân tích 7-30 ngày gần đây

3. **A/B Testing**
   - So sánh hiệu quả: 7 days vs 30 days vs all time
   - Tìm time window tối ưu

4. **Seasonal trends**
   - Phân tích theo mùa, sự kiện
   - Ví dụ: Tết, Summer Sale

## ⚠️ Lưu ý

1. **Không bắt buộc timestamps**
   - Hệ thống vẫn chạy bình thường nếu không có timestamps
   - Chỉ cần thêm khi muốn phân tích theo thời gian

2. **Format timestamp chính xác**
   - Phải dùng ISO format: `YYYY-MM-DDTHH:MM:SS`
   - Có thể thêm timezone: `2025-01-09T14:30:00+07:00`

3. **Performance**
   - Timestamps làm file JSON lớn hơn ~30%
   - Parsing chậm hơn một chút

---

**Cập nhật**: 2025-01-09  
**Tác giả**: Adaptive Recommendation Team

