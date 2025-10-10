#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
TẠO DỮ LIỆU MẪU TƯƠNG TỰ T.JSON VỚI USER VÀ GAME TRONG CÙNG 1 FILE
"""

import json
import random

def create_sample_data():
    """Tạo dữ liệu mẫu tương tự t.json"""
    
    print("=" * 80)
    print("TẠO DỮ LIỆU MẪU TƯƠNG TỰ T.JSON")
    print("=" * 80)
    
    # Games data (10 games với sự tương phản SVD)
    games = [
        {
            "id": 1,
            "name": "Call of Duty: Modern Warfare",
            "description": "A military first-person shooter featuring intense multiplayer combat and cinematic single-player campaign. Includes realistic weapons, tactical gameplay, and competitive multiplayer modes with various maps and game types.",
            "rating": 4.5,
            "release_year": 2019,
            "publisher": "Activision",
            "genre": ["Action", "Shooter", "Competitive"],
            "mode": "Online",
            "price": 1200000,
            "min_spec": {
                "cpu": "Intel i5",
                "ram": "8GB",
                "gpu": "GTX 1060"
            },
            "rec_spec": {
                "cpu": "Intel i7",
                "ram": "16GB",
                "gpu": "RTX 2070"
            },
            "multiplayer": True,
            "capacity": 175,
            "age_rating": "18+",
            "platform": ["PC", "PS4", "Xbox"],
            "language": ["English", "French", "German", "Spanish"],
            "downloads": 92660441
        },
        {
            "id": 2,
            "name": "Candy Crush Saga",
            "description": "A popular match-three puzzle game where players swap colored candies to create matches and clear levels. Features hundreds of levels, special candies, and social features. Perfect for casual gaming sessions.",
            "rating": 3.8,
            "release_year": 2012,
            "publisher": "King",
            "genre": ["Puzzle", "Casual"],
            "mode": "Online",
            "price": 1200000,
            "min_spec": {
                "cpu": "Intel Pentium",
                "ram": "1GB",
                "gpu": "Intel HD"
            },
            "rec_spec": {
                "cpu": "Intel i3",
                "ram": "2GB",
                "gpu": "Intel HD"
            },
            "multiplayer": True,
            "capacity": 0.1,
            "age_rating": "3+",
            "platform": ["Mobile", "PC"],
            "language": ["English", "Vietnamese", "Chinese", "Spanish"],
            "downloads": 73462243
        },
        {
            "id": 3,
            "name": "Civilization VI",
            "description": "A turn-based strategy game where you build and lead a civilization from the Stone Age to the Information Age. Features deep strategic gameplay, diplomacy, warfare, and cultural development.",
            "rating": 4.9,
            "release_year": 2016,
            "publisher": "2K Games",
            "genre": ["Strategy", "Turn-based", "Historical"],
            "mode": "Offline",
            "price": 500000,
            "min_spec": {
                "cpu": "Intel i3",
                "ram": "4GB",
                "gpu": "GTX 750"
            },
            "rec_spec": {
                "cpu": "Intel i5",
                "ram": "8GB",
                "gpu": "GTX 1050"
            },
            "multiplayer": True,
            "capacity": 0.1,
            "age_rating": "E10+",
            "platform": ["PC", "Mobile", "Console"],
            "language": ["English", "Vietnamese", "Japanese", "Chinese"],
            "downloads": 79259887
        },
        {
            "id": 4,
            "name": "Minecraft",
            "description": "A sandbox game where players can build, explore, and survive in procedurally generated worlds made of blocks. Features creative mode for building, survival mode for adventure, and multiplayer servers for social play.",
            "rating": 4.8,
            "release_year": 2011,
            "publisher": "Mojang",
            "genre": ["Sandbox", "Creative", "Building"],
            "mode": "Online",
            "price": 300000,
            "min_spec": {
                "cpu": "Intel i3",
                "ram": "4GB",
                "gpu": "GTX 750"
            },
            "rec_spec": {
                "cpu": "Intel i5",
                "ram": "8GB",
                "gpu": "GTX 1050"
            },
            "multiplayer": True,
            "capacity": 1,
            "age_rating": "7+",
            "platform": ["PC", "Mobile", "Console"],
            "language": ["English", "Vietnamese", "Japanese", "Chinese"],
            "downloads": 67726259
        },
        {
            "id": 5,
            "name": "Cyberpunk 2077",
            "description": "An open-world action-adventure RPG set in the dystopian future of Night City. Play as V, a mercenary seeking immortality through a cybernetic implant. Features deep character customization, branching storylines, and immersive cyberpunk atmosphere.",
            "rating": 4.2,
            "release_year": 2020,
            "publisher": "CD Projekt Red",
            "genre": ["Action", "RPG", "Futuristic"],
            "mode": "Offline",
            "price": 1200000,
            "min_spec": {
                "cpu": "Intel i5",
                "ram": "8GB",
                "gpu": "GTX 1060"
            },
            "rec_spec": {
                "cpu": "Intel i7",
                "ram": "12GB",
                "gpu": "RTX 2060"
            },
            "multiplayer": False,
            "capacity": 70,
            "age_rating": "18+",
            "platform": ["PC", "PS5", "Xbox"],
            "language": ["English", "Polish", "German", "French"],
            "downloads": 76129705
        },
        {
            "id": 6,
            "name": "Tetris",
            "description": "The classic puzzle game where players arrange falling blocks to create complete lines. Features simple yet addictive gameplay, increasing speed, and timeless appeal. Perfect for quick gaming sessions and nostalgic fun.",
            "rating": 4.6,
            "release_year": 1984,
            "publisher": "EA",
            "genre": ["Puzzle", "Classic"],
            "mode": "Offline",
            "price": 100000,
            "min_spec": {
                "cpu": "Intel Pentium",
                "ram": "512MB",
                "gpu": "Intel HD"
            },
            "rec_spec": {
                "cpu": "Intel i3",
                "ram": "1GB",
                "gpu": "Intel HD"
            },
            "multiplayer": False,
            "capacity": 0.05,
            "age_rating": "3+",
            "platform": ["PC", "Mobile"],
            "language": ["English", "Russian", "Japanese", "Chinese"],
            "downloads": 44783712
        },
        {
            "id": 7,
            "name": "World of Warcraft",
            "description": "A massive multiplayer online role-playing game set in the fantasy world of Azeroth. Create characters, complete quests, join guilds, and explore vast landscapes in this iconic MMORPG.",
            "rating": 4.3,
            "release_year": 2004,
            "publisher": "Blizzard",
            "genre": ["MMORPG", "Fantasy", "RPG"],
            "mode": "Online",
            "price": 800000,
            "min_spec": {
                "cpu": "Intel i5",
                "ram": "4GB",
                "gpu": "GTX 750"
            },
            "rec_spec": {
                "cpu": "Intel i7",
                "ram": "8GB",
                "gpu": "GTX 1060"
            },
            "multiplayer": True,
            "capacity": 0.1,
            "age_rating": "T",
            "platform": ["PC"],
            "language": ["English", "French", "German", "Spanish"],
            "downloads": 34476322
        },
        {
            "id": 8,
            "name": "Among Us",
            "description": "A multiplayer social deduction game where players work together on a spaceship while trying to identify impostors among the crew. Features deception, teamwork, and quick rounds perfect for party gaming.",
            "rating": 4.1,
            "release_year": 2018,
            "publisher": "InnerSloth",
            "genre": ["Social", "Deduction", "Multiplayer"],
            "mode": "Online",
            "price": 50000,
            "min_spec": {
                "cpu": "Intel Pentium",
                "ram": "1GB",
                "gpu": "Intel HD"
            },
            "rec_spec": {
                "cpu": "Intel i3",
                "ram": "2GB",
                "gpu": "Intel HD"
            },
            "multiplayer": True,
            "capacity": 0.25,
            "age_rating": "10+",
            "platform": ["Mobile", "PC"],
            "language": ["English", "Vietnamese", "Korean", "Japanese"],
            "downloads": 72318373
        },
        {
            "id": 9,
            "name": "Elden Ring",
            "description": "A dark fantasy action RPG featuring challenging combat, vast open world exploration, and deep lore. Created by FromSoftware, it combines Souls-like difficulty with expansive environments and epic boss battles.",
            "rating": 4.8,
            "release_year": 2022,
            "publisher": "FromSoftware",
            "genre": ["RPG", "Action", "Dark Fantasy"],
            "mode": "Offline",
            "price": 1600000,
            "min_spec": {
                "cpu": "Intel i5",
                "ram": "12GB",
                "gpu": "GTX 1070"
            },
            "rec_spec": {
                "cpu": "Intel i7",
                "ram": "16GB",
                "gpu": "RTX 3070"
            },
            "multiplayer": True,
            "capacity": 60,
            "age_rating": "16+",
            "platform": ["PC", "PS5", "Xbox"],
            "language": ["English", "Japanese", "Korean", "Chinese"],
            "downloads": 884217
        },
        {
            "id": 10,
            "name": "Grand Theft Auto V",
            "description": "An open-world action-adventure game set in Los Santos. Play as three different protagonists in an interconnected story of heists, crime, and survival in a satirical recreation of modern Southern California.",
            "rating": 4.8,
            "release_year": 2013,
            "publisher": "Rockstar Games",
            "genre": ["Action", "Adventure", "Crime"],
            "mode": "Online",
            "price": 1400000,
            "min_spec": {
                "cpu": "Intel i5",
                "ram": "8GB",
                "gpu": "GTX 660"
            },
            "rec_spec": {
                "cpu": "Intel i7",
                "ram": "16GB",
                "gpu": "GTX 1060"
            },
            "multiplayer": True,
            "capacity": 110,
            "age_rating": "18+",
            "platform": ["PC", "PS4", "Xbox"],
            "language": ["English", "Spanish", "French", "German"],
            "downloads": 53112985
        }
    ]
    
    # Users data (3 users với preferences khác nhau để tạo sự tương phản SVD)
    users = [
        {
            "id": 1,
            "name": "Action Gamer",
            "age": 25,
            "gender": "male",
            "favorite_games": [1, 5, 9],  # Call of Duty, Cyberpunk, Elden Ring
            "purchased_games": [1, 5, 9, 7],  # Action games
            "view_history": {
                "1": 15,  # Call of Duty
                "5": 12,  # Cyberpunk
                "9": 10,  # Elden Ring
                "7": 8,   # WoW
                "10": 6   # GTA V
            }
        },
        {
            "id": 2,
            "name": "Casual Player",
            "age": 35,
            "gender": "female",
            "favorite_games": [2, 6, 4],  # Candy Crush, Tetris, Minecraft
            "purchased_games": [2, 6, 4, 8],  # Casual games
            "view_history": {
                "2": 20,  # Candy Crush
                "6": 15,  # Tetris
                "4": 10,  # Minecraft
                "8": 8,   # Among Us
                "3": 5    # Civilization
            }
        },
        {
            "id": 3,
            "name": "Strategy Master",
            "age": 40,
            "gender": "male",
            "favorite_games": [3, 7],  # Civilization, WoW
            "purchased_games": [3, 7, 8],  # Strategy games
            "view_history": {
                "3": 25,  # Civilization
                "7": 18,  # WoW
                "8": 12,  # Among Us
                "1": 5,   # Call of Duty
                "2": 3    # Candy Crush
            }
        }
    ]
    
    # Tạo dữ liệu hoàn chỉnh
    data = {
        "games": games,
        "users": users
    }
    
    return data

def save_sample_data():
    """Lưu dữ liệu mẫu"""
    
    print("\n💾 LƯU DỮ LIỆU MẪU:")
    print("-" * 40)
    
    data = create_sample_data()
    
    # Lưu vào file
    with open('sample_t.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ sample_t.json - Dữ liệu mẫu với user và game trong cùng 1 file")
    print(f"   • {len(data['games'])} games")
    print(f"   • {len(data['users'])} users")
    
    return data

def explain_svd_contrast():
    """Giải thích sự tương phản SVD"""
    
    print("\n" + "=" * 80)
    print("SỰ TƯƠNG PHẢN VỀ ĐIỂM SVD")
    print("=" * 80)
    
    print("\n👤 USER PROFILES:")
    print("-" * 40)
    print("1. Action Gamer (25M):")
    print("   • Thích: Call of Duty, Cyberpunk, Elden Ring")
    print("   • Pattern: Action, Shooter, Competitive")
    print("   • SVD sẽ cao cho: Action games (0.8+)")
    print("   • SVD sẽ thấp cho: Puzzle, Casual games (0.2-)")
    
    print("\n2. Casual Player (35F):")
    print("   • Thích: Candy Crush, Tetris, Minecraft")
    print("   • Pattern: Puzzle, Casual, Simple")
    print("   • SVD sẽ cao cho: Puzzle, Casual games (0.8+)")
    print("   • SVD sẽ thấp cho: Action, Competitive games (0.2-)")
    
    print("\n3. Strategy Master (40M):")
    print("   • Thích: Civilization, WoW, Among Us")
    print("   • Pattern: Strategy, Complex, Multiplayer")
    print("   • SVD sẽ cao cho: Strategy, Complex games (0.8+)")
    print("   • SVD sẽ thấp cho: Simple, Casual games (0.2-)")
    
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
    data = save_sample_data()
    explain_svd_contrast()
    
    print("\n" + "=" * 80)
    print("KẾT QUẢ")
    print("=" * 80)
    print("✅ Đã tạo dữ liệu mẫu tương tự t.json:")
    print("   • 10 games đa dạng (action, puzzle, strategy, casual)")
    print("   • 3 users với preferences khác nhau")
    print("   • SVD scores sẽ tương phản rõ ràng")
    print("   • File: sample_t.json")
    print("\n🎯 Sử dụng để test hệ thống recommendation!")
