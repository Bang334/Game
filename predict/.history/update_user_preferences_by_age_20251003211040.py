import json
import random

# Đọc file game.json hiện tại
with open('game.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Phân loại games theo độ tuổi
age_groups = {
    "young": {  # 18-25: Thích games nhanh, competitive, mobile
        "preferred_genres": ["Battle Royale", "FPS", "MOBA", "Shooter", "Competitive", "Mobile"],
        "avoid_genres": ["Strategy", "Simulation", "Grand Strategy", "Turn-based"]
    },
    "adult": {  # 26-35: Cân bằng giữa casual và hardcore
        "preferred_genres": ["Action", "Adventure", "RPG", "Racing", "Sports", "MMORPG"],
        "avoid_genres": ["Battle Royale", "Competitive"]
    },
    "mature": {  # 36+: Thích games chậm, strategy, simulation
        "preferred_genres": ["Strategy", "Simulation", "Grand Strategy", "Turn-based", "City Building", "Life"],
        "avoid_genres": ["Battle Royale", "FPS", "Competitive", "MOBA"]
    }
}

# Tạo danh sách games theo genre
games_by_genre = {}
for game in data['games']:
    for genre in game['genre']:
        if genre not in games_by_genre:
            games_by_genre[genre] = []
        games_by_genre[genre].append(game['id'])

def get_age_group(age):
    if age <= 25:
        return "young"
    elif age <= 35:
        return "adult"
    else:
        return "mature"

def select_games_for_age_group(age_group, all_game_ids, count):
    """Chọn games phù hợp với age group"""
    preferred_genres = age_groups[age_group]["preferred_genres"]
    avoid_genres = age_groups[age_group]["avoid_genres"]
    
    # Lấy games từ preferred genres
    preferred_games = []
    for genre in preferred_genres:
        if genre in games_by_genre:
            preferred_games.extend(games_by_genre[genre])
    
    # Loại bỏ games từ avoid genres
    avoid_games = []
    for genre in avoid_genres:
        if genre in games_by_genre:
            avoid_games.extend(games_by_genre[genre])
    
    # Chọn games từ preferred, tránh avoid
    available_games = [gid for gid in preferred_games if gid not in avoid_games]
    
    # Nếu không đủ games, thêm random games
    if len(available_games) < count:
        remaining = [gid for gid in all_game_ids if gid not in avoid_games]
        available_games.extend(remaining)
    
    # Loại bỏ duplicate và chọn random
    available_games = list(set(available_games))
    return random.sample(available_games, min(count, len(available_games)))

# Cập nhật preferences cho tất cả users
all_game_ids = [game['id'] for game in data['games']]

for user in data['users']:
    age = user['age']
    age_group = get_age_group(age)
    
    print(f"Updating {user['name']} (age {age}, group: {age_group})")
    
    # Cập nhật favorite games (2-4 games)
    favorite_count = random.randint(2, 4)
    user['favorite_games'] = select_games_for_age_group(age_group, all_game_ids, favorite_count)
    
    # Cập nhật purchased games (3-8 games, bao gồm favorites)
    purchased_count = random.randint(3, 8)
    purchased_games = user['favorite_games'].copy()  # Bao gồm favorites
    additional_purchased = select_games_for_age_group(age_group, all_game_ids, purchased_count - len(purchased_games))
    purchased_games.extend(additional_purchased)
    user['purchased_games'] = list(set(purchased_games))  # Loại bỏ duplicate
    
    # Cập nhật view history (5-12 games)
    view_count = random.randint(5, 12)
    view_games = select_games_for_age_group(age_group, all_game_ids, view_count)
    
    view_history = {}
    for game_id in view_games:
        # Số lần xem dựa trên age group
        if age_group == "young":
            view_times = random.randint(5, 15)  # Trẻ xem nhiều hơn
        elif age_group == "adult":
            view_times = random.randint(3, 10)  # Trung bình
        else:
            view_times = random.randint(1, 8)   # Lớn tuổi xem ít hơn
        
        view_history[str(game_id)] = view_times
    
    user['view_history'] = view_history

# Ghi lại file
with open('game.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\nĐã cập nhật thành công preferences theo độ tuổi!")
print("\nPhân loại age groups:")
print("- Young (18-25): Battle Royale, FPS, MOBA, Competitive")
print("- Adult (26-35): Action, Adventure, RPG, Racing, Sports")
print("- Mature (36+): Strategy, Simulation, Grand Strategy, Turn-based")

# Hiển thị ví dụ
print("\nVí dụ users theo age group:")
for user in data['users'][:6]:
    age_group = get_age_group(user['age'])
    print(f"- {user['name']} (age {user['age']}, {age_group}): {len(user['favorite_games'])} favorites, {len(user['purchased_games'])} purchased")
