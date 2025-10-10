#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from game_recommendation_system import GameRecommendationSystem

def test_expand_query():
    """Test ham expand_query voi cac tu tieng Viet"""
    
    # Khoi tao he thong
    recommender = GameRecommendationSystem()
    recommender.load_data()
    
    # Test cases
    test_cases = [
        "hanh dong",
        "giai do",
        "thu gian", 
        "kinh di",
        "chien thuat",
        "tieng viet",
        "mobile",
        "action"
    ]
    
    print("TEST EXPAND QUERY FUNCTION")
    print("=" * 50)
    
    for query in test_cases:
        expanded = recommender.expand_query(query)
        print(f"Query: {query}")
        print(f"Expanded: {expanded}")
        print("-" * 40)

if __name__ == "__main__":
    test_expand_query()
