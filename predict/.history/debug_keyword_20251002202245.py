#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from game_recommendation_system import GameRecommendationSystem

def debug_keyword_score():
    """Debug keyword score cho cac game cu the"""
    
    # Khoi tao he thong
    recommender = GameRecommendationSystem()
    recommender.load_data()
    
    # Test query
    keyword = "game hanh dong kich tinh dang so"
    
    # Test games
    test_games = [
        "Red Dead Redemption 2",
        "Among Us", 
        "The Witcher 3",
        "Elden Ring",
        "Tetris"
    ]
    
    print("DEBUG KEYWORD SCORE ANALYSIS")
    print("=" * 80)
    print(f"Query: '{keyword}'")
    print("=" * 80)
    
    for game_name in test_games:
        # Tim game
        game = None
        for g in recommender.games_data:
            if g['name'] == game_name:
                game = g
                break
        
        if game:
            score = recommender.get_keyword_score(game, keyword, debug=True)

if __name__ == "__main__":
    debug_keyword_score()
