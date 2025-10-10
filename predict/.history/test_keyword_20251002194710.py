from game_recommendation_system import GameRecommendationSystem

def test_keyword_search():
    print("Testing Keyword Search...")
    
    # Khởi tạo hệ thống
    recommender = GameRecommendationSystem()
    recommender.load_data()
    recommender.preprocess_data()
    recommender.train_svd_model(k=2)
    recommender.build_content_similarity()
    
    print("\n" + "="*60)
    print("KEYWORD SEARCH DEMO")
    print("="*60)
    
    # Test với các keywords khác nhau
    test_cases = [
        {"user_id": 1, "keyword": "action", "description": "Tim game Action"},
        {"user_id": 1, "keyword": "8gb", "description": "Tim game can 8GB RAM"},
        {"user_id": 2, "keyword": "puzzle", "description": "Tim game Puzzle"},
        {"user_id": 3, "keyword": "mobile", "description": "Tim game Mobile"},
        {"user_id": 1, "keyword": "rtx", "description": "Tim game can RTX"},
    ]
    
    for test in test_cases:
        print(f"\n{'='*50}")
        print(f"TEST: {test['description']}")
        print(f"User ID: {test['user_id']}, Keyword: '{test['keyword']}'")
        print("="*50)
        
        recommendations = recommender.get_hybrid_recommendations(
            user_id=test['user_id'],
            top_n=5,
            keyword=test['keyword']
        )
        
        print(f"\nTop 5 recommendations for keyword '{test['keyword']}':")
        for i, rec in enumerate(recommendations, 1):
            print(f"{i}. {rec['game_name']}")
            print(f"   Hybrid Score: {rec['hybrid_score']:.3f}")
            if rec.get('keyword_score', 0) > 0:
                print(f"   Keyword Score: {rec['keyword_score']:.3f}")
            print(f"   Genre: {', '.join(rec['genre'])}")
            print("-" * 30)
    
    print("\nKeyword search test completed!")

if __name__ == "__main__":
    test_keyword_search()
