#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from game_recommendation_system import GameRecommendationSystem

def analyze_keyword_score():
    """Phan tich chi tiet cach tinh Keyword Score"""
    
    # Khoi tao he thong
    recommender = GameRecommendationSystem()
    recommender.load_data()
    
    # Test cases
    test_cases = [
        ("hanh dong", "Red Dead Redemption 2"),
        ("hanh dong", "Elden Ring"), 
        ("hanh dong", "Among Us"),
        ("kinh di", "Red Dead Redemption 2"),
        ("kinh di", "Among Us")
    ]
    
    print("PHAN TICH KEYWORD SCORE")
    print("=" * 80)
    
    for keyword, game_name in test_cases:
        # Tim game
        game = None
        for g in recommender.games_data:
            if g['name'] == game_name:
                game = g
                break
        
        if not game:
            continue
            
        print(f"\nKeyword: '{keyword}' | Game: '{game_name}'")
        print("-" * 60)
        
        # Mo rong keyword
        expanded = recommender.expand_query(keyword)
        print(f"Expanded keywords: {expanded}")
        
        keywords_to_search = expanded.lower().split()
        print(f"Keywords to search: {keywords_to_search}")
        
        score = 0.0
        details = []
        
        # Kiem tra text fields
        searchable_fields = {
            'name': 3.0,
            'description': 2.0,
            'genre': 2.5,
            'publisher': 1.5,
            'platform': 1.5,
            'language': 1.5,
            'mode': 1.0,
            'age_rating': 1.0,
        }
        
        for field, weight in searchable_fields.items():
            field_value = game.get(field, '')
            if isinstance(field_value, list):
                field_value = ' '.join(field_value)
            field_value = str(field_value).lower()
            
            found = False
            for kw in keywords_to_search:
                if kw in field_value:
                    score += weight
                    details.append(f"  {field} ({weight}): '{field_value}' contains '{kw}'")
                    found = True
                    break
            
            if not found:
                details.append(f"  {field} (0): '{field_value}' - no match")
        
        # Kiem tra specs
        min_spec = game.get('min_spec', {})
        rec_spec = game.get('rec_spec', {})
        
        spec_fields = ['cpu', 'gpu', 'ram', 'storage']
        for spec_field in spec_fields:
            min_val = str(min_spec.get(spec_field, '')).lower()
            rec_val = str(rec_spec.get(spec_field, '')).lower()
            
            found = False
            for kw in keywords_to_search:
                if kw in min_val or kw in rec_val:
                    score += 1.5
                    details.append(f"  {spec_field} (1.5): '{min_val}' or '{rec_val}' contains '{kw}'")
                    found = True
                    break
            
            if not found:
                details.append(f"  {spec_field} (0): '{min_val}' / '{rec_val}' - no match")
        
        # Hien thi ket qua
        for detail in details:
            print(detail)
        
        final_score = min(score / 16.5, 1.0)
        print(f"\nRaw score: {score}")
        print(f"Final score (normalized): {final_score:.3f}")
        print("=" * 80)

if __name__ == "__main__":
    analyze_keyword_score()
