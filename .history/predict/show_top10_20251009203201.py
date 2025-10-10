import json

# Load recommendations
with open('recommendations.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("=" * 80)
print("🎮 TOP 10 ADAPTIVE RECOMMENDATIONS - User: Gamer Pro")
print("=" * 80)
print()

for i, game in enumerate(data['games'][:10], 1):
    score = game['score']
    name = game['name']
    publisher = game['publisher']
    genres = ', '.join(game['genre'])
    price = game['price']
    rating = game['rating']
    
    print(f"{i}. {name}")
    print(f"   📊 Score: {score:.4f}")
    print(f"   🏢 Publisher: {publisher}")
    print(f"   🎯 Genre: {genres}")
    print(f"   💰 Price: {price:,} VND")
    print(f"   ⭐ Rating: {rating}/5.0")
    print()

print("=" * 80)
print("\n✨ Phân tích Adaptive Boost:")
print("-" * 80)
print("User preferences:")
print("  • Top Publishers: FromSoftware, miHoYo, Epic Games")
print("  • Top Genres: RPG, Action, Dark Fantasy")
print("  • Price Range: 635,000 VND (±691,574)")
print()
print("Games được boost cao vì:")
print("  1. Khớp với publisher user thường chọn → x1.3-1.5 boost")
print("  2. Khớp với genre yêu thích (RPG, Action) → x1.25-1.4 boost")
print("  3. Trong khoảng giá quen thuộc → x1.2 boost")
print("=" * 80)

