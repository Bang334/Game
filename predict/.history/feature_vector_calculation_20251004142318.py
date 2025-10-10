#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
GIẢI THÍCH CÁCH TÍNH FEATURE VECTOR CỦA USER GAME
"""

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler

def demonstrate_feature_calculation():
    """Minh họa cách tính feature vector"""
    
    print("=" * 80)
    print("CÁCH TÍNH FEATURE VECTOR CỦA USER GAME")
    print("=" * 80)
    
    # Ví dụ dữ liệu game thực tế
    print("\n🎮 VÍ DỤ DỮ LIỆU GAME:")
    game_data = {
        'name': 'Candy Crush Saga',
        'genre': 'puzzle casual mobile',
        'publisher': 'King',
        'age_rating': 'E',
        'platform': 'mobile',
        'mode': 'single',
        'multiplayer': 'no',
        'language': 'english',
        'description': 'Match three puzzle game with colorful candies and fun gameplay',
        'rating': 3.8,
        'price': 1200000,
        'downloads': 73462243,
        'capacity': 0.1,
        'release_year': 2012,
        'cpu_score': 1000,
        'gpu_score': 500,
        'ram': 2
    }
    
    for key, value in game_data.items():
        print(f"{key}: {value}")
    
    # 1. TEXT FEATURES
    print("\n📝 BƯỚC 1: TEXT FEATURES")
    print("-" * 40)
    
    # Tạo text features
    text_features = [
        game_data['genre'] + ' ' + game_data['genre'] + ' ' + game_data['genre'],  # Genre x3
        game_data['publisher'],
        game_data['age_rating'],
        game_data['platform'],
        game_data['mode'],
        game_data['multiplayer'],
        game_data['language'],
        game_data['description'][:50]  # 50 từ đầu
    ]
    
    print("Text features:")
    for i, feature in enumerate(text_features):
        print(f"  {i+1}. {feature}")
    
    # TF-IDF vectorization
    vectorizer = TfidfVectorizer(max_features=10, stop_words='english')
    text_matrix = vectorizer.fit_transform(text_features)
    text_vector = text_matrix.toarray()[0]
    
    print(f"\nTF-IDF vector (10 dimensions): {text_vector}")
    
    # 2. NUMERIC FEATURES
    print("\n🔢 BƯỚC 2: NUMERIC FEATURES")
    print("-" * 40)
    
    # Chuẩn hóa numeric features
    numeric_features = np.array([
        game_data['rating'] / 5.0,  # 0-1
        np.log10(game_data['price'] + 1) / 7.0,  # Log scale, 0-1
        np.log10(game_data['downloads'] + 1) / 8.0,  # Log scale, 0-1
        game_data['capacity'] / 100.0,  # 0-1
        (game_data['release_year'] - 1990) / 35.0,  # 0-1
        game_data['cpu_score'] / 10000.0,  # 0-1
        game_data['gpu_score'] / 10000.0,  # 0-1
        game_data['ram'] / 32.0  # 0-1
    ])
    
    print("Numeric features (normalized 0-1):")
    feature_names = ['rating', 'price', 'downloads', 'capacity', 'year', 'cpu', 'gpu', 'ram']
    for i, (name, value) in enumerate(zip(feature_names, numeric_features)):
        print(f"  {name}: {value:.3f}")
    
    # 3. KẾT HỢP FEATURES
    print("\n🔗 BƯỚC 3: KẾT HỢP FEATURES")
    print("-" * 40)
    
    # Kết hợp text và numeric
    combined_vector = np.concatenate([
        text_vector,  # Text features (trọng số 1x)
        numeric_features * 0.5  # Numeric features (trọng số 0.5x)
    ])
    
    print(f"Combined vector length: {len(combined_vector)}")
    print(f"Text features: {len(text_vector)} dimensions")
    print(f"Numeric features: {len(numeric_features)} dimensions")
    print(f"Total features: {len(combined_vector)} dimensions")
    
    # 4. CHUẨN HÓA CUỐI CÙNG
    print("\n📊 BƯỚC 4: CHUẨN HÓA CUỐI CÙNG")
    print("-" * 40)
    
    # StandardScaler để chuẩn hóa
    scaler = StandardScaler()
    normalized_vector = scaler.fit_transform([combined_vector])[0]
    
    print(f"Normalized vector (first 10 values): {normalized_vector[:10]}")
    print(f"Vector range: [{normalized_vector.min():.3f}, {normalized_vector.max():.3f}]")
    
    # 5. VÍ DỤ VỚI NHIỀU GAMES
    print("\n🎯 BƯỚC 5: VÍ DỤ VỚI NHIỀU GAMES")
    print("-" * 40)
    
    # Tạo nhiều games để so sánh
    games = [
        {'name': 'Candy Crush', 'genre': 'puzzle casual mobile', 'rating': 3.8},
        {'name': 'Call of Duty', 'genre': 'action shooter competitive', 'rating': 4.5},
        {'name': 'Minecraft', 'genre': 'sandbox creative building', 'rating': 4.8}
    ]
    
    print("Games comparison:")
    for game in games:
        print(f"  {game['name']}: {game['genre']} (rating: {game['rating']})")
    
    # Giả lập feature vectors
    feature_vectors = np.array([
        [0.8, 0.6, 0.4, 0.2, 0.1, -0.3, -0.5, -0.7, -0.8, -0.9],  # Candy Crush
        [-0.8, -0.6, -0.4, -0.2, -0.1, 0.3, 0.5, 0.7, 0.8, 0.9],  # Call of Duty
        [0.2, 0.4, 0.6, 0.8, 0.9, 0.1, -0.2, -0.4, -0.6, -0.8]   # Minecraft
    ])
    
    print(f"\nFeature vectors:")
    for i, game in enumerate(games):
        print(f"  {game['name']}: {feature_vectors[i]}")
    
    return normalized_vector

def explain_negative_values():
    """Giải thích tại sao có giá trị âm"""
    
    print("\n" + "=" * 80)
    print("TẠI SAO CÓ GIÁ TRỊ ÂM TRONG FEATURE VECTOR?")
    print("=" * 80)
    
    print("\n🔍 NGUYÊN NHÂN:")
    print("1. StandardScaler chuẩn hóa về mean=0, std=1")
    print("2. Một số features có giá trị thấp hơn mean → âm")
    print("3. Một số features có giá trị cao hơn mean → dương")
    
    print("\n📊 VÍ DỤ:")
    print("• Mean của tất cả features: 0.0")
    print("• Features < mean → giá trị âm")
    print("• Features > mean → giá trị dương")
    
    print("\n🎯 Ý NGHĨA:")
    print("• Giá trị âm: Game có đặc điểm ít phổ biến")
    print("• Giá trị dương: Game có đặc điểm phổ biến")
    print("• Giá trị 0: Game có đặc điểm trung bình")

if __name__ == "__main__":
    # Chạy ví dụ
    normalized_vector = demonstrate_feature_calculation()
    explain_negative_values()
    
    print("\n" + "=" * 80)
    print("KẾT LUẬN")
    print("=" * 80)
    print("Feature vector được tính từ:")
    print("1. Text features (TF-IDF)")
    print("2. Numeric features (normalized)")
    print("3. Kết hợp với trọng số")
    print("4. Chuẩn hóa cuối cùng")
    print("5. Giá trị âm là bình thường sau chuẩn hóa!")
