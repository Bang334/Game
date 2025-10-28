#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""Test gender-based keywords"""

from game_recommendation_system import GameRecommendationSystem

# Khởi tạo recommender
recommender = GameRecommendationSystem()
recommender.load_data()

# Test cases
test_queries = [
    # Từ khóa nam
    'nam',
    'trai',
    'con trai',
    'đàn ông',
    
    # Từ khóa nữ
    'nữ',
    'gái',
    'con gái',
    'phụ nữ',
]

print('='*90)
print('TEST GENDER-BASED KEYWORDS')
print('='*90)
print(f"{'Input Query':<20} → {'Matched Keys (Game Categories)':<65}")
print('-'*90)

for query in test_queries:
    result = recommender.expand_query(query)
    keys = result.split()
    keys_count = len(keys)
    
    # Hiển thị kết quả
    if keys_count <= 10:
        print(f"{query:<20} → {result:<65}")
    else:
        # Nếu quá nhiều keys, chỉ hiển thị 10 đầu + ...
        first_10 = ' '.join(keys[:10])
        print(f"{query:<20} → {first_10}... ({keys_count} keys total)")

print('='*90)

# Chi tiết phân tích
print("\n📊 Chi tiết phân loại:")
print('-'*90)

print("\n🚹 GAME CHO NAM (khi nhập 'nam'):")
nam_result = recommender.expand_query('nam')
print(f"   Categories: {nam_result}")
print(f"   Tổng: {len(nam_result.split())} categories")

print("\n🚺 GAME CHO NỮ (khi nhập 'nữ'):")
nu_result = recommender.expand_query('nữ')
print(f"   Categories: {nu_result}")
print(f"   Tổng: {len(nu_result.split())} categories")

print('\n' + '='*90)

