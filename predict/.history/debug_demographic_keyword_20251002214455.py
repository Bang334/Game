from game_recommendation_system import GameRecommendationSystem

def debug_demographic_vs_keyword():
    """Debug tại sao game có demographic score thì không có keyword score"""
    
    # Khởi tạo hệ thống
    recommender = GameRecommendationSystem()
    recommender.load_data()
    recommender.preprocess_data()
    recommender.train_svd_model(k=2)
    recommender.build_content_similarity()
    
    # Lấy thông tin user 2
    user_2 = next((u for u in recommender.users_data if u['id'] == 2), None)
    print(f"USER 2: {user_2['name']}, Age: {user_2['age']}, Gender: {user_2['gender']}")
    print(f"Favorite games: {user_2['favorite_games']}")
    print(f"Purchased games: {user_2['purchased_games']}")
    
    print("\n" + "="*80)
    print("PHÂN TÍCH DEMOGRAPHIC SIMILARITY")
    print("="*80)
    
    # Phân tích demographic similarity với các user khác
    for other_user in recommender.users_data:
        if other_user['id'] == 2:
            continue
        
        demo_sim = recommender.calculate_demographic_similarity(user_2, other_user)
        if demo_sim > 0:
            print(f"User {other_user['id']} ({other_user['name']}) - Age: {other_user['age']}, Gender: {other_user['gender']}")
            print(f"  Demographic similarity: {demo_sim:.3f}")
            print(f"  Favorite games: {other_user['favorite_games']}")
            print(f"  Purchased games: {other_user['purchased_games']}")
            print()
    
    print("\n" + "="*80)
    print("PHÂN TÍCH KEYWORD SCORE CHO 'action'")
    print("="*80)
    
    # Phân tích keyword score cho một số games
    test_games = [1, 4, 8, 9, 12]  # Một số games để test
    for game_id in test_games:
        game = next((g for g in recommender.games_data if g['id'] == game_id), None)
        if game:
            keyword_score = recommender.get_keyword_score(game, "action", debug=True)
            print(f"\nGame {game_id} ({game['name']}) - Keyword Score: {keyword_score:.3f}")
    
    print("\n" + "="*80)
    print("PHÂN TÍCH GAMES CÓ DEMOGRAPHIC SCORE")
    print("="*80)
    
    # Lấy demographic recommendations
    demo_recs = recommender.get_demographic_recommendations(2, top_n=10)
    print("Games có demographic score:")
    for rec in demo_recs:
        print(f"  Game {rec['game_id']} ({rec['game_name']}) - Demo Score: {rec['demographic_score']:.3f}")
    
    print("\n" + "="*80)
    print("PHÂN TÍCH GAMES CÓ KEYWORD SCORE")
    print("="*80)
    
    # Kiểm tra keyword score cho tất cả games
    print("Games có keyword score > 0 với 'action':")
    for game in recommender.games_data:
        keyword_score = recommender.get_keyword_score(game, "action")
        if keyword_score > 0:
            print(f"  Game {game['id']} ({game['name']}) - Keyword Score: {keyword_score:.3f}")
            print(f"    Genre: {game.get('genre', [])}")
            print(f"    Description: {game.get('description', '')[:100]}...")
            print()

if __name__ == "__main__":
    debug_demographic_vs_keyword()
