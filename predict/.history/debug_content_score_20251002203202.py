#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from game_recommendation_system import GameRecommendationSystem
import numpy as np

def debug_content_score():
    """Debug Content Score khi thay doi gia Red Dead Redemption 2"""
    
    print("DEBUG CONTENT SCORE ANALYSIS")
    print("=" * 80)
    
    # Test 2 gia tri khac nhau
    prices = [1200000, 1500000]
    
    for price in prices:
        print(f"\n--- TESTING WITH RED DEAD PRICE = {price:,} VND ---")
        
        # Khoi tao he thong
        recommender = GameRecommendationSystem()
        recommender.load_data()
        
        # Thay doi gia Red Dead Redemption 2 (game id = 7)
        for game in recommender.games_data:
            if game['id'] == 7:  # Red Dead Redemption 2
                game['price'] = price
                print(f"Set Red Dead price to: {price:,}")
                break
        
        # Preprocess va build content similarity
        recommender.preprocess_data()
        recommender.build_content_similarity()
        
        # Lay thong tin User 1
        user_1_games = []
        for game in recommender.games_data:
            if game['id'] in [1, 2, 3, 4]:  # Games User 1 da tuong tac
                user_1_games.append((game['name'], game['price']))
        
        print(f"User 1 interacted games:")
        for name, game_price in user_1_games:
            print(f"  {name}: {game_price:,} VND")
        
        avg_price = sum(p for _, p in user_1_games) / len(user_1_games)
        print(f"Average price: {avg_price:,.0f} VND")
        
        # Tim Red Dead trong games_data
        red_dead_idx = None
        for i, game in enumerate(recommender.games_data):
            if game['id'] == 7:
                red_dead_idx = i
                break
        
        if red_dead_idx is not None:
            # Lay content similarity cua Red Dead voi cac games User 1 thich
            user_1_game_indices = []
            for i, game in enumerate(recommender.games_data):
                if game['id'] in [1, 2, 3, 4]:
                    user_1_game_indices.append(i)
            
            print(f"\nRed Dead content similarities:")
            similarities = []
            for idx in user_1_game_indices:
                similarity = recommender.content_similarity_matrix[red_dead_idx, idx]
                game_name = recommender.games_data[idx]['name']
                similarities.append(similarity)
                print(f"  vs {game_name}: {similarity:.4f}")
            
            avg_similarity = np.mean(similarities)
            print(f"Average similarity with User 1 games: {avg_similarity:.4f}")
            
            # Tinh Content Score truc tiep
            # Content score = trung binh similarity voi cac games user da thich
            content_score = avg_similarity
            print(f"Red Dead Content Score for User 1: {content_score:.4f}")
        
        print("-" * 60)

if __name__ == "__main__":
    debug_content_score()
