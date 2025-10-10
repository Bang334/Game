import json
import numpy as np
from game_recommendation_system import GameRecommendationSystem

def debug_content_scores():
    """Debug chi tiết content scores để tìm lỗi"""
    
    # Load data
    recommender = GameRecommendationSystem()
    recommender.load_data()
    recommender.preprocess_data()
    recommender.train_svd_model()
    recommender.build_content_similarity()
    
    # Lấy user data (Puzzle Solver - ID: 20)
    user_data = next((u for u in recommender.users_data if u['id'] == 20), None)
    if not user_data:
        print("Không tìm thấy user 20!")
        return
    
    favorite_games = user_data.get('favorite_games', [])
    purchased_games = user_data.get('purchased_games', [])
    view_history = user_data.get('view_history', {})
    
    view_games_weighted = []
    for game_id, view_count in view_history.items():
        view_games_weighted.extend([game_id] * view_count)
    
    interacted_games = favorite_games + purchased_games + view_games_weighted
    unique_interacted = set(interacted_games)
    
    print("=== DEBUG CONTENT SCORES - PUZZLE SOLVER (ID: 20) ===\n")
    print(f"User: {user_data.get('name', 'Unknown')}")
    print(f"Age: {user_data.get('age', 'Unknown')}")
    print(f"Gender: {user_data.get('gender', 'Unknown')}")
    print(f"Favorite Games: {favorite_games}")
    print(f"Purchased Games: {purchased_games}")
    print(f"View History: {view_history}")
    print(f"All Interacted Games: {interacted_games}")
    print(f"Unique Interacted Games: {unique_interacted}")
    print()
    
    # Debug similarity matrix
    print("=== DEBUG SIMILARITY MATRIX ===")
    print(f"Similarity matrix shape: {recommender.content_similarity_matrix.shape}")
    print(f"Similarity matrix range: {recommender.content_similarity_matrix.min():.3f} - {recommender.content_similarity_matrix.max():.3f}")
    print(f"Similarity matrix mean: {recommender.content_similarity_matrix.mean():.3f}")
    print()
    
    # Debug một số games cụ thể
    test_games = [1, 2, 3, 4, 5]  # Test một vài games
    for game_id in test_games:
        if game_id in unique_interacted:
            continue
            
        game = recommender.games_data[game_id - 1]
        game_name = game.get('name', f'Game {game_id}')
        
        print(f"=== DEBUG GAME: {game_name} (ID: {game_id}) ===")
        print(f"Game genre: {game.get('genre', [])}")
        print(f"Game publisher: {game.get('publisher', '')}")
        print(f"Game platform: {game.get('platform', [])}")
        
        # Tính similarity với từng game đã tương tác
        similarity_scores = []
        for interacted_game_id in interacted_games:
            try:
                game_id_int = int(interacted_game_id)
                if 1 <= game_id_int <= len(recommender.games_data):
                    sim_score = recommender.content_similarity_matrix[game_id_int - 1][game_id - 1]
                    similarity_scores.append(sim_score)
                    
                    # Lấy thông tin game đã tương tác
                    interacted_game = recommender.games_data[game_id_int - 1]
                    interacted_name = interacted_game.get('name', f'Game {game_id_int}')
                    
                    print(f"  vs {interacted_name}: {sim_score:.3f}")
            except Exception as e:
                print(f"  Error with game {interacted_game_id}: {e}")
        
        if similarity_scores:
            content_score = np.mean(similarity_scores)
            print(f"Content Score: {content_score:.3f}")
            print(f"Similarity scores: {similarity_scores}")
        else:
            print("No similarity scores calculated!")
        
        print("-" * 50)
        print()
    
    # Debug games có content score = 0
    print("=== DEBUG GAMES WITH CONTENT SCORE = 0 ===")
    zero_games = []
    
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
            if abs(content_score) < 0.001:  # Gần như 0
                zero_games.append((game_name, content_score, similarity_scores))
    
    print(f"Games with content score ≈ 0: {len(zero_games)}")
    for game_name, score, similarities in zero_games[:10]:  # Chỉ hiển thị 10 games đầu
        print(f"Game: {game_name}")
        print(f"Content Score: {score:.6f}")
        print(f"Individual similarities: {similarities}")
        print("-" * 30)

if __name__ == "__main__":
    debug_content_scores()
