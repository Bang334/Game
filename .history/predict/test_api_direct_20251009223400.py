"""Test API logic directly without Flask server"""
import json
import sys

# Import recommendation system
from game_recommendation_system import GameRecommendationSystem

print("🚀 Initializing Game Recommendation System...")
recommender = GameRecommendationSystem()
recommender.load_data()
recommender.preprocess_data()
recommender.train_svd_model()
recommender.build_content_similarity()
print("✅ System ready!")

# Simulate API call
user_id = 3
top_n = 5
keyword = ""

print(f"\n{'='*60}")
print(f"📊 Testing API Logic for User {user_id}")
print(f"{'='*60}")

# Get recommendations (same as API)
recommendations = recommender.get_hybrid_recommendations(
    user_id=user_id,
    top_n=top_n,
    keyword=keyword,
    enable_adaptive=True,
    recent_days=7
)

# Format response (same as API endpoint)
games_list = []
for rec in recommendations:
    game_full_info = next((g for g in recommender.games_data if g['id'] == rec['game_id']), None)
    
    if game_full_info:
        game_info = {
            "id": rec['game_id'],
            "name": rec['game_name'],
            "description": game_full_info.get('description', '')[:100] + "...",
            "publisher": game_full_info.get('publisher', ''),
            "genre": rec.get('genre', []),
            "price": rec.get('price', 0),
            "score": rec.get('hybrid_score', 0),
            "boost_factor": rec.get('boost_factor', 1.0),
            "platform": game_full_info.get('platform', [])
        }
        games_list.append(game_info)

# Create response object
response = {
    "user_id": user_id,
    "total": len(games_list),
    "keyword": keyword if keyword else None,
    "games": games_list
}

# Print formatted output
print(f"\n✅ Response created successfully!")
print(f"📊 User ID: {response['user_id']}")
print(f"🎮 Total games: {response['total']}")
print(f"🔍 Keyword: {response.get('keyword', 'None')}")

print(f"\n{'='*60}")
print("🎮 RECOMMENDED GAMES:")
print(f"{'='*60}")

for i, game in enumerate(response['games'], 1):
    print(f"\n{i}. {game['name']} (ID: {game['id']})")
    print(f"   📊 Score: {game['score']:.4f} (Boost: ×{game['boost_factor']:.2f})")
    print(f"   🏢 Publisher: {game['publisher']}")
    print(f"   🎯 Genre: {', '.join(game['genre'])}")
    print(f"   💰 Price: {game['price']:,} VND")
    print(f"   🖥️  Platform: {', '.join(game['platform'])}")

print(f"\n{'='*60}")
print("✅ API LOGIC TEST COMPLETED!")
print(f"{'='*60}")

# Save to file for inspection
with open('api_response_sample.json', 'w', encoding='utf-8') as f:
    json.dump(response, f, ensure_ascii=False, indent=2)
print("\n💾 Full response saved to: api_response_sample.json")

