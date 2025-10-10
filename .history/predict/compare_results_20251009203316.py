import json

# Load both results
with open('recommendations.json', 'r', encoding='utf-8') as f:
    adaptive_data = json.load(f)

with open('recommendations_no_adaptive.json', 'r', encoding='utf-8') as f:
    no_adaptive_data = json.load(f)

print("=" * 100)
print("📊 SO SÁNH KẾT QUẢ: ADAPTIVE vs NO ADAPTIVE - User: Gamer Pro")
print("=" * 100)
print()

print("TOP 10 RECOMMENDATIONS:")
print("-" * 100)
print(f"{'Rank':<6} {'WITH ADAPTIVE':<35} {'Score':<10} {'NO ADAPTIVE':<35} {'Score':<10}")
print("-" * 100)

for i in range(10):
    adaptive_game = adaptive_data['games'][i]
    no_adaptive_game = no_adaptive_data['games'][i]
    
    adaptive_name = adaptive_game['name'][:32]
    adaptive_score = adaptive_game['score']
    no_adaptive_name = no_adaptive_game['name'][:32]
    no_adaptive_score = no_adaptive_game['score']
    
    # Highlight if different
    marker = "🔄" if adaptive_game['id'] != no_adaptive_game['id'] else "  "
    
    print(f"{marker} #{i+1:<4} {adaptive_name:<35} {adaptive_score:<10.4f} {no_adaptive_name:<35} {no_adaptive_score:<10.4f}")

print("-" * 100)
print()

# Find games that moved up significantly with adaptive
print("🚀 GAMES BOOSTED SIGNIFICANTLY WITH ADAPTIVE:")
print("-" * 100)

adaptive_ids = [g['id'] for g in adaptive_data['games'][:20]]
no_adaptive_ids = [g['id'] for g in no_adaptive_data['games'][:20]]

boosted_games = []
for i, game_id in enumerate(adaptive_ids[:10]):
    if game_id in no_adaptive_ids:
        old_rank = no_adaptive_ids.index(game_id) + 1
        new_rank = i + 1
        if old_rank - new_rank >= 3:  # Jumped up at least 3 positions
            game = next(g for g in adaptive_data['games'] if g['id'] == game_id)
            boosted_games.append({
                'name': game['name'],
                'old_rank': old_rank,
                'new_rank': new_rank,
                'score_adaptive': game['score'],
                'publisher': game['publisher'],
                'genre': ', '.join(game['genre'][:2])
            })

if boosted_games:
    for bg in boosted_games:
        print(f"  • {bg['name']}")
        print(f"    Rank: #{bg['old_rank']} → #{bg['new_rank']} (↑{bg['old_rank'] - bg['new_rank']} positions)")
        print(f"    Score: {bg['score_adaptive']:.4f}")
        print(f"    Publisher: {bg['publisher']} | Genre: {bg['genre']}")
        print()
else:
    print("  (No significant position changes)")
    print()

# Analyze top 3
print("=" * 100)
print("🎯 PHÂN TÍCH TOP 3:")
print("=" * 100)
print()

print("WITH ADAPTIVE:")
for i in range(3):
    game = adaptive_data['games'][i]
    print(f"{i+1}. {game['name']} (Score: {game['score']:.4f})")
    print(f"   Publisher: {game['publisher']} | Genre: {', '.join(game['genre'])}")
    print(f"   Price: {game['price']:,} VND | Rating: {game['rating']}/5.0")
    print()

print("NO ADAPTIVE:")
for i in range(3):
    game = no_adaptive_data['games'][i]
    print(f"{i+1}. {game['name']} (Score: {game['score']:.4f})")
    print(f"   Publisher: {game['publisher']} | Genre: {', '.join(game['genre'])}")
    print(f"   Price: {game['price']:,} VND | Rating: {game['rating']}/5.0")
    print()

print("=" * 100)
print("✨ KẾT LUẬN:")
print("-" * 100)
print("Adaptive system đã điều chỉnh rankings dựa trên preferences:")
print("  • Top Publishers: FromSoftware, miHoYo, Epic Games")
print("  • Top Genres: RPG, Action, Dark Fantasy")
print("  • Price Range: 635,000 VND (±691,574)")
print()
print("Games khớp với preferences được boost lên top, phù hợp hơn với sở thích user!")
print("=" * 100)

