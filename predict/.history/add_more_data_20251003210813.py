import json
import random

# Đọc file game.json hiện tại
with open('game.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Thêm 40 games mới
new_games = []
game_names = [
    "Fortnite", "Counter-Strike 2", "Dota 2", "World of Warcraft", "Final Fantasy XIV",
    "Destiny 2", "Warframe", "Path of Exile", "Diablo IV", "Lost Ark",
    "New World", "Guild Wars 2", "Elder Scrolls Online", "Black Desert Online", "Tera",
    "Aion", "Blade & Soul", "Vindictus", "Dragon Nest", "MapleStory 2",
    "Rocket League", "FIFA 23", "NBA 2K24", "Madden NFL 24", "NHL 24",
    "F1 23", "Gran Turismo 7", "Forza Horizon 5", "Assetto Corsa", "iRacing",
    "Sims 4", "Cities: Skylines", "Civilization VI", "Age of Empires IV", "Total War: Warhammer III",
    "Crusader Kings III", "Europa Universalis IV", "Hearts of Iron IV", "Stellaris", "Victoria 3"
]

genres = [
    ["Battle Royale", "Shooter"], ["FPS", "Tactical"], ["MOBA", "Strategy"], ["MMORPG", "Fantasy"], ["MMORPG", "Fantasy"],
    ["Looter Shooter", "Sci-Fi"], ["Looter Shooter", "Sci-Fi"], ["ARPG", "Dark Fantasy"], ["ARPG", "Dark Fantasy"], ["MMORPG", "Fantasy"],
    ["MMORPG", "Fantasy"], ["MMORPG", "Fantasy"], ["MMORPG", "Fantasy"], ["MMORPG", "Fantasy"], ["MMORPG", "Fantasy"],
    ["MMORPG", "Fantasy"], ["MMORPG", "Fantasy"], ["MMORPG", "Fantasy"], ["MMORPG", "Fantasy"], ["MMORPG", "Fantasy"],
    ["Sports", "Racing"], ["Sports", "Football"], ["Sports", "Basketball"], ["Sports", "Football"], ["Sports", "Hockey"],
    ["Racing", "Simulation"], ["Racing", "Simulation"], ["Racing", "Open World"], ["Racing", "Simulation"], ["Racing", "Simulation"],
    ["Simulation", "Life"], ["Simulation", "City Building"], ["Strategy", "Turn-based"], ["Strategy", "RTS"], ["Strategy", "RTS"],
    ["Strategy", "Grand Strategy"], ["Strategy", "Grand Strategy"], ["Strategy", "Grand Strategy"], ["Strategy", "Grand Strategy"], ["Strategy", "Grand Strategy"]
]

publishers = [
    "Epic Games", "Valve", "Valve", "Blizzard", "Square Enix",
    "Bungie", "Digital Extremes", "Grinding Gear Games", "Blizzard", "Smilegate",
    "Amazon Games", "ArenaNet", "Zenimax", "Pearl Abyss", "Bluehole",
    "NCSoft", "NCSoft", "Nexon", "Nexon", "Nexon",
    "Psyonix", "EA Sports", "2K Sports", "EA Sports", "EA Sports",
    "EA Sports", "Sony", "Microsoft", "Kunos", "iRacing",
    "EA", "Paradox", "2K Games", "Microsoft", "Creative Assembly",
    "Paradox", "Paradox", "Paradox", "Paradox", "Paradox"
]

for i in range(40):
    game_id = len(data['games']) + 1
    name = game_names[i]
    genre = genres[i]
    publisher = publishers[i]
    
    # Tạo dữ liệu ngẫu nhiên
    rating = round(random.uniform(3.5, 4.9), 1)
    release_year = random.randint(2015, 2024)
    price = random.choice([0, 100000, 300000, 500000, 800000, 1200000, 1600000, 1800000])
    capacity = random.uniform(0.1, 200)
    downloads = random.randint(1000000, 100000000)
    
    # Specs ngẫu nhiên
    cpu_options = ["Intel Pentium", "Intel i3", "Intel i5", "Intel i7", "Intel i9", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7"]
    gpu_options = ["Intel HD", "GTX 1050", "GTX 1060", "GTX 1070", "GTX 1080", "RTX 2060", "RTX 2070", "RTX 3070", "RTX 3080", "RTX 4080"]
    ram_options = ["4GB", "8GB", "16GB", "32GB"]
    
    min_cpu = random.choice(cpu_options)
    min_gpu = random.choice(gpu_options)
    min_ram = random.choice(ram_options)
    
    rec_cpu = random.choice([cpu for cpu in cpu_options if cpu_options.index(cpu) >= cpu_options.index(min_cpu)])
    rec_gpu = random.choice([gpu for gpu in gpu_options if gpu_options.index(gpu) >= gpu_options.index(min_gpu)])
    rec_ram = random.choice([ram for ram in ram_options if ram_options.index(ram) >= ram_options.index(min_ram)])
    
    game = {
        "id": game_id,
        "name": name,
        "description": f"A popular {genre[0].lower()} game featuring {genre[1].lower()} elements. {name} offers engaging gameplay with modern graphics and immersive experiences.",
        "rating": rating,
        "release_year": release_year,
        "publisher": publisher,
        "genre": genre,
        "mode": random.choice(["Online", "Offline", "Online"]),
        "price": price,
        "min_spec": {
            "cpu": min_cpu,
            "ram": min_ram,
            "gpu": min_gpu
        },
        "rec_spec": {
            "cpu": rec_cpu,
            "ram": rec_ram,
            "gpu": rec_gpu
        },
        "multiplayer": random.choice([True, False]),
        "capacity": round(capacity, 1),
        "age_rating": random.choice(["3+", "7+", "10+", "13+", "16+", "18+"]),
        "platform": random.sample(["PC", "Mobile", "PS5", "Xbox", "Console"], random.randint(1, 3)),
        "language": random.sample(["English", "Vietnamese", "Japanese", "Korean", "Chinese", "Spanish", "French", "German"], random.randint(2, 4)),
        "downloads": downloads
    }
    
    new_games.append(game)

# Thêm games mới vào data
data['games'].extend(new_games)

# Thêm 10 users mới
new_users = []
user_names = [
    "Pro Gamer", "Casual Explorer", "Mobile Master", "Console King", "PC Enthusiast",
    "Strategy Expert", "Racing Champion", "Sports Fanatic", "RPG Lover", "Indie Discoverer"
]

ages = [18, 22, 25, 28, 30, 32, 35, 38, 40, 42]
genders = ["male", "female"]

for i in range(10):
    user_id = len(data['users']) + 1
    name = user_names[i]
    age = ages[i]
    gender = random.choice(genders)
    
    # Tạo favorite và purchased games
    all_game_ids = [game['id'] for game in data['games']]
    favorite_count = random.randint(2, 5)
    purchased_count = random.randint(3, 8)
    
    favorite_games = random.sample(all_game_ids, favorite_count)
    purchased_games = random.sample(all_game_ids, purchased_count)
    
    # Tạo view history
    view_history = {}
    view_games = random.sample(all_game_ids, random.randint(5, 12))
    for game_id in view_games:
        view_count = random.randint(1, 10)
        view_history[str(game_id)] = view_count
    
    user = {
        "id": user_id,
        "name": name,
        "age": age,
        "gender": gender,
        "favorite_games": favorite_games,
        "purchased_games": purchased_games,
        "view_history": view_history
    }
    
    new_users.append(user)

# Thêm users mới vào data
data['users'].extend(new_users)

# Ghi lại file
with open('game.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Đã thêm thành công!")
print(f"- {len(new_games)} games mới (tổng: {len(data['games'])} games)")
print(f"- {len(new_users)} users mới (tổng: {len(data['users'])} users)")

# Hiển thị một vài ví dụ
print("\nVí dụ games mới:")
for game in new_games[:3]:
    print(f"- {game['name']} ({game['genre']}) - {game['downloads']:,} downloads")

print("\nVí dụ users mới:")
for user in new_users[:3]:
    print(f"- {user['name']} ({user['age']}, {user['gender']}) - {len(user['favorite_games'])} favorites, {len(user['purchased_games'])} purchased")
