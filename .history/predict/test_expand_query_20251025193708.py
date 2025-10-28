#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""Test expand_query function"""

from game_recommendation_system import GameRecommendationSystem

# Khởi tạo recommender
recommender = GameRecommendationSystem()
recommender.load_data()

# Test cases
test_queries = [
    'ẩn nấp',
    'hành động', 
    'console',
    'thư giãn',
    'stealth',
    'action',
    'xyz không có'
]

print('='*70)
print('TEST EXPAND_QUERY - Logic mới')
print('='*70)
print(f"{'Input Query':<25} → {'Output (Matched Keys)':<40}")
print('-'*70)

for query in test_queries:
    result = recommender.expand_query(query)
    print(f"{query:<25} → {result:<40}")

print('='*70)

# Debug: Kiểm tra một số entry trong library
print("\n🔍 DEBUG: Một số entry trong library:")
print('-'*70)
for key in ['Stealth', 'Action', 'console', 'Casual', 'relaxing']:
    if key in recommender.keyword_library:
        value = recommender.keyword_library[key]
        print(f"{key:<15}: {value[:60]}...")
print('='*70)

