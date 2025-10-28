#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""Test age-based keywords"""

from game_recommendation_system import GameRecommendationSystem

# Khởi tạo recommender
recommender = GameRecommendationSystem()
recommender.load_data()

# Test cases
test_queries = [
    # Trẻ em
    'trẻ em',
    'thiếu nhi',
    'bé',
    'em bé',
    
    # Người lớn
    'người lớn',
    'trưởng thành',
    'mature',
    '18+',
    
    # Teen
    'thanh niên',
    'tuổi teen',
    
    # Kết hợp
    'nam',
    'nữ',
    'gia đình',
]

print('='*90)
print('TEST AGE-BASED KEYWORDS')
print('='*90)
print(f"{'Input Query':<20} → {'Matched Keys (Game Categories)':<65}")
print('-'*90)

for query in test_queries:
    result = recommender.expand_query(query)
    keys = result.split()
    keys_count = len(keys)
    
    # Hiển thị kết quả
    if keys_count <= 8:
        print(f"{query:<20} → {result:<65}")
    else:
        # Nếu quá nhiều keys, chỉ hiển thị 8 đầu + ...
        first_8 = ' '.join(keys[:8])
        print(f"{query:<20} → {first_8}... ({keys_count} total)")

print('='*90)

# Chi tiết phân tích
print("\n📊 Chi tiết phân loại theo độ tuổi:")
print('-'*90)

print("\n🧒 GAME CHO TRẺ EM:")
tre_em = recommender.expand_query('trẻ em')
print(f"   {tre_em}")

print("\n👨 GAME CHO NGƯỜI LỚN:")
nguoi_lon = recommender.expand_query('người lớn')
print(f"   {nguoi_lon}")

print("\n👪 GAME CHO GIA ĐÌNH:")
gia_dinh = recommender.expand_query('gia đình')
print(f"   {gia_dinh}")

print('\n' + '='*90)

