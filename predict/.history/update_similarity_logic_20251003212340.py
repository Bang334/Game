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

def calculate_similarity_score(age1, gender1, age2, gender2):
    """Tính similarity score dựa trên tuổi và giới tính"""
    age_diff = abs(age1 - age2)
    same_gender = gender1 == gender2
    
    if same_gender:
        if age_diff == 0:
            return 0.6  # Cùng tuổi, cùng giới tính
        elif age_diff == 1:
            return 0.5  # Cách 1 tuổi
        elif age_diff == 2:
            return 0.4  # Cách 2 tuổi
        elif age_diff == 3:
            return 0.3  # Cách 3 tuổi
        elif age_diff == 4:
            return 0.2  # Cách 4 tuổi
        else:
            return 0.1  # Cách 5+ tuổi
    else:
        if age_diff == 0:
            return 0.3  # Khác giới tính, cùng tuổi
        elif age_diff == 1:
            return 0.2  # Khác giới tính, cách 1 tuổi
        else:
            return 0.1  # Khác giới tính, cách 2+ tuổi

def select_games_for_group(age_gender_group, all_game_ids, count):
    """Chọn games phù hợp với age-gender group"""
    if count <= 0:
        return []
        
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
    
    # Đảm bảo count không vượt quá available_games
    actual_count = min(count, len(available_games))
    if actual_count <= 0:
        return []
    
    return random.sample(available_games, actual_count)

def create_similar_users_with_scores(user, all_users, all_game_ids):
    """Tạo users tương tự với similarity scores dựa trên tuổi và giới tính"""
    age = user['age']
    gender = user['gender']
    age_gender_group = get_age_gender_group(age, gender)
    
    # Tìm users với similarity scores
    similar_users = []
    for other_user in all_users:
        if other_user['id'] != user['id']:
            other_age = other_user['age']
            other_gender = other_user['gender']
            similarity_score = calculate_similarity_score(age, gender, other_age, other_gender)
            
            if similarity_score > 0.1:  # Chỉ lấy users có similarity > 10%
                similar_users.append({
                    'user': other_user,
                    'similarity': similarity_score
                })
    
    # Sắp xếp theo similarity score giảm dần
    similar_users.sort(key=lambda x: x['similarity'], reverse=True)
    
    # Chọn top 3-5 users tương tự nhất
    top_similar = similar_users[:5]
    
    # Tạo weighted games từ similar users
    weighted_games = []
    for similar in top_similar:
        similar_user = similar['user']
        similarity = similar['similarity']
        
        # Lấy games từ similar user với weight
        user_games = (similar_user.get('favorite_games', []) + 
                     similar_user.get('purchased_games', []))
        
        # Weight games theo similarity score
        weight = int(similarity * 10)  # Chuyển 0.6 thành 6, 0.3 thành 3, etc.
        for game_id in user_games:
            weighted_games.extend([game_id] * weight)
    
    return weighted_games, age_gender_group

# Cập nhật preferences cho tất cả users
all_game_ids = [game['id'] for game in data['games']]

for user in data['users']:
    age = user['age']
    gender = user['gender']
    
    print(f"Updating {user['name']} (age {age}, {gender})")
    
    # Tạo similar users với similarity scores
    weighted_games, age_gender_group = create_similar_users_with_scores(user, data['users'], all_game_ids)
    
    # Cập nhật favorite games (tối thiểu 5)
    favorite_count = random.randint(5, 8)
    if weighted_games:
        # Chọn games từ weighted similar users
        similar_favorites = random.choices(weighted_games, k=min(int(favorite_count * 0.6), len(weighted_games)))
        group_favorites = select_games_for_group(age_gender_group, all_game_ids, favorite_count - len(similar_favorites))
        user['favorite_games'] = list(set(similar_favorites + group_favorites))[:favorite_count]
    else:
        user['favorite_games'] = select_games_for_group(age_gender_group, all_game_ids, favorite_count)
    
    # Cập nhật purchased games (tối thiểu 7, bao gồm favorites)
    purchased_count = random.randint(7, 12)
    purchased_games = user['favorite_games'].copy()  # Bao gồm favorites
    
    if weighted_games:
        # Chọn games từ weighted similar users
        similar_purchased = [g for g in weighted_games if g not in purchased_games]
        similar_count = min(int((purchased_count - len(purchased_games)) * 0.6), len(similar_purchased))
        if similar_count > 0:
            similar_purchased = random.choices(similar_purchased, k=similar_count)
        else:
            similar_purchased = []
        
        remaining_count = purchased_count - len(purchased_games) - len(similar_purchased)
        if remaining_count > 0:
            group_purchased = select_games_for_group(age_gender_group, all_game_ids, remaining_count)
            purchased_games.extend(similar_purchased + group_purchased)
        else:
            purchased_games.extend(similar_purchased)
    else:
        remaining_count = purchased_count - len(purchased_games)
        if remaining_count > 0:
            additional_purchased = select_games_for_group(age_gender_group, all_game_ids, remaining_count)
            purchased_games.extend(additional_purchased)
    
    user['purchased_games'] = list(set(purchased_games))[:purchased_count]  # Loại bỏ duplicate
    
    # Cập nhật view history (tối thiểu 15 games)
    view_count = random.randint(15, 25)
    view_games = select_games_for_group(age_gender_group, all_game_ids, view_count)
    
    if weighted_games:
        # Chọn games từ weighted similar users
        similar_views = [g for g in weighted_games if g not in view_games]
        similar_count = min(int(view_count * 0.6), len(similar_views))
        if similar_count > 0:
            similar_views = random.choices(similar_views, k=similar_count)
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

print("\nĐã cập nhật thành công similarity logic!")
print("\nLogic similarity mới:")
print("- Cùng tuổi, cùng giới tính: 60%")
print("- Cách 1 tuổi: 50%")
print("- Cách 2 tuổi: 40%")
print("- Cách 3 tuổi: 30%")
print("- Cách 4 tuổi: 20%")
print("- Cách 5+ tuổi: 10%")
print("- Khác giới tính, cùng tuổi: 30%")
print("- Khác giới tính, cách 1 tuổi: 20%")
print("- Khác giới tính, cách 2+ tuổi: 10%")

# Hiển thị ví dụ
print("\nVí dụ users sau khi cập nhật:")
for user in data['users'][:5]:
    print(f"- {user['name']} (age {user['age']}, {user['gender']}): {len(user['favorite_games'])} favorites, {len(user['purchased_games'])} purchased, {len(user['view_history'])} viewed")
