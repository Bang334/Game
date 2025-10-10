"""Test API recommendations endpoint"""
import requests
import json
import time

# Đợi server khởi động
print("⏳ Waiting for server to start...")
time.sleep(8)

# Test API
print("\n🧪 Testing API: /api/recommendations/3?top_n=3")
print("=" * 60)

try:
    response = requests.get("http://localhost:5000/api/recommendations/3?top_n=3")
    
    if response.status_code == 200:
        data = response.json()
        
        # Print summary
        print(f"✅ Status: {response.status_code}")
        print(f"📊 User ID: {data['user_id']}")
        print(f"🎮 Total games: {data['total']}")
        print(f"🔍 Keyword: {data.get('keyword', 'None')}")
        print("\n" + "=" * 60)
        
        # Print games
        for i, game in enumerate(data['games'], 1):
            print(f"\n{i}. {game['name']} (ID: {game['id']})")
            print(f"   Score: {game['score']:.4f} (Boost: x{game['boost_factor']:.2f})")
            print(f"   Publisher: {game['publisher']}")
            print(f"   Genre: {', '.join(game['genre'])}")
            print(f"   Price: {game['price']:,} VND")
            print(f"   Platform: {', '.join(game['platform'])}")
        
        print("\n" + "=" * 60)
        print("✅ API TEST SUCCESSFUL!")
        
    else:
        print(f"❌ Error: Status {response.status_code}")
        print(response.text)
        
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to server. Make sure Flask is running on port 5000.")
except Exception as e:
    print(f"❌ Error: {e}")

