#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from game_recommendation_system import GameRecommendationSystem

def test_expand_query():
    """Test hàm expand_query với các từ tiếng Việt"""
    
    # Khởi tạo hệ thống
    recommender = GameRecommendationSystem()
    recommender.load_data()
    
    # Test cases
    test_cases = [
        "hành động",
        "game hành động kịch tính đáng sợ", 
        "giải đố thư giãn",
        "nhập vai",
        "kinh dị",
        "chiến thuật",
        "tiếng việt",
        "mobile",
        "action"  # Từ tiếng Anh
    ]
    
    print("="*80)
    print("TEST EXPAND QUERY FUNCTION")
    print("="*80)
    
    for query in test_cases:
        expanded = recommender.expand_query(query)
        print(f"\nQuery goc: '{query}'")
        print(f"Expanded:  '{expanded}'")
        print("-" * 60)

if __name__ == "__main__":
    test_expand_query()
