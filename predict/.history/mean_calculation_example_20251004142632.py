#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
GIẢI THÍCH MEAN (TRUNG BÌNH) VÀ CÁCH TÍNH
"""

import numpy as np
import pandas as pd

def demonstrate_mean_calculation():
    """Minh họa cách tính mean"""
    
    print("=" * 80)
    print("MEAN (TRUNG BÌNH) LÀ GÌ VÀ CÁCH TÍNH")
    print("=" * 80)
    
    # Ví dụ 1: Tính mean đơn giản
    print("\n📊 VÍ DỤ 1: TÍNH MEAN ĐƠN GIẢN")
    print("-" * 40)
    
    numbers = [2, 4, 6, 8, 10]
    print(f"Numbers: {numbers}")
    
    # Cách tính thủ công
    total = sum(numbers)
    count = len(numbers)
    mean_manual = total / count
    
    print(f"Tổng: {total}")
    print(f"Số lượng: {count}")
    print(f"Mean (thủ công): {total} ÷ {count} = {mean_manual}")
    
    # Cách tính bằng numpy
    mean_numpy = np.mean(numbers)
    print(f"Mean (numpy): {mean_numpy}")
    
    # Ví dụ 2: Mean với giá trị âm
    print("\n📊 VÍ DỤ 2: MEAN VỚI GIÁ TRỊ ÂM")
    print("-" * 40)
    
    numbers_with_negative = [1, -2, 3, -4, 5]
    print(f"Numbers: {numbers_with_negative}")
    
    mean_negative = np.mean(numbers_with_negative)
    print(f"Mean: {mean_negative}")
    
    # Giải thích
    total_negative = sum(numbers_with_negative)
    count_negative = len(numbers_with_negative)
    print(f"Tổng: {total_negative}")
    print(f"Số lượng: {count_negative}")
    print(f"Mean: {total_negative} ÷ {count_negative} = {mean_negative}")
    
    # Ví dụ 3: Mean của feature vectors
    print("\n📊 VÍ DỤ 3: MEAN CỦA FEATURE VECTORS")
    print("-" * 40)
    
    # Giả lập feature vectors của nhiều games
    feature_vectors = np.array([
        [0.8, 0.6, 0.4, 0.2, 0.1, -0.3, -0.5, -0.7, -0.8, -0.9],  # Game 1
        [0.7, 0.8, 0.3, 0.1, 0.0, -0.4, -0.6, -0.8, -0.9, -0.8],  # Game 2
        [0.6, 0.7, 0.5, 0.3, 0.2, -0.2, -0.4, -0.6, -0.7, -0.8],  # Game 3
        [-0.8, -0.6, -0.4, -0.2, -0.1, 0.3, 0.5, 0.7, 0.8, 0.9],  # Game 4
        [0.2, 0.4, 0.6, 0.8, 0.9, 0.1, -0.2, -0.4, -0.6, -0.8]   # Game 5
    ])
    
    print("Feature vectors:")
    for i, vector in enumerate(feature_vectors):
        print(f"  Game {i+1}: {vector}")
    
    # Tính mean của từng dimension
    mean_per_dimension = np.mean(feature_vectors, axis=0)
    print(f"\nMean per dimension: {mean_per_dimension}")
    
    # Tính mean tổng thể
    mean_overall = np.mean(feature_vectors)
    print(f"Mean overall: {mean_overall}")
    
    return mean_per_dimension, mean_overall

def explain_standardization():
    """Giải thích chuẩn hóa với mean"""
    
    print("\n" + "=" * 80)
    print("CHUẨN HÓA VỚI MEAN (STANDARDIZATION)")
    print("=" * 80)
    
    # Ví dụ chuẩn hóa
    print("\n🔍 VÍ DỤ CHUẨN HÓA:")
    print("-" * 40)
    
    # Dữ liệu gốc
    original_data = np.array([10, 20, 30, 40, 50])
    print(f"Dữ liệu gốc: {original_data}")
    
    # Tính mean và std
    mean = np.mean(original_data)
    std = np.std(original_data)
    print(f"Mean: {mean}")
    print(f"Standard deviation: {std}")
    
    # Chuẩn hóa: (x - mean) / std
    standardized_data = (original_data - mean) / std
    print(f"Dữ liệu chuẩn hóa: {standardized_data}")
    
    # Kiểm tra mean và std sau chuẩn hóa
    new_mean = np.mean(standardized_data)
    new_std = np.std(standardized_data)
    print(f"Mean sau chuẩn hóa: {new_mean}")
    print(f"Std sau chuẩn hóa: {new_std}")
    
    print("\n💡 GIẢI THÍCH:")
    print("• Mean sau chuẩn hóa = 0")
    print("• Std sau chuẩn hóa = 1")
    print("• Giá trị âm: < mean gốc")
    print("• Giá trị dương: > mean gốc")
    print("• Giá trị 0: = mean gốc")

def demonstrate_with_game_features():
    """Minh họa với game features thực tế"""
    
    print("\n" + "=" * 80)
    print("VÍ DỤ VỚI GAME FEATURES THỰC TẾ")
    print("=" * 80)
    
    # Giả lập features của nhiều games
    games_features = {
        'Candy Crush': [0.8, 0.6, 0.4, 0.2, 0.1, -0.3, -0.5, -0.7, -0.8, -0.9],
        'Call of Duty': [-0.8, -0.6, -0.4, -0.2, -0.1, 0.3, 0.5, 0.7, 0.8, 0.9],
        'Minecraft': [0.2, 0.4, 0.6, 0.8, 0.9, 0.1, -0.2, -0.4, -0.6, -0.8],
        'Tetris': [0.5, 0.3, 0.1, -0.1, -0.3, -0.5, -0.7, -0.9, -0.8, -0.6],
        'FIFA': [-0.1, -0.3, -0.5, -0.7, -0.9, 0.8, 0.6, 0.4, 0.2, 0.0]
    }
    
    print("Game features:")
    for game, features in games_features.items():
        print(f"  {game}: {features}")
    
    # Tính mean của từng feature
    all_features = np.array(list(games_features.values()))
    mean_features = np.mean(all_features, axis=0)
    
    print(f"\nMean của từng feature: {mean_features}")
    
    # Giải thích ý nghĩa
    print("\n💡 Ý NGHĨA:")
    print("• Mean > 0: Feature này phổ biến trong dataset")
    print("• Mean < 0: Feature này ít phổ biến trong dataset")
    print("• Mean ≈ 0: Feature này trung bình trong dataset")
    
    # Ví dụ cụ thể
    print("\n🎯 VÍ DỤ CỤ THỂ:")
    feature_names = ['puzzle', 'casual', 'mobile', 'simple', 'easy', 'action', 'shooter', 'competitive', 'complex', 'hardcore']
    for i, (name, mean_val) in enumerate(zip(feature_names, mean_features)):
        if mean_val > 0.1:
            print(f"  {name}: {mean_val:.3f} (phổ biến)")
        elif mean_val < -0.1:
            print(f"  {name}: {mean_val:.3f} (ít phổ biến)")
        else:
            print(f"  {name}: {mean_val:.3f} (trung bình)")

if __name__ == "__main__":
    # Chạy ví dụ
    mean_per_dim, mean_overall = demonstrate_mean_calculation()
    explain_standardization()
    demonstrate_with_game_features()
    
    print("\n" + "=" * 80)
    print("KẾT LUẬN")
    print("=" * 80)
    print("Mean (trung bình) là:")
    print("1. Tổng tất cả giá trị ÷ Số lượng giá trị")
    print("2. Điểm trung tâm của dataset")
    print("3. Dùng để chuẩn hóa dữ liệu")
    print("4. Mean = 0 sau chuẩn hóa")
    print("5. Giá trị âm = < mean, Giá trị dương = > mean")
