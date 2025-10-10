import json
import random

# Đọc file game.json
with open('game.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Cập nhật cấu trúc view_history cho mỗi user
for user in data['users']:
    # Tạo view history mới với cấu trúc dictionary
    view_history = {}
    
    # Mỗi user sẽ xem từ 3-8 games khác nhau
    num_games_to_view = random.randint(3, 8)
    
    # Lấy danh sách tất cả game IDs
    all_game_ids = [game['id'] for game in data['games']]
    
    # Tạo view history với số lần xem ngẫu nhiên
    for _ in range(num_games_to_view):
        game_id = random.choice(all_game_ids)
        # Số lần xem từ 1-10
        view_count = random.randint(1, 10)
        view_history[game_id] = view_count
    
    user['view_history'] = view_history

# Ghi lại file
with open('game.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Đã cập nhật cấu trúc 'view_history' thành dictionary!")
print("Số lượng users đã cập nhật:", len(data['users']))

# Hiển thị một vài ví dụ
print("\nVí dụ view history mới của một số users:")
for i, user in enumerate(data['users'][:3]):
    print(f"User {user['id']} ({user['name']}): {user['view_history']}")
    total_views = sum(user['view_history'].values())
    print(f"  -> Tổng số lần xem: {total_views}, Tổng điểm: {total_views * 0.5}")
