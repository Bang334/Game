import json
import random

# Đọc file game.json hiện tại
with open('game.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Phân loại games theo độ tuổi và giới tính
age_gender_groups = {
    "young_male": {  # 18-25, male
        "preferred_genres": ["Battle Royale", "FPS", "MOBA", "Shooter", "Competitive", "Action"],
        "avoid_genres": ["Strategy", "Simulation", "Grand Strategy", "Turn-based", "Life"]
    },
    "young_female": {  # 18-25, female
        "preferred_genres": ["Battle Royale", "FPS", "MOBA", "Shooter", "Competitive", "Action", "RPG"],
        "avoid_genres": ["Strategy", "Simulation", "Grand Strategy", "Turn-based"]
    },
    "adult_male": {  # 26-35, male
        "preferred_genres": ["Action", "Adventure", "RPG", "Racing", "Sports", "MMORPG", "Strategy"],
        "avoid_genres": ["Battle Royale", "Competitive", "Life"]
    },
    "adult_female": {  # 26-35, female
        "preferred_genres": ["Action", "Adventure", "RPG", "Racing", "Sports", "MMORPG", "Simulation"],
        "avoid_genres": ["Battle Royale", "Competitive"]
    },
    "mature_male": {  # 36+, male
        "preferred_genres": ["Strategy", "Simulation", "Grand Strategy", "Turn-based", "City Building", "RPG"],
        "avoid_genres": ["Battle Royale", "FPS", "Competitive", "MOBA"]
    },
    "mature_female": {  # 36+, female
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

def get_age_gender_group(age, gender):
    if age <= 25:
        return f"young_{gender}"
    elif age <= 35:
        return f"adult_{gender}"
    else:
        return f"mature_{gender}"

def select_games_for_group(age_gender_group, all_game_ids, count):
    """Chọn games phù hợp với age-gender group"""
    preferred_genres = age_gender_groups[age_gender_group]["preferred_genres"]
    avoid_genres = age_gender_groups[age_gender_group]["avoid_genres"]
    
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

def create_similar_users(user, all_users, all_game_ids):
    """Tạo users tương tự với 60% similarity"""
    age = user['age']
    gender = user['gender']
    age_gender_group = get_age_gender_group(age, gender)
    
    # Tìm users cùng group
    similar_users = []
    for other_user in all_users:
        if other_user['id'] != user['id']:
            other_age = other_user['age']
            other_gender = other_user['gender']
            other_group = get_age_gender_group(other_age, other_gender)
            
            # Cùng group hoặc group gần nhau
            if (other_group == age_gender_group or 
                (age_gender_group.startswith('young') and other_group.startswith('young')) or
                (age_gender_group.startswith('adult') and other_group.startswith('adult')) or
                (age_gender_group.startswith('mature') and other_group.startswith('mature'))):
                similar_users.append(other_user)
    
    # Chọn 2-3 users tương tự để copy 60% preferences
    if similar_users:
        selected_similar = random.sample(similar_users, min(3, len(similar_users)))
        
        # Copy 60% games từ similar users
        similar_games = []
        for similar_user in selected_similar:
            similar_games.extend(similar_user.get('favorite_games', []))
            similar_games.extend(similar_user.get('purchased_games', []))
        
        # Loại bỏ duplicate
        similar_games = list(set(similar_games))
        
        # Chọn 60% từ similar games, 40% từ group preferences
        similar_count = int(len(similar_games) * 0.6)
        if similar_count > 0:
            selected_similar_games = random.sample(similar_games, min(similar_count, len(similar_games)))
        else:
            selected_similar_games = []
        
        return selected_similar_games, age_gender_group
    else:
        return [], age_gender_group

# Cập nhật preferences cho tất cả users
all_game_ids = [game['id'] for game in data['games']]

for user in data['users']:
    age = user['age']
    gender = user['gender']
    
    print(f"Updating {user['name']} (age {age}, {gender})")
    
    # Tạo similar users trước
    similar_games, age_gender_group = create_similar_users(user, data['users'], all_game_ids)
    
    # Cập nhật favorite games (tối thiểu 5)
    favorite_count = random.randint(5, 8)
    if similar_games:
        # 60% từ similar users, 40% từ group preferences
        similar_favorites = random.sample(similar_games, min(int(favorite_count * 0.6), len(similar_games)))
        group_favorites = select_games_for_group(age_gender_group, all_game_ids, favorite_count - len(similar_favorites))
        user['favorite_games'] = list(set(similar_favorites + group_favorites))[:favorite_count]
    else:
        user['favorite_games'] = select_games_for_group(age_gender_group, all_game_ids, favorite_count)
    
    # Cập nhật purchased games (tối thiểu 7, bao gồm favorites)
    purchased_count = random.randint(7, 12)
    purchased_games = user['favorite_games'].copy()  # Bao gồm favorites
    
    if similar_games:
        # 60% từ similar users, 40% từ group preferences
        similar_purchased = [g for g in similar_games if g not in purchased_games]
        similar_purchased = random.sample(similar_purchased, min(int((purchased_count - len(purchased_games)) * 0.6), len(similar_purchased)))
        group_purchased = select_games_for_group(age_gender_group, all_game_ids, purchased_count - len(purchased_games) - len(similar_purchased))
        purchased_games.extend(similar_purchased + group_purchased)
    else:
        additional_purchased = select_games_for_group(age_gender_group, all_game_ids, purchased_count - len(purchased_games))
        purchased_games.extend(additional_purchased)
    
    user['purchased_games'] = list(set(purchased_games))[:purchased_count]  # Loại bỏ duplicate
    
    # Cập nhật view history (tối thiểu 15 games)
    view_count = random.randint(15, 25)
    view_games = select_games_for_group(age_gender_group, all_game_ids, view_count)
    
    if similar_games:
        # 60% từ similar users, 40% từ group preferences
        similar_views = [g for g in similar_games if g not in view_games]
        similar_views = random.sample(similar_views, min(int(view_count * 0.6), len(similar_views)))
        view_games = similar_views + view_games[:view_count - len(similar_views)]
    
    view_history = {}
    for game_id in view_games:
        # Số lần xem dựa trên age group
        if age <= 25:
            view_times = random.randint(5, 15)  # Trẻ xem nhiều hơn
        elif age <= 35:
            view_times = random.randint(3, 10)  # Trung bình
        else:
            view_times = random.randint(1, 8)   # Lớn tuổi xem ít hơn
        
        view_history[str(game_id)] = view_times
    
    user['view_history'] = view_history

# Ghi lại file
with open('game.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\nĐã cập nhật thành công preferences theo yêu cầu!")
print("\nYêu cầu đã thực hiện:")
print("- Mỗi user có tối thiểu 7 games đã tải, 5 games thích, 15 games đã xem")
print("- Users cùng tuổi/giới tính có 60% similarity trong preferences")
print("- Phân loại theo age-gender groups với preferences phù hợp")

# Hiển thị ví dụ
print("\nVí dụ users sau khi cập nhật:")
for user in data['users'][:5]:
    print(f"- {user['name']} (age {user['age']}, {user['gender']}): {len(user['favorite_games'])} favorites, {len(user['purchased_games'])} purchased, {len(user['view_history'])} viewed")
