#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
GIẢI THÍCH SVD SCORE VÀ TẠI SAO NÓ CAO
"""

import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity

def demonstrate_svd_calculation():
    """Minh họa cách tính SVD score"""
    
    print("=" * 80)
    print("SVD SCORE LÀ GÌ VÀ CÁCH TÍNH")
    print("=" * 80)
    
    # Ví dụ User-Item Matrix
    print("\n📊 VÍ DỤ USER-ITEM MATRIX:")
    print("-" * 40)
    
    # Tạo ma trận User-Item (5 users, 6 games)
    user_item_matrix = np.array([
        [5, 3, 0, 1, 4, 2],  # User 1: đã chơi game 1,2,4,5,6
        [4, 0, 0, 1, 1, 1],  # User 2: đã chơi game 1,4,5,6
        [1, 1, 1, 0, 1, 0],  # User 3: đã chơi game 1,2,3,5
        [1, 1, 1, 1, 1, 0],  # User 4: đã chơi game 1,2,3,4,5
        [0, 0, 1, 1, 0, 1]   # User 5: đã chơi game 3,4,6
    ])
    
    game_names = ['Action', 'RPG', 'Strategy', 'Puzzle', 'Sports', 'Racing']
    user_names = ['User 1', 'User 2', 'User 3', 'User 4', 'User 5']
    
    print("User-Item Matrix (ratings 0-5):")
    df = pd.DataFrame(user_item_matrix, 
                     index=user_names, 
                     columns=game_names)
    print(df)
    
    # 1. SVD Decomposition
    print("\n🔍 BƯỚC 1: SVD DECOMPOSITION")
    print("-" * 40)
    
    # SVD với k=2 (2 components)
    svd = TruncatedSVD(n_components=2, random_state=42)
    user_factors = svd.fit_transform(user_item_matrix)
    item_factors = svd.components_
    
    print(f"User factors shape: {user_factors.shape}")
    print(f"Item factors shape: {item_factors.shape}")
    print(f"Explained variance ratio: {svd.explained_variance_ratio_}")
    
    # 2. Reconstruct ratings
    print("\n📈 BƯỚC 2: RECONSTRUCT RATINGS")
    print("-" * 40)
    
    # Dự đoán ratings cho tất cả user-item pairs
    predicted_ratings = np.dot(user_factors, item_factors)
    
    print("Predicted ratings:")
    df_predicted = pd.DataFrame(predicted_ratings, 
                               index=user_names, 
                               columns=game_names)
    print(df_predicted.round(3))
    
    # 3. SVD Scores cho User 1
    print("\n🎯 BƯỚC 3: SVD SCORES CHO USER 1")
    print("-" * 40)
    
    user_1_scores = predicted_ratings[0]  # User 1
    print("SVD scores cho User 1:")
    for i, (game, score) in enumerate(zip(game_names, user_1_scores)):
        print(f"  {game}: {score:.3f}")
    
    # 4. Giải thích tại sao SVD score cao
    print("\n💡 TẠI SAO SVD SCORE CAO?")
    print("-" * 40)
    
    # Tìm games có SVD score cao
    high_scores = [(game, score) for game, score in zip(game_names, user_1_scores) if score > 3.0]
    print("Games có SVD score cao (>3.0):")
    for game, score in high_scores:
        print(f"  {game}: {score:.3f}")
    
    print("\n🔍 PHÂN TÍCH:")
    print("• User 1 đã chơi: Action(5), RPG(3), Puzzle(1), Sports(4), Racing(2)")
    print("• SVD tìm pattern: User 1 thích Action và Sports")
    print("• Games có SVD score cao: Action, Sports (phù hợp với pattern)")
    print("• Games có SVD score thấp: Strategy (User 1 chưa chơi, không phù hợp)")
    
    return user_1_scores, game_names

def explain_why_svd_scores_high():
    """Giải thích tại sao SVD score cao"""
    
    print("\n" + "=" * 80)
    print("TẠI SAO SVD SCORE CAO?")
    print("=" * 80)
    
    print("\n🎯 NGUYÊN NHÂN SVD SCORE CAO:")
    print("-" * 40)
    
    print("1. 📊 PATTERN RECOGNITION:")
    print("   • SVD tìm ra pattern ẩn trong dữ liệu")
    print("   • Phát hiện user thích loại game nào")
    print("   • Dự đoán dựa trên similarity với users khác")
    
    print("\n2. 🔄 COLLABORATIVE FILTERING:")
    print("   • 'Users giống bạn cũng thích game này'")
    print("   • Dựa trên lịch sử tương tác thực tế")
    print("   • Có độ tin cậy cao hơn content-based")
    
    print("\n3. 📈 MATRIX FACTORIZATION:")
    print("   • Phân tích ma trận User-Item")
    print("   • Tìm latent factors (yếu tố ẩn)")
    print("   • Dự đoán chính xác hơn")
    
    print("\n4. 🎮 GAME RECOMMENDATION CONTEXT:")
    print("   • User đã chơi nhiều games tương tự")
    print("   • Pattern rõ ràng trong preferences")
    print("   • SVD score phản ánh đúng sở thích")
    
    print("\n💡 VÍ DỤ CỤ THỂ:")
    print("-" * 40)
    print("• User thích: Action, RPG, Strategy")
    print("• SVD phát hiện: User thích 'complex games'")
    print("• Games có SVD score cao: Action, RPG, Strategy")
    print("• Games có SVD score thấp: Puzzle, Casual")

def demonstrate_svd_vs_other_scores():
    """So sánh SVD với các scores khác"""
    
    print("\n" + "=" * 80)
    print("SO SÁNH SVD VỚI CÁC SCORES KHÁC")
    print("=" * 80)
    
    # Ví dụ scores
    print("\n📊 VÍ DỤ SCORES CHO 1 GAME:")
    print("-" * 40)
    
    scores = {
        'SVD': 0.676,
        'Content': 0.323,
        'Demographic': 0.279,
        'Keyword': 0.000
    }
    
    print("Assassin's Creed Valhalla scores:")
    for score_type, value in scores.items():
        print(f"  {score_type}: {value:.3f}")
    
    print("\n🔍 PHÂN TÍCH:")
    print("-" * 40)
    print("• SVD (0.676): CAO NHẤT - User có pattern tương tự")
    print("• Content (0.323): TRUNG BÌNH - Game có đặc điểm phù hợp")
    print("• Demographic (0.279): TRUNG BÌNH - User profile phù hợp")
    print("• Keyword (0.000): THẤP - Không match keyword")
    
    print("\n💡 TẠI SAO SVD CAO NHẤT?")
    print("-" * 40)
    print("1. Dựa trên lịch sử thực tế của user")
    print("2. Phát hiện pattern ẩn trong preferences")
    print("3. Có độ tin cậy cao (collaborative filtering)")
    print("4. Phản ánh đúng sở thích user")

if __name__ == "__main__":
    # Chạy ví dụ
    user_scores, games = demonstrate_svd_calculation()
    explain_why_svd_scores_high()
    demonstrate_svd_vs_other_scores()
    
    print("\n" + "=" * 80)
    print("KẾT LUẬN")
    print("=" * 80)
    print("SVD score cao vì:")
    print("1. Dựa trên lịch sử tương tác thực tế")
    print("2. Phát hiện pattern ẩn trong preferences")
    print("3. Collaborative filtering có độ tin cậy cao")
    print("4. Phản ánh đúng sở thích user")
    print("5. Có trọng số cao trong hybrid score (35-45%)")
