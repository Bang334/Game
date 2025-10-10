#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
TẠO DỮ LIỆU MẪU VỚI SỰ TƯƠNG PHẢN VỀ ĐIỂM SVD
"""

import json
import numpy as np

def create_sample_data():
    """Tạo dữ liệu mẫu với sự tương phản SVD"""
    
    print("=" * 80)
    print("TẠO DỮ LIỆU MẪU VỚI SỰ TƯƠNG PHẢN SVD")
    print("=" * 80)
    
    # 1. Games data (10 games)
    games_data = [
        {
            "id": 1,
            "name": "Call of Duty: Modern Warfare",
            "genre": "action shooter competitive",
            "publisher": "Activision",
            "age_rating": "M",
            "platform": "PC",
            "mode": "multiplayer",
            "multiplayer": "yes",
            "language": "english",
            "description": "Intense military shooter with realistic combat and competitive multiplayer",
            "rating": 4.5,
            "price": 1200000,
            "downloads": 92660441,
            "capacity": 0.1,
            "release_year": 2019,
            "cpu_score": 8000,
            "gpu_score": 6000,
            "ram": 16
        },
        {
            "id": 2,
            "name": "Candy Crush Saga",
            "genre": "puzzle casual mobile",
            "publisher": "King",
            "age_rating": "E",
            "platform": "mobile",
            "mode": "single",
            "multiplayer": "no",
            "language": "english",
            "description": "Colorful match-three puzzle game with fun gameplay",
            "rating": 3.8,
            "price": 1200000,
            "downloads": 73462243,
            "capacity": 0.1,
            "release_year": 2012,
            "cpu_score": 1000,
            "gpu_score": 500,
            "ram": 2
        },
        {
            "id": 3,
            "name": "Civilization VI",
            "genre": "strategy turn-based historical",
            "publisher": "2K Games",
            "age_rating": "E10+",
            "platform": "PC",
            "mode": "single",
            "multiplayer": "yes",
            "language": "english",
            "description": "Epic strategy game where you build and lead a civilization",
            "rating": 4.9,
            "price": 500000,
            "downloads": 79259887,
            "capacity": 0.1,
            "release_year": 2016,
            "cpu_score": 4000,
            "gpu_score": 2000,
            "ram": 8
        },
        {
            "id": 4,
            "name": "Minecraft",
            "genre": "sandbox creative building",
            "publisher": "Mojang",
            "age_rating": "E10+",
            "platform": "PC",
            "mode": "multiplayer",
            "multiplayer": "yes",
            "language": "english",
            "description": "Creative sandbox game where you build anything you can imagine",
            "rating": 4.8,
            "price": 300000,
            "downloads": 67726259,
            "capacity": 0.1,
            "release_year": 2011,
            "cpu_score": 2000,
            "gpu_score": 1000,
            "ram": 4
        },
        {
            "id": 5,
            "name": "FIFA 24",
            "genre": "sports football simulation",
            "publisher": "EA Sports",
            "age_rating": "E",
            "platform": "PC",
            "mode": "multiplayer",
            "multiplayer": "yes",
            "language": "english",
            "description": "Realistic football simulation with licensed teams and players",
            "rating": 4.2,
            "price": 800000,
            "downloads": 36957011,
            "capacity": 0.1,
            "release_year": 2023,
            "cpu_score": 3000,
            "gpu_score": 2500,
            "ram": 8
        },
        {
            "id": 6,
            "name": "Tetris",
            "genre": "puzzle classic arcade",
            "publisher": "The Tetris Company",
            "age_rating": "E",
            "platform": "PC",
            "mode": "single",
            "multiplayer": "no",
            "language": "english",
            "description": "Classic puzzle game with falling blocks",
            "rating": 4.6,
            "price": 100000,
            "downloads": 44783712,
            "capacity": 0.1,
            "release_year": 1984,
            "cpu_score": 500,
            "gpu_score": 200,
            "ram": 1
        },
        {
            "id": 7,
            "name": "World of Warcraft",
            "genre": "mmorpg fantasy rpg",
            "publisher": "Blizzard",
            "age_rating": "T",
            "platform": "PC",
            "mode": "multiplayer",
            "multiplayer": "yes",
            "language": "english",
            "description": "Massive multiplayer online role-playing game in fantasy world",
            "rating": 4.3,
            "price": 800000,
            "downloads": 34476322,
            "capacity": 0.1,
            "release_year": 2004,
            "cpu_score": 5000,
            "gpu_score": 3000,
            "ram": 8
        },
        {
            "id": 8,
            "name": "Among Us",
            "genre": "social deduction multiplayer",
            "publisher": "InnerSloth",
            "age_rating": "E10+",
            "platform": "PC",
            "mode": "multiplayer",
            "multiplayer": "yes",
            "language": "english",
            "description": "Social deduction game where you find the impostor",
            "rating": 4.1,
            "price": 50000,
            "downloads": 72318373,
            "capacity": 0.1,
            "release_year": 2018,
            "cpu_score": 1500,
            "gpu_score": 800,
            "ram": 2
        },
        {
            "id": 9,
            "name": "Cyberpunk 2077",
            "genre": "action rpg futuristic",
            "publisher": "CD Projekt",
            "age_rating": "M",
            "platform": "PC",
            "mode": "single",
            "multiplayer": "no",
            "language": "english",
            "description": "Open-world action RPG set in dystopian future",
            "rating": 4.2,
            "price": 1200000,
            "downloads": 76129705,
            "capacity": 0.1,
            "release_year": 2020,
            "cpu_score": 6000,
            "gpu_score": 5000,
            "ram": 16
        },
        {
            "id": 10,
            "name": "Hollow Knight",
            "genre": "metroidvania platformer indie",
            "publisher": "Team Cherry",
            "age_rating": "E10+",
            "platform": "PC",
            "mode": "single",
            "multiplayer": "no",
            "language": "english",
            "description": "Beautiful metroidvania with challenging gameplay",
            "rating": 4.8,
            "price": 450000,
            "downloads": 62752174,
            "capacity": 0.1,
            "release_year": 2017,
            "cpu_score": 2000,
            "gpu_score": 1500,
            "ram": 4
        }
    ]
    
    # 2. Users data (3 users với preferences khác nhau)
    users_data = [
        {
            "id": 1,
            "name": "Action Gamer",
            "age": 25,
            "gender": "male",
            "favorite_games": [1, 9],  # Call of Duty, Cyberpunk
            "purchased_games": [1, 9, 7],  # Call of Duty, Cyberpunk, WoW
            "view_history": [
                {"game_id": 1, "views": 15},
                {"game_id": 9, "views": 12},
                {"game_id": 7, "views": 8}
            ]
        },
        {
            "id": 2,
            "name": "Casual Player",
            "age": 35,
            "gender": "female",
            "favorite_games": [2, 6],  # Candy Crush, Tetris
            "purchased_games": [2, 6, 4],  # Candy Crush, Tetris, Minecraft
            "view_history": [
                {"game_id": 2, "views": 20},
                {"game_id": 6, "views": 15},
                {"game_id": 4, "views": 10}
            ]
        },
        {
            "id": 3,
            "name": "Strategy Master",
            "age": 40,
            "gender": "male",
            "favorite_games": [3, 7],  # Civilization, WoW
            "purchased_games": [3, 7, 8],  # Civilization, WoW, Among Us
            "view_history": [
                {"game_id": 3, "views": 25},
                {"game_id": 7, "views": 18},
                {"game_id": 8, "views": 12}
            ]
        }
    ]
    
    # 3. Library data (user-game interactions)
    library_data = [
        # User 1 (Action Gamer) - thích action games
        {"user_id": 1, "game_id": 1, "rating": 5, "playtime": 120},  # Call of Duty
        {"user_id": 1, "game_id": 9, "rating": 4, "playtime": 80},   # Cyberpunk
        {"user_id": 1, "game_id": 7, "rating": 3, "playtime": 40},   # WoW
        
        # User 2 (Casual Player) - thích casual games
        {"user_id": 2, "game_id": 2, "rating": 5, "playtime": 200},  # Candy Crush
        {"user_id": 2, "game_id": 6, "rating": 4, "playtime": 60},   # Tetris
        {"user_id": 2, "game_id": 4, "rating": 3, "playtime": 30},   # Minecraft
        
        # User 3 (Strategy Master) - thích strategy games
        {"user_id": 3, "game_id": 3, "rating": 5, "playtime": 300},  # Civilization
        {"user_id": 3, "game_id": 7, "rating": 4, "playtime": 150},  # WoW
        {"user_id": 3, "game_id": 8, "rating": 3, "playtime": 50},   # Among Us
    ]
    
    # 4. CPU và GPU data
    cpu_data = [
        {"name": "Intel Core i9-13900K", "score": 10000},
        {"name": "Intel Core i7-12700K", "score": 8000},
        {"name": "Intel Core i5-12400", "score": 6000},
        {"name": "Intel Core i3-12100", "score": 4000},
        {"name": "Intel Core i3-10100", "score": 3000},
        {"name": "Intel Core i5-8400", "score": 2000},
        {"name": "Intel Core i3-7100", "score": 1500},
        {"name": "Intel Core i3-6100", "score": 1000},
        {"name": "Intel Core i3-4160", "score": 500}
    ]
    
    gpu_data = [
        {"name": "NVIDIA RTX 4090", "score": 10000},
        {"name": "NVIDIA RTX 4080", "score": 8000},
        {"name": "NVIDIA RTX 4070", "score": 6000},
        {"name": "NVIDIA RTX 3060", "score": 5000},
        {"name": "NVIDIA RTX 2060", "score": 3000},
        {"name": "NVIDIA GTX 1660", "score": 2500},
        {"name": "NVIDIA GTX 1060", "score": 2000},
        {"name": "NVIDIA GTX 1050", "score": 1500},
        {"name": "NVIDIA GTX 1030", "score": 1000},
        {"name": "NVIDIA GTX 750", "score": 800},
        {"name": "NVIDIA GTX 650", "score": 500},
        {"name": "NVIDIA GTX 550", "score": 200}
    ]
    
    return games_data, users_data, library_data, cpu_data, gpu_data

def save_sample_data():
    """Lưu dữ liệu mẫu vào files"""
    
    print("\n💾 LƯU DỮ LIỆU MẪU:")
    print("-" * 40)
    
    games_data, users_data, library_data, cpu_data, gpu_data = create_sample_data()
    
    # Lưu games
    with open('sample_games.json', 'w', encoding='utf-8') as f:
        json.dump(games_data, f, ensure_ascii=False, indent=2)
    print("✅ sample_games.json - 10 games")
    
    # Lưu users
    with open('sample_users.json', 'w', encoding='utf-8') as f:
        json.dump(users_data, f, ensure_ascii=False, indent=2)
    print("✅ sample_users.json - 3 users")
    
    # Lưu library
    with open('sample_library.json', 'w', encoding='utf-8') as f:
        json.dump(library_data, f, ensure_ascii=False, indent=2)
    print("✅ sample_library.json - user-game interactions")
    
    # Lưu CPU
    with open('sample_cpu.json', 'w', encoding='utf-8') as f:
        json.dump(cpu_data, f, ensure_ascii=False, indent=2)
    print("✅ sample_cpu.json - CPU data")
    
    # Lưu GPU
    with open('sample_gpu.json', 'w', encoding='utf-8') as f:
        json.dump(gpu_data, f, ensure_ascii=False, indent=2)
    print("✅ sample_gpu.json - GPU data")
    
    return games_data, users_data, library_data

def explain_svd_contrast():
    """Giải thích sự tương phản SVD"""
    
    print("\n" + "=" * 80)
    print("SỰ TƯƠNG PHẢN VỀ ĐIỂM SVD")
    print("=" * 80)
    
    print("\n👤 USER PROFILES:")
    print("-" * 40)
    print("1. Action Gamer (25M):")
    print("   • Thích: Call of Duty, Cyberpunk, WoW")
    print("   • Pattern: Action, Shooter, Competitive")
    print("   • SVD sẽ cao cho: Action games")
    print("   • SVD sẽ thấp cho: Puzzle, Casual games")
    
    print("\n2. Casual Player (35F):")
    print("   • Thích: Candy Crush, Tetris, Minecraft")
    print("   • Pattern: Puzzle, Casual, Simple")
    print("   • SVD sẽ cao cho: Puzzle, Casual games")
    print("   • SVD sẽ thấp cho: Action, Competitive games")
    
    print("\n3. Strategy Master (40M):")
    print("   • Thích: Civilization, WoW, Among Us")
    print("   • Pattern: Strategy, Complex, Multiplayer")
    print("   • SVD sẽ cao cho: Strategy, Complex games")
    print("   • SVD sẽ thấp cho: Simple, Casual games")
    
    print("\n🎯 DỰ ĐOÁN SVD SCORES:")
    print("-" * 40)
    print("Action Gamer sẽ có SVD cao cho:")
    print("  • Call of Duty (action) - 0.8+")
    print("  • Cyberpunk (action) - 0.7+")
    print("  • Candy Crush (puzzle) - 0.2-")
    
    print("\nCasual Player sẽ có SVD cao cho:")
    print("  • Candy Crush (puzzle) - 0.8+")
    print("  • Tetris (puzzle) - 0.7+")
    print("  • Call of Duty (action) - 0.2-")
    
    print("\nStrategy Master sẽ có SVD cao cho:")
    print("  • Civilization (strategy) - 0.8+")
    print("  • WoW (complex) - 0.7+")
    print("  • Candy Crush (simple) - 0.2-")

if __name__ == "__main__":
    # Tạo và lưu dữ liệu mẫu
    games_data, users_data, library_data = save_sample_data()
    explain_svd_contrast()
    
    print("\n" + "=" * 80)
    print("KẾT QUẢ")
    print("=" * 80)
    print("✅ Đã tạo dữ liệu mẫu với sự tương phản SVD:")
    print("   • 10 games đa dạng (action, puzzle, strategy, casual)")
    print("   • 3 users với preferences khác nhau")
    print("   • SVD scores sẽ tương phản rõ ràng")
    print("   • Files: sample_*.json")
    print("\n🎯 Sử dụng để test hệ thống recommendation!")
