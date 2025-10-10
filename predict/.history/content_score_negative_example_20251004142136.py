#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
VÍ DỤ TẠI SAO CONTENT SCORE CÓ THỂ ÂM
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def demonstrate_negative_similarity():
    """Minh họa tại sao content score có thể âm"""
    
    print("=" * 80)
    print("VÍ DỤ TẠI SAO CONTENT SCORE CÓ THỂ ÂM")
    print("=" * 80)
    
    # Ví dụ: User thích games casual, nhưng so sánh với game hardcore
    print("\n🎮 VÍ DỤ GAMES:")
    print("User thích: Casual games (puzzle, casual, mobile)")
    print("Game được so sánh: Hardcore games (action, shooter, competitive)")
    
    # Tạo feature vectors giả lập
    print("\n📊 FEATURE VECTORS:")
    
    # User's favorite games (casual)
    user_games = [
        "puzzle casual mobile simple easy",
        "casual mobile puzzle simple",
        "mobile casual puzzle easy"
    ]
    
    # Game đang so sánh (hardcore)
    target_game = "action shooter competitive hardcore violent"
    
    print(f"User games: {user_games}")
    print(f"Target game: {target_game}")
    
    # Tính TF-IDF
    vectorizer = TfidfVectorizer()
    all_texts = user_games + [target_game]
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    
    # Tính similarity
    user_vectors = tfidf_matrix[:-1]  # User games
    target_vector = tfidf_matrix[-1:]  # Target game
    
    similarities = cosine_similarity(target_vector, user_vectors)[0]
    
    print(f"\n🔍 COSINE SIMILARITIES:")
    for i, sim in enumerate(similarities):
        print(f"Target vs User Game {i+1}: {sim:.3f}")
    
    # Tính content score (trung bình)
    content_score = np.mean(similarities)
    print(f"\n📈 CONTENT SCORE (trung bình): {content_score:.3f}")
    
    # Giải thích
    print(f"\n💡 GIẢI THÍCH:")
    if content_score < 0:
        print("❌ CONTENT SCORE ÂM!")
        print("   → Target game có đặc điểm ĐỐI LẬP với user preferences")
        print("   → Cosine similarity âm = góc > 90°")
        print("   → Games không tương thích")
    else:
        print("✅ CONTENT SCORE DƯƠNG!")
        print("   → Target game có đặc điểm TƯƠNG ĐỒNG với user preferences")
        print("   → Cosine similarity dương = góc < 90°")
        print("   → Games tương thích")
    
    return content_score

def demonstrate_with_numeric_features():
    """Minh họa với numeric features"""
    
    print("\n" + "=" * 80)
    print("VÍ DỤ VỚI NUMERIC FEATURES")
    print("=" * 80)
    
    # User preferences (casual gamer)
    user_features = np.array([
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # puzzle
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],  # casual
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],  # mobile
    ])
    
    # Target game (hardcore)
    target_features = np.array([
        [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],  # action
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],  # shooter
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],  # competitive
    ])
    
    print("User features (casual):", user_features[0])
    print("Target features (hardcore):", target_features[0])
    
    # Tính cosine similarity
    similarity = cosine_similarity([target_features[0]], [user_features[0]])[0][0]
    print(f"Cosine similarity: {similarity:.3f}")
    
    if similarity < 0:
        print("❌ SIMILARITY ÂM - Games đối lập!")
    else:
        print("✅ SIMILARITY DƯƠNG - Games tương đồng!")

if __name__ == "__main__":
    # Chạy ví dụ
    content_score = demonstrate_negative_similarity()
    demonstrate_with_numeric_features()
    
    print("\n" + "=" * 80)
    print("KẾT LUẬN")
    print("=" * 80)
    print("Content score âm xảy ra khi:")
    print("1. Game có đặc điểm ĐỐI LẬP với user preferences")
    print("2. Cosine similarity âm (góc > 90°)")
    print("3. Games không tương thích về mặt nội dung")
    print("4. Cần điều chỉnh để đảm bảo tất cả dương!")
