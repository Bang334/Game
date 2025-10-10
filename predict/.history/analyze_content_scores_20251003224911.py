import json
import numpy as np
from game_recommendation_system import GameRecommendationSystem

def analyze_content_scores():
    """Phân tích chi tiết content scores âm vs 0"""
    
    # Load data
    recommender = GameRecommendationSystem()
    recommender.load_data()
    recommender.preprocess_data()
    recommender.train_svd_model()
    recommender.build_content_similarity()
    
    # Lấy user data
    user_data = next((u for u in recommender.users_data if u['id'] == 1), None)
    favorite_games = user_data.get('favorite_games', [])
    purchased_games = user_data.get('purchased_games', [])
    view_history = user_data.get('view_history', {})
    
    view_games_weighted = []
    for game_id, view_count in view_history.items():
        view_games_weighted.extend([game_id] * view_count)
    
    interacted_games = favorite_games + purchased_games + view_games_weighted
    unique_interacted = set(interacted_games)
    
    print("=== PHÂN TÍCH CONTENT SCORES ÂM VS 0 ===\n")
    
    # Phân loại games
    negative_games = []
    zero_games = []
    positive_games = []
    
    for game_id in range(1, len(recommender.games_data) + 1):
        if game_id in unique_interacted:
            continue
            
        game = recommender.games_data[game_id - 1]
        game_name = game.get('name', f'Game {game_id}')
        
        # Tính content score
        similarity_scores = []
        for interacted_game_id in interacted_games:
            try:
                game_id_int = int(interacted_game_id)
                if 1 <= game_id_int <= len(recommender.games_data):
                    sim_score = recommender.content_similarity_matrix[game_id_int - 1][game_id - 1]
                    similarity_scores.append(sim_score)
            except:
                continue
        
        if similarity_scores:
            content_score = np.mean(similarity_scores)
            
            if content_score < 0:
                negative_games.append((game_name, content_score, game))
            elif content_score == 0:
                zero_games.append((game_name, content_score, game))
            else:
                positive_games.append((game_name, content_score, game))
    
    # In kết quả
    print(f"📊 THỐNG KÊ TỔNG QUAN:")
    print(f"Games có content score âm: {len(negative_games)}")
    print(f"Games có content score = 0: {len(zero_games)}")
    print(f"Games có content score dương: {len(positive_games)}")
    print()
    
    # Phân tích games âm
    print("🔴 GAMES CÓ CONTENT SCORE ÂM (ĐỐI LẬP):")
    print("=" * 60)
    for game_name, score, game in sorted(negative_games, key=lambda x: x[1]):
        print(f"Game: {game_name}")
        print(f"Content Score: {score:.3f}")
        print(f"Genre: {game.get('genre', [])}")
        print(f"Publisher: {game.get('publisher', '')}")
        print(f"Platform: {game.get('platform', [])}")
        print(f"Mode: {game.get('mode', '')}")
        print(f"Multiplayer: {game.get('multiplayer', False)}")
        print("-" * 40)
    print()
    
    # Phân tích games = 0
    print("⚪ GAMES CÓ CONTENT SCORE = 0 (KHÔNG LIÊN QUAN):")
    print("=" * 60)
    for game_name, score, game in zero_games[:10]:  # Chỉ hiển thị 10 games đầu
        print(f"Game: {game_name}")
        print(f"Content Score: {score:.3f}")
        print(f"Genre: {game.get('genre', [])}")
        print(f"Publisher: {game.get('publisher', '')}")
        print(f"Platform: {game.get('platform', [])}")
        print(f"Mode: {game.get('mode', '')}")
        print(f"Multiplayer: {game.get('multiplayer', False)}")
        print("-" * 40)
    print()
    
    # Phân tích games dương
    print("🟢 GAMES CÓ CONTENT SCORE DƯƠNG (TƯƠNG TỰ):")
    print("=" * 60)
    for game_name, score, game in sorted(positive_games, key=lambda x: x[1], reverse=True)[:10]:
        print(f"Game: {game_name}")
        print(f"Content Score: {score:.3f}")
        print(f"Genre: {game.get('genre', [])}")
        print(f"Publisher: {game.get('publisher', '')}")
        print(f"Platform: {game.get('platform', [])}")
        print(f"Mode: {game.get('mode', '')}")
        print(f"Multiplayer: {game.get('multiplayer', False)}")
        print("-" * 40)
    print()
    
    # Phân tích user preferences
    print("👤 USER PREFERENCES (Gamer Pro):")
    print("=" * 60)
    print(f"Favorite Games: {favorite_games}")
    print(f"Purchased Games: {purchased_games}")
    print(f"View History: {view_history}")
    print()
    
    # Phân tích genre patterns
    print("🎮 PHÂN TÍCH GENRE PATTERNS:")
    print("=" * 60)
    
    # Lấy genres từ games đã tương tác
    interacted_genres = set()
    for game_id in interacted_games:
        try:
            game_id_int = int(game_id)
            if 1 <= game_id_int <= len(recommender.games_data):
                game = recommender.games_data[game_id_int - 1]
                genres = game.get('genre', [])
                interacted_genres.update(genres)
        except:
            continue
    
    print(f"Genres từ games đã tương tác: {sorted(interacted_genres)}")
    print()
    
    # Phân tích negative games
    negative_genres = set()
    for _, _, game in negative_games:
        genres = game.get('genre', [])
        negative_genres.update(genres)
    
    print(f"Genres từ games âm: {sorted(negative_genres)}")
    print()
    
    # Phân tích zero games
    zero_genres = set()
    for _, _, game in zero_games:
        genres = game.get('genre', [])
        zero_genres.update(genres)
    
    print(f"Genres từ games = 0: {sorted(zero_genres)}")
    print()
    
    # So sánh
    print("🔍 SO SÁNH GENRE PATTERNS:")
    print("=" * 60)
    print(f"Genres chung giữa interacted và negative: {sorted(interacted_genres & negative_genres)}")
    print(f"Genres chung giữa interacted và zero: {sorted(interacted_genres & zero_genres)}")
    print(f"Genres chỉ có trong negative: {sorted(negative_genres - interacted_genres)}")
    print(f"Genres chỉ có trong zero: {sorted(zero_genres - interacted_genres)}")

if __name__ == "__main__":
    analyze_content_scores()
