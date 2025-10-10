#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
VÍ DỤ THỰC TẾ VỀ CONTENT SCORE ÂM
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def demonstrate_real_negative_similarity():
    """Minh họa similarity âm thực tế"""
    
    print("=" * 80)
    print("VÍ DỤ THỰC TẾ: CONTENT SCORE ÂM")
    print("=" * 80)
    
    # Tạo vector features thực tế (có thể âm sau khi chuẩn hóa)
    print("\n🎮 VÍ DỤ THỰC TẾ:")
    print("User thích: Casual games (puzzle, casual, mobile)")
    print("Game được so sánh: Hardcore games (action, shooter, competitive)")
    
    # User's favorite games features (sau khi chuẩn hóa)
    user_games_features = np.array([
        [0.8, 0.6, 0.4, 0.2, 0.1, -0.3, -0.5, -0.7, -0.8, -0.9],  # puzzle game
        [0.7, 0.8, 0.3, 0.1, 0.0, -0.4, -0.6, -0.8, -0.9, -0.8],  # casual game
        [0.6, 0.7, 0.5, 0.3, 0.2, -0.2, -0.4, -0.6, -0.7, -0.8],  # mobile game
    ])
    
    # Target game features (hardcore)
    target_game_features = np.array([
        [-0.8, -0.6, -0.4, -0.2, -0.1, 0.3, 0.5, 0.7, 0.8, 0.9]  # action game
    ])
    
    print(f"\n📊 FEATURE VECTORS:")
    print(f"User Game 1: {user_games_features[0]}")
    print(f"User Game 2: {user_games_features[1]}")
    print(f"User Game 3: {user_games_features[2]}")
    print(f"Target Game: {target_game_features[0]}")
    
    # Tính cosine similarity
    similarities = cosine_similarity(target_game_features, user_games_features)[0]
    
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
        print("   → Cần điều chỉnh: +{:.3f}".format(abs(content_score)))
    else:
        print("✅ CONTENT SCORE DƯƠNG!")
        print("   → Target game có đặc điểm TƯƠNG ĐỒNG với user preferences")
        print("   → Cosine similarity dương = góc < 90°")
        print("   → Games tương thích")
    
    return content_score

def demonstrate_why_negative_happens():
    """Giải thích tại sao similarity âm"""
    
    print("\n" + "=" * 80)
    print("TẠI SAO COSINE SIMILARITY CÓ THỂ ÂM?")
    print("=" * 80)
    
    print("\n🔍 CÔNG THỨC COSINE SIMILARITY:")
    print("cosine_similarity = (A · B) / (||A|| × ||B||)")
    print("                  = cos(θ)")
    print("                  = cos(góc giữa 2 vector)")
    
    print("\n📐 KHI NÀO SIMILARITY ÂM?")
    print("• Khi góc θ > 90°")
    print("• Khi cos(θ) < 0")
    print("• Khi 2 vector ĐỐI LẬP nhau")
    
    print("\n🎯 VÍ DỤ THỰC TẾ:")
    print("• User thích: [puzzle, casual, mobile, simple]")
    print("• Game có: [action, shooter, competitive, complex]")
    print("• → Đặc điểm ĐỐI LẬP → Similarity ÂM")
    
    print("\n🛠️ GIẢI PHÁP:")
    print("• Tìm similarity âm lớn nhất")
    print("• Cộng giá trị tuyệt đối vào tất cả similarities")
    print("• Đảm bảo tất cả similarities ≥ 0")

if __name__ == "__main__":
    # Chạy ví dụ
    content_score = demonstrate_real_negative_similarity()
    demonstrate_why_negative_happens()
    
    print("\n" + "=" * 80)
    print("KẾT LUẬN")
    print("=" * 80)
    print("Content score âm xảy ra khi:")
    print("1. Game có đặc điểm ĐỐI LẬP với user preferences")
    print("2. Cosine similarity âm (góc > 90°)")
    print("3. Games không tương thích về mặt nội dung")
    print("4. Cần điều chỉnh để đảm bảo tất cả dương!")
    print(f"5. Trong ví dụ này: content_score = {content_score:.3f}")
