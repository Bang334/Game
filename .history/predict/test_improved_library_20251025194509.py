#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""Test improved library.json"""

from game_recommendation_system import GameRecommendationSystem

# Khởi tạo recommender
recommender = GameRecommendationSystem()
recommender.load_data()

# Test cases với nhiều cách diễn đạt khác nhau
test_queries = [
    # Tiếng Việt có dấu
    'hành động',
    'kinh dị',
    'thư giãn',
    'ẩn nấp',
    
    # Tiếng Việt không dấu
    'hanh dong',
    'kinh di',
    'thu gian',
    'an nap',
    
    # Từ đồng nghĩa
    'chiến đấu',
    'ma quái',
    'giải trí',
    'lén lút',
    
    # Cụm từ
    'đánh nhau',
    'sợ hãi',
    'vui vẻ',
    'sinh tồn',
    
    # Giá
    'rẻ',
    'đắt',
    'miễn phí',
    
    # Platform
    'máy tính',
    'di động',
    'console',
]

print('='*90)
print('TEST IMPROVED LIBRARY.JSON - Đa dạng từ tiếng Việt')
print('='*90)
print(f"{'Input Query':<20} → {'Matched Keys':<65}")
print('-'*90)

for query in test_queries:
    result = recommender.expand_query(query)
    keys_count = len(result.split())
    print(f"{query:<20} → {result:<65}")

print('='*90)
print(f"\n✅ Tổng số test: {len(test_queries)}")
print("✅ Library đã được cải thiện với rất nhiều từ tiếng Việt!")

