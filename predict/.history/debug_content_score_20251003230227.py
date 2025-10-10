import json
import numpy as np
from game_recommendation_system import GameRecommendationSystem

def debug_content_score():
    """Debug chi tiết cách tính content score"""
    
    # Load data
    recommender = GameRecommendationSystem()
    recommender.load_data()
    recommender.preprocess_data()
    recommender.train_svd_model()
    recommender.build_content_similarity()
    
    # Lấy user data
    user_data = next((u for u in recommender.users_data if u['id'] == 2), None)  # Casual Player
    favorite_games = user_data.get('favorite_games', [])
    purchased_games = user_data.get('purchased_games', [])
    view_history = user_data.get('view_history', {})
    
    print("=== DEBUG CONTENT SCORE CALCULATION ===")
    print(f"User: {user_data.get('name', 'Unknown')}")
    print(f"Favorite Games: {favorite_games}")
    print(f"Purchased Games: {purchased_games}")
    print(f"View History: {view_history}")
    print()
    
    # Tạo danh sách games với trọng số từ view history
    view_games_weighted = []
    for game_id, view_count in view_history.items():
        view_games_weighted.extend([game_id] * view_count)
    
    interacted_games = favorite_games + purchased_games + view_games_weighted
    unique_interacted = set(interacted_games)
    
    print(f"Interacted Games (with duplicates): {interacted_games}")
    print(f"Unique Interacted Games: {unique_interacted}")
    print(f"Total interacted games: {len(interacted_games)}")
    print(f"Unique games: {len(unique_interacted)}")
    print()
    
    # Debug một số games cụ thể
    test_games = [1, 2, 3, 4, 5]  # Test first 5 games
    
    for game_id in test_games:
        if game_id in unique_interacted:
            print(f"Game {game_id}: SKIPPED (already interacted)")
            continue
            
        game = recommender.games_data[game_id - 1]
        game_name = game.get('name', f'Game {game_id}')
        
        print(f"=== DEBUG GAME {game_id}: {game_name} ===")
        
        similarity_scores = []
        for i, interacted_game_id in enumerate(interacted_games):
            try:
                game_id_int = int(interacted_game_id)
                if 1 <= game_id_int <= len(recommender.games_data):
                    sim_score = recommender.content_similarity_matrix[game_id_int - 1][game_id - 1]
                    similarity_scores.append(sim_score)
                    
                    if i < 5:  # Chỉ in 5 similarity đầu
                        interacted_game = recommender.games_data[game_id_int - 1]
                        print(f"  vs Game {game_id_int} ({interacted_game.get('name', 'Unknown')}): {sim_score:.6f}")
            except (ValueError, TypeError) as e:
                print(f"  Error with game_id {interacted_game_id}: {e}")
                continue
        
        if similarity_scores:
            content_score = np.mean(similarity_scores)
            print(f"  Similarity scores: {len(similarity_scores)} values")
            print(f"  Min similarity: {min(similarity_scores):.6f}")
            print(f"  Max similarity: {max(similarity_scores):.6f}")
            print(f"  Mean similarity: {content_score:.6f}")
        else:
            print(f"  No similarity scores found!")
        
        print()
    
    # Kiểm tra similarity matrix
    print("=== SIMILARITY MATRIX DEBUG ===")
    print(f"Matrix shape: {recommender.content_similarity_matrix.shape}")
    print(f"Matrix range: {recommender.content_similarity_matrix.min():.6f} to {recommender.content_similarity_matrix.max():.6f}")
    print(f"Matrix mean: {recommender.content_similarity_matrix.mean():.6f}")
    print(f"Zero values: {np.sum(recommender.content_similarity_matrix == 0)}")
    print(f"Negative values: {np.sum(recommender.content_similarity_matrix < 0)}")
    print()
    
    # Kiểm tra một số cặp games cụ thể
    print("=== SPECIFIC GAME PAIRS DEBUG ===")
    for i in range(min(3, len(recommender.games_data))):
        for j in range(min(3, len(recommender.games_data))):
            if i != j:
                sim = recommender.content_similarity_matrix[i][j]
                game1 = recommender.games_data[i].get('name', f'Game {i+1}')
                game2 = recommender.games_data[j].get('name', f'Game {j+1}')
                print(f"  {game1} vs {game2}: {sim:.6f}")

if __name__ == "__main__":
    debug_content_score()
