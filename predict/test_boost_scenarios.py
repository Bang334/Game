#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Test Boost Factor Scenarios
Demo cách boost thay đổi với các loại preferences khác nhau
"""

import sys
from game_recommendation_system import GameRecommendationSystem

def print_separator(title=""):
    """In separator đẹp"""
    print("\n" + "="*80)
    if title:
        print(f"  {title}")
        print("="*80)

def test_scenario_1_sports_lover():
    """
    Scenario 1: User thích Sports games
    Recent 7 days: Chủ yếu play Sports games
    """
    print_separator("SCENARIO 1: Sports Lover (7 ngày vừa qua chơi toàn Sports)")
    
    # Mock user preferences (giả lập như từ analyze_user_preferences)
    user_preferences_sports = {
        'publishers': {
            'EA Sports': 0.60,  # Chơi nhiều EA Sports
            '2K Sports': 0.40,
        },
        'genres': {
            'Sports': 0.70,      # Rất thích Sports
            'Football': 0.50,
            'Basketball': 0.30,
        },
        'price': {
            'avg': 1200000,
            'std': 200000,
        },
        'age_ratings': {
            'E': 0.80,           # Everyone games
        },
        'modes': {
            'Multiplayer': 0.90,
        },
        'platforms': {
            'PC': 1.0,
            'PlayStation': 0.5,
        },
        'price_avg': 1200000,
        'price_std': 200000,
    }
    
    # Test games khác nhau
    test_games = [
        {
            'id': 1,
            'name': 'FIFA 23',
            'publisher': 'EA Sports',
            'genre': ['Sports', 'Football'],
            'price': 1399000,
            'age_rating': 'E',
            'mode': 'Multiplayer',
            'platform': ['PC', 'PlayStation', 'Xbox'],
        },
        {
            'id': 2,
            'name': 'NBA 2K24',
            'publisher': '2K Sports',
            'genre': ['Sports', 'Basketball'],
            'price': 1399000,
            'age_rating': 'E',
            'mode': 'Multiplayer',
            'platform': ['PC', 'PlayStation'],
        },
        {
            'id': 3,
            'name': 'Elden Ring',
            'publisher': 'FromSoftware',
            'genre': ['RPG', 'Dark Fantasy', 'Action'],
            'price': 1199000,
            'age_rating': 'M',
            'mode': 'Single Player',
            'platform': ['PC', 'PlayStation'],
        },
        {
            'id': 4,
            'name': 'Among Us',
            'publisher': 'InnerSloth',
            'genre': ['Casual', 'Party'],
            'price': 83000,
            'age_rating': 'E',
            'mode': 'Multiplayer',
            'platform': ['PC', 'Mobile'],
        },
    ]
    
    # Initialize recommender để dùng method
    recommender = GameRecommendationSystem()
    
    print("\n📊 Testing với Sports Lover Preferences:")
    print(f"   Top Publishers: {list(user_preferences_sports['publishers'].keys())}")
    print(f"   Top Genres: {list(user_preferences_sports['genres'].keys())}")
    print(f"   Price Range: {user_preferences_sports['price_avg']:,.0f} ± {user_preferences_sports['price_std']:,.0f}")
    
    print("\n" + "-"*80)
    print(f"{'Game':<20} {'Publisher':<15} {'Genre':<20} {'Boost':<10} {'Breakdown'}")
    print("-"*80)
    
    for game in test_games:
        breakdown = recommender._calculate_boost_factor_breakdown(game, user_preferences_sports)
        
        # Format breakdown string
        breakdown_str = f"Pub×{breakdown['publisher']:.2f} Gen×{breakdown['genre']:.2f} " \
                       f"Price×{breakdown['price']:.2f} Age×{breakdown['age_rating']:.2f} " \
                       f"Mode×{breakdown['mode']:.2f} Plat×{breakdown['platform']:.2f}"
        
        genre_str = game['genre'][0] if isinstance(game['genre'], list) else game['genre']
        
        print(f"{game['name']:<20} {game['publisher']:<15} {genre_str:<20} "
              f"×{breakdown['total']:<9.2f} {breakdown_str}")

def test_scenario_2_rpg_lover():
    """
    Scenario 2: User thích RPG games
    Recent 7 days: Chủ yếu play RPG/Adventure
    """
    print_separator("SCENARIO 2: RPG Lover (7 ngày vừa qua chơi toàn RPG)")
    
    user_preferences_rpg = {
        'publishers': {
            'FromSoftware': 0.70,
            'CD Projekt Red': 0.50,
            'Bethesda': 0.30,
        },
        'genres': {
            'RPG': 0.80,
            'Dark Fantasy': 0.60,
            'Action': 0.50,
            'Adventure': 0.40,
        },
        'price': {
            'avg': 900000,
            'std': 300000,
        },
        'age_ratings': {
            'M': 0.70,    # Mature games
            'T': 0.30,
        },
        'modes': {
            'Single Player': 0.80,
            'Multiplayer': 0.20,
        },
        'platforms': {
            'PC': 1.0,
        },
        'price_avg': 900000,
        'price_std': 300000,
    }
    
    test_games = [
        {
            'id': 1,
            'name': 'Elden Ring',
            'publisher': 'FromSoftware',
            'genre': ['RPG', 'Dark Fantasy', 'Action'],
            'price': 1199000,
            'age_rating': 'M',
            'mode': 'Single Player',
            'platform': ['PC', 'PlayStation'],
        },
        {
            'id': 2,
            'name': 'The Witcher 3',
            'publisher': 'CD Projekt Red',
            'genre': ['RPG', 'Adventure', 'Action'],
            'price': 299000,
            'age_rating': 'M',
            'mode': 'Single Player',
            'platform': ['PC', 'PlayStation'],
        },
        {
            'id': 3,
            'name': 'FIFA 23',
            'publisher': 'EA Sports',
            'genre': ['Sports', 'Football'],
            'price': 1399000,
            'age_rating': 'E',
            'mode': 'Multiplayer',
            'platform': ['PC', 'PlayStation'],
        },
        {
            'id': 4,
            'name': 'Valorant',
            'publisher': 'Riot Games',
            'genre': ['Shooter', 'FPS', 'Action'],
            'price': 0,
            'age_rating': 'T',
            'mode': 'Multiplayer',
            'platform': ['PC'],
        },
    ]
    
    recommender = GameRecommendationSystem()
    
    print("\n📊 Testing với RPG Lover Preferences:")
    print(f"   Top Publishers: {list(user_preferences_rpg['publishers'].keys())}")
    print(f"   Top Genres: {list(user_preferences_rpg['genres'].keys())}")
    print(f"   Price Range: {user_preferences_rpg['price_avg']:,.0f} ± {user_preferences_rpg['price_std']:,.0f}")
    
    print("\n" + "-"*80)
    print(f"{'Game':<20} {'Publisher':<15} {'Genre':<20} {'Boost':<10} {'Match?'}")
    print("-"*80)
    
    for game in test_games:
        breakdown = recommender._calculate_boost_factor_breakdown(game, user_preferences_rpg)
        
        genre_str = game['genre'][0] if isinstance(game['genre'], list) else game['genre']
        
        # Determine match quality
        if breakdown['total'] >= 1.5:
            match = "✓✓ Excellent"
        elif breakdown['total'] >= 1.3:
            match = "✓ Good"
        elif breakdown['total'] >= 1.1:
            match = "~ OK"
        else:
            match = "✗ Poor"
        
        print(f"{game['name']:<20} {game['publisher']:<15} {genre_str:<20} "
              f"×{breakdown['total']:<9.2f} {match}")

def test_scenario_3_budget_gamer():
    """
    Scenario 3: User chỉ chơi Free/Cheap games
    Recent 7 days: Toàn free hoặc < 200k
    """
    print_separator("SCENARIO 3: Budget Gamer (7 ngày chỉ chơi Free/Cheap games)")
    
    user_preferences_budget = {
        'publishers': {
            'Riot Games': 0.40,
            'InnerSloth': 0.30,
            'Valve': 0.30,
        },
        'genres': {
            'Free-to-Play': 0.70,
            'Casual': 0.50,
            'MOBA': 0.40,
            'Shooter': 0.30,
        },
        'price': {
            'avg': 50000,     # Average rất thấp
            'std': 80000,     # Std nhỏ
        },
        'age_ratings': {
            'T': 0.60,
            'E': 0.40,
        },
        'modes': {
            'Multiplayer': 0.90,
        },
        'platforms': {
            'PC': 1.0,
        },
        'price_avg': 50000,
        'price_std': 80000,
    }
    
    test_games = [
        {
            'id': 1,
            'name': 'Valorant',
            'publisher': 'Riot Games',
            'genre': ['Shooter', 'FPS', 'Free-to-Play'],
            'price': 0,
            'age_rating': 'T',
            'mode': 'Multiplayer',
            'platform': ['PC'],
        },
        {
            'id': 2,
            'name': 'Among Us',
            'publisher': 'InnerSloth',
            'genre': ['Casual', 'Party'],
            'price': 83000,
            'age_rating': 'E',
            'mode': 'Multiplayer',
            'platform': ['PC', 'Mobile'],
        },
        {
            'id': 3,
            'name': 'Elden Ring',
            'publisher': 'FromSoftware',
            'genre': ['RPG', 'Dark Fantasy'],
            'price': 1199000,    # Quá đắt!
            'age_rating': 'M',
            'mode': 'Single Player',
            'platform': ['PC'],
        },
        {
            'id': 4,
            'name': 'FIFA 23',
            'publisher': 'EA Sports',
            'genre': ['Sports', 'Football'],
            'price': 1399000,    # Quá đắt!
            'age_rating': 'E',
            'mode': 'Multiplayer',
            'platform': ['PC'],
        },
    ]
    
    recommender = GameRecommendationSystem()
    
    print("\n📊 Testing với Budget Gamer Preferences:")
    print(f"   Top Publishers: {list(user_preferences_budget['publishers'].keys())}")
    print(f"   Top Genres: {list(user_preferences_budget['genres'].keys())}")
    print(f"   Price Range: {user_preferences_budget['price_avg']:,.0f} ± {user_preferences_budget['price_std']:,.0f}")
    
    print("\n" + "-"*80)
    print(f"{'Game':<20} {'Price':<12} {'Genre':<20} {'Price Boost':<12} {'Total Boost'}")
    print("-"*80)
    
    for game in test_games:
        breakdown = recommender._calculate_boost_factor_breakdown(game, user_preferences_budget)
        
        genre_str = game['genre'][0] if isinstance(game['genre'], list) else game['genre']
        price_str = f"{game['price']:,}" if game['price'] > 0 else "FREE"
        
        # Highlight price boost
        price_boost = breakdown['price']
        if price_boost >= 1.1:
            price_indicator = f"×{price_boost:.2f} ✓"
        elif price_boost == 1.0:
            price_indicator = f"×{price_boost:.2f} ~"
        else:
            price_indicator = f"×{price_boost:.2f} ✗"
        
        print(f"{game['name']:<20} {price_str:<12} {genre_str:<20} "
              f"{price_indicator:<12} ×{breakdown['total']:.2f}")

def test_scenario_4_comparison():
    """
    Scenario 4: So sánh CÙNG 1 game với KHÁC preferences
    """
    print_separator("SCENARIO 4: Cùng 1 game (Apex Legends) - Khác preferences")
    
    # Game cố định
    apex_legends = {
        'id': 11,
        'name': 'Apex Legends',
        'publisher': 'EA',
        'genre': ['Battle Royale', 'Shooter', 'Action'],
        'price': 0,
        'age_rating': 'T',
        'mode': 'Multiplayer',
        'platform': ['PC', 'PlayStation', 'Xbox'],
    }
    
    # 4 loại user khác nhau
    scenarios = [
        {
            'name': 'Sports Lover',
            'prefs': {
                'publishers': {'EA Sports': 0.60},
                'genres': {'Sports': 0.70, 'Football': 0.50},
                'price': {'avg': 1200000, 'std': 200000},
                'age_ratings': {'E': 0.80},
                'modes': {'Multiplayer': 0.90},
                'platforms': {'PC': 1.0},
                'price_avg': 1200000,
                'price_std': 200000,
            }
        },
        {
            'name': 'Shooter Enthusiast',
            'prefs': {
                'publishers': {'EA': 0.50, 'Riot Games': 0.40},
                'genres': {'Shooter': 0.80, 'FPS': 0.70, 'Battle Royale': 0.60},
                'price': {'avg': 100000, 'std': 150000},
                'age_ratings': {'T': 0.70, 'M': 0.30},
                'modes': {'Multiplayer': 1.0},
                'platforms': {'PC': 1.0},
                'price_avg': 100000,
                'price_std': 150000,
            }
        },
        {
            'name': 'RPG Only Player',
            'prefs': {
                'publishers': {'FromSoftware': 0.70, 'CD Projekt Red': 0.50},
                'genres': {'RPG': 0.80, 'Dark Fantasy': 0.60},
                'price': {'avg': 900000, 'std': 300000},
                'age_ratings': {'M': 0.70},
                'modes': {'Single Player': 0.80},
                'platforms': {'PC': 1.0},
                'price_avg': 900000,
                'price_std': 300000,
            }
        },
        {
            'name': 'Casual Mobile Gamer',
            'prefs': {
                'publishers': {'InnerSloth': 0.50, 'Supercell': 0.50},
                'genres': {'Casual': 0.80, 'Puzzle': 0.60, 'Party': 0.40},
                'price': {'avg': 0, 'std': 50000},
                'age_ratings': {'E': 0.90},
                'modes': {'Multiplayer': 0.60},
                'platforms': {'Mobile': 1.0},
                'price_avg': 0,
                'price_std': 50000,
            }
        },
    ]
    
    recommender = GameRecommendationSystem()
    
    print(f"\n🎮 Game: {apex_legends['name']}")
    print(f"   Publisher: {apex_legends['publisher']}")
    print(f"   Genres: {', '.join(apex_legends['genre'])}")
    print(f"   Price: FREE")
    print(f"   Age: {apex_legends['age_rating']}, Mode: {apex_legends['mode']}")
    
    print("\n" + "-"*80)
    print(f"{'User Type':<25} {'Pub':<8} {'Genre':<8} {'Price':<8} {'Total':<10} {'Match Quality'}")
    print("-"*80)
    
    for scenario in scenarios:
        breakdown = recommender._calculate_boost_factor_breakdown(apex_legends, scenario['prefs'])
        
        # Determine match quality
        if breakdown['total'] >= 1.6:
            match = "⭐⭐⭐ Excellent"
        elif breakdown['total'] >= 1.4:
            match = "⭐⭐ Very Good"
        elif breakdown['total'] >= 1.2:
            match = "⭐ Good"
        elif breakdown['total'] >= 1.0:
            match = "~ Neutral"
        else:
            match = "✗ Poor Match"
        
        print(f"{scenario['name']:<25} "
              f"×{breakdown['publisher']:<7.2f} "
              f"×{breakdown['genre']:<7.2f} "
              f"×{breakdown['price']:<7.2f} "
              f"×{breakdown['total']:<9.2f} {match}")

def test_scenario_5_impact_on_ranking():
    """
    Scenario 5: Impact lên ranking
    Giả lập base scores và xem boost thay đổi ranking như thế nào
    """
    print_separator("SCENARIO 5: Impact lên Ranking (Base vs Boosted)")
    
    # Giả lập 5 games với base scores khác nhau
    games_with_base_scores = [
        {
            'game': {
                'id': 1,
                'name': 'Red Dead Redemption 2',
                'publisher': 'Rockstar Games',
                'genre': ['Action', 'Adventure', 'Western'],
                'price': 1199000,
                'age_rating': 'M',
                'mode': 'Single Player',
                'platform': ['PC', 'PlayStation'],
            },
            'base_score': 0.599,
        },
        {
            'game': {
                'id': 2,
                'name': 'Apex Legends',
                'publisher': 'EA',
                'genre': ['Battle Royale', 'Shooter'],
                'price': 0,
                'age_rating': 'T',
                'mode': 'Multiplayer',
                'platform': ['PC', 'PlayStation'],
            },
            'base_score': 0.530,
        },
        {
            'game': {
                'id': 3,
                'name': 'FIFA 23',
                'publisher': 'EA Sports',
                'genre': ['Sports', 'Football'],
                'price': 1399000,
                'age_rating': 'E',
                'mode': 'Multiplayer',
                'platform': ['PC'],
            },
            'base_score': 0.122,
        },
        {
            'game': {
                'id': 4,
                'name': 'Valorant',
                'publisher': 'Riot Games',
                'genre': ['Shooter', 'FPS'],
                'price': 0,
                'age_rating': 'T',
                'mode': 'Multiplayer',
                'platform': ['PC'],
            },
            'base_score': 0.330,
        },
        {
            'game': {
                'id': 5,
                'name': 'The Witcher 3',
                'publisher': 'CD Projekt Red',
                'genre': ['RPG', 'Adventure'],
                'price': 299000,
                'age_rating': 'M',
                'mode': 'Single Player',
                'platform': ['PC'],
            },
            'base_score': 0.480,
        },
    ]
    
    # User preferences: Shooter/Sports lover
    user_preferences = {
        'publishers': {'EA Sports': 0.60, 'Riot Games': 0.40, 'EA': 0.30},
        'genres': {'Shooter': 0.70, 'Sports': 0.60, 'FPS': 0.50},
        'price': {'avg': 500000, 'std': 400000},
        'age_ratings': {'T': 0.70, 'E': 0.30},
        'modes': {'Multiplayer': 0.90},
        'platforms': {'PC': 1.0},
        'price_avg': 500000,
        'price_std': 400000,
    }
    
    recommender = GameRecommendationSystem()
    
    # Calculate boosted scores
    for item in games_with_base_scores:
        breakdown = recommender._calculate_boost_factor_breakdown(item['game'], user_preferences)
        item['boost_factor'] = breakdown['total']
        item['boosted_score'] = item['base_score'] * breakdown['total']
    
    # Sort by base score
    sorted_by_base = sorted(games_with_base_scores, key=lambda x: x['base_score'], reverse=True)
    
    # Sort by boosted score
    sorted_by_boosted = sorted(games_with_base_scores, key=lambda x: x['boosted_score'], reverse=True)
    
    print("\n📊 User Preferences: Shooter/Sports lover (7 days)")
    print(f"   Top Genres: Shooter, Sports, FPS")
    print(f"   Price Range: ~500k")
    
    print("\n🔵 BEFORE Boosting (Base Score):")
    print("-"*80)
    print(f"{'Rank':<6} {'Game':<25} {'Base Score':<12} {'Genre'}")
    print("-"*80)
    for idx, item in enumerate(sorted_by_base, 1):
        genre_str = item['game']['genre'][0]
        print(f"#{idx:<5} {item['game']['name']:<25} {item['base_score']:<12.3f} {genre_str}")
    
    print("\n🔴 AFTER Boosting (7-Day Adaptive):")
    print("-"*80)
    print(f"{'Rank':<6} {'Game':<25} {'Boosted':<12} {'Boost':<10} {'Change'}")
    print("-"*80)
    for idx, item in enumerate(sorted_by_boosted, 1):
        # Find original rank
        original_rank = next(i for i, x in enumerate(sorted_by_base, 1) if x['game']['id'] == item['game']['id'])
        rank_change = original_rank - idx
        
        if rank_change > 0:
            change_str = f"⬆️ +{rank_change}"
        elif rank_change < 0:
            change_str = f"⬇️ {rank_change}"
        else:
            change_str = "─ 0"
        
        print(f"#{idx:<5} {item['game']['name']:<25} {item['boosted_score']:<12.3f} "
              f"×{item['boost_factor']:<9.2f} {change_str}")

def main():
    """Main function"""
    print("\n" + "="*80)
    print("  🧪 BOOST FACTOR TEST SCENARIOS")
    print("  Testing how boost changes with different user preferences")
    print("="*80)
    
    try:
        # Run all scenarios
        test_scenario_1_sports_lover()
        test_scenario_2_rpg_lover()
        test_scenario_3_budget_gamer()
        test_scenario_4_comparison()
        test_scenario_5_impact_on_ranking()
        
        print("\n" + "="*80)
        print("  ✅ ALL SCENARIOS COMPLETED")
        print("="*80)
        
        print("\n💡 KEY TAKEAWAYS:")
        print("   1. Boost factors range từ 0.8-1.2 cho mỗi attribute")
        print("   2. Total boost thường từ 0.6-2.0 tùy match level")
        print("   3. Games match preferences → boost cao → rank lên")
        print("   4. Games không match → boost thấp/penalty → rank xuống")
        print("   5. Price range rất quan trọng cho budget gamers!")
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

