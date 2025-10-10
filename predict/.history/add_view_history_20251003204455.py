import json
import random

# Đọc file game.json
with open('game.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Thêm field view_history cho mỗi user
for user in data['users']:
    # Tạo danh sách view history ngẫu nhiên
    # Mỗi user sẽ xem từ 5-15 games khác nhau
    num_views = random.randint(5, 15)
    
    # Lấy danh sách tất cả game IDs
    all_game_ids = [game['id'] for game in data['games']]
    
    # Tạo view history với một số games có thể được xem nhiều lần
    view_history = []
    for _ in range(num_views):
        game_id = random.choice(all_game_ids)
        view_history.append(game_id)
    
    user['view_history'] = view_history

# Ghi lại file
with open('game.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Đã thêm field 'view_history' vào tất cả users!")
print("Số lượng users đã cập nhật:", len(data['users']))

# Hiển thị một vài ví dụ
print("\nVí dụ view history của một số users:")
for i, user in enumerate(data['users'][:3]):
    print(f"User {user['id']} ({user['name']}): {user['view_history']}")
