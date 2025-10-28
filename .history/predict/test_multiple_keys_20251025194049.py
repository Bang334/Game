#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""Test expand_query với multiple keys"""

from game_recommendation_system import GameRecommendationSystem

# Khởi tạo recommender
recommender = GameRecommendationSystem()
recommender.load_data()

# Test cases
test_queries = [
    'hành động',      # Hiện có trong Action và Adventure
    'kịch tính',      # Có trong nhiều keys
    'thư giãn',       # Đã biết có 4 keys
    'ẩn nấp',         # Chỉ 1 key (Stealth)
    'console',        # Chỉ 1 key
]

print('='*80)
print('TEST EXPAND_QUERY - Multiple Keys')
print('='*80)
print(f"{'Input Query':<20} → {'Matched Keys':<55}")
print('-'*80)

for query in test_queries:
    result = recommender.expand_query(query)
    keys_count = len(result.split())
    print(f"{query:<20} → {result:<55} ({keys_count} keys)")

print('='*80)

# Chi tiết: Kiểm tra "hành động"
print("\n🔍 Chi tiết: Từ 'hành động' xuất hiện trong:")
print('-'*80)
for key, value in recommender.keyword_library.items():
    if 'hành động' in value.lower():
        print(f"  ✓ {key:<15}: {value[:60]}...")
print('='*80)

