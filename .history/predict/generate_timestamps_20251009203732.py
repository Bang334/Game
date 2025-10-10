"""
Script tự động generate timestamps cho user interactions
Chạy script này để thêm timestamps vào game.json
"""

import json
from datetime import datetime, timedelta
import random

def generate_timestamps():
    """Generate timestamps cho tất cả user interactions"""
    
    # Load data
    print("📂 Loading game.json...")
    with open('game.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"✓ Loaded {len(data['users'])} users")
    
    # Generate timestamps cho mỗi user
    for user in data['users']:
        user_id = user['id']
        print(f"\n👤 Processing User {user_id}: {user['name']}")
        
        # Favorite games timestamps (10-30 ngày gần đây)
        if 'favorite_games' in user and user['favorite_games']:
            user['favorite_games_timestamps'] = {}
            for game_id in user['favorite_games']:
                days_ago = random.randint(10, 30)
                timestamp = datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
                user['favorite_games_timestamps'][str(game_id)] = timestamp.strftime("%Y-%m-%dT%H:%M:%S")
            print(f"  ⭐ Generated {len(user['favorite_games_timestamps'])} favorite timestamps")
        
        # Purchased games timestamps (5-25 ngày gần đây)
        if 'purchased_games' in user and user['purchased_games']:
            user['purchased_games_timestamps'] = {}
            for game_id in user['purchased_games'].keys():
                days_ago = random.randint(5, 25)
                timestamp = datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
                user['purchased_games_timestamps'][str(game_id)] = timestamp.strftime("%Y-%m-%dT%H:%M:%S")
            print(f"  💰 Generated {len(user['purchased_games_timestamps'])} purchased timestamps")
        
        # View history timestamps (1-14 ngày gần đây - recent views)
        if 'view_history' in user and user['view_history']:
            user['view_history_timestamps'] = {}
            for game_id in user['view_history'].keys():
                days_ago = random.randint(1, 14)  # Views are more recent
                timestamp = datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
                user['view_history_timestamps'][str(game_id)] = timestamp.strftime("%Y-%m-%dT%H:%M:%S")
            print(f"  👁️  Generated {len(user['view_history_timestamps'])} view timestamps")
    
    # Save to new file
    output_file = 'game_with_timestamps.json'
    print(f"\n💾 Saving to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ SUCCESS! Generated timestamps and saved to {output_file}")
    print("\n📌 Next steps:")
    print("   1. Review game_with_timestamps.json")
    print("   2. Backup current game.json: copy game.json game_backup.json")
    print("   3. Replace: copy game_with_timestamps.json game.json")
    print("   4. Test: python game_recommendation_system.py --user 1 --adaptive 1 --days 7")

if __name__ == "__main__":
    print("=" * 70)
    print("🕐 TIMESTAMP GENERATOR FOR GAME RECOMMENDATION SYSTEM")
    print("=" * 70)
    print()
    
    try:
        generate_timestamps()
    except FileNotFoundError:
        print("❌ Error: game.json not found!")
        print("   Make sure you're in the correct directory (predict/)")
    except Exception as e:
        print(f"❌ Error: {e}")

