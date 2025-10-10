#!/usr/bin/env python3
"""
Script minh họa từng bước SVD với ma trận cụ thể
"""

import numpy as np
from scipy.sparse.linalg import svds

def print_matrix(matrix, title, decimals=3):
    """In ma trận với format đẹp"""
    print(f"\n{'='*60}")
    print(f"{title}")
    print('='*60)
    print(f"Shape: {matrix.shape}")
    print()
    
    # Format ma trận
    if matrix.ndim == 1:
        # Vector
        for i, val in enumerate(matrix):
            print(f"  [{i:2d}] = {val:.{decimals}f}")
    else:
        # Matrix
        for i in range(matrix.shape[0]):
            row_str = "  ["
            for j in range(matrix.shape[1]):
                row_str += f"{matrix[i,j]:.{decimals}f}"
                if j < matrix.shape[1] - 1:
                    row_str += ", "
            row_str += "]"
            print(row_str)

def svd_step_by_step_demo():
    """Minh họa từng bước SVD"""
    print("🎯 MINH HỌA TỪNG BƯỚC SVD")
    print("="*80)
    
    # Bước 1: Tạo ma trận User-Item
    print("\n📊 BƯỚC 1: TẠO MA TRẬN USER-ITEM")
    print("-"*40)
    
    # Ma trận mẫu (3 users, 6 games)
    user_item_matrix = np.array([
        [8.0, 5.0, 8.0, 3.0, 0.0, 0.0],  # User 1
        [0.0, 0.0, 0.0, 5.0, 5.0, 0.0],  # User 2  
        [3.0, 0.0, 0.0, 0.0, 0.0, 0.0]   # User 3
    ])
    
    print_matrix(user_item_matrix, "MA TRẬN USER-ITEM GỐC")
    
    # Bước 2: Tính mean của mỗi user
    print("\n📊 BƯỚC 2: TÍNH MEAN CỦA MỖI USER")
    print("-"*40)
    
    user_ratings_mean = np.mean(user_item_matrix, axis=1)
    print_matrix(user_ratings_mean, "MEAN RATING CỦA MỖI USER")
    
    # Giải thích
    print("\n💡 Giải thích:")
    print("User 1 mean = (8.0 + 5.0 + 8.0 + 3.0 + 0.0 + 0.0) / 6 = 4.0")
    print("User 2 mean = (0.0 + 0.0 + 0.0 + 5.0 + 5.0 + 0.0) / 6 = 1.667")
    print("User 3 mean = (3.0 + 0.0 + 0.0 + 0.0 + 0.0 + 0.0) / 6 = 0.5")
    
    # Bước 3: Chuẩn hóa (trừ mean)
    print("\n📊 BƯỚC 3: CHUẨN HÓA (TRỪ MEAN)")
    print("-"*40)
    
    ratings_demeaned = user_item_matrix - user_ratings_mean.reshape(-1, 1)
    print_matrix(ratings_demeaned, "MA TRẬN SAU KHI CHUẨN HÓA")
    
    # Giải thích
    print("\n💡 Giải thích:")
    print("User 1: [8.0, 5.0, 8.0, 3.0, 0.0, 0.0] - 4.0 = [4.0, 1.0, 4.0, -1.0, -4.0, -4.0]")
    print("User 2: [0.0, 0.0, 0.0, 5.0, 5.0, 0.0] - 1.667 = [-1.667, -1.667, -1.667, 3.333, 3.333, -1.667]")
    print("User 3: [3.0, 0.0, 0.0, 0.0, 0.0, 0.0] - 0.5 = [2.5, -0.5, -0.5, -0.5, -0.5, -0.5]")
    
    # Bước 4: SVD Decomposition
    print("\n📊 BƯỚC 4: SVD DECOMPOSITION")
    print("-"*40)
    
    # Áp dụng SVD với k=2
    U, sigma, Vt = svds(ratings_demeaned, k=2)
    sigma = np.diag(sigma)
    
    print_matrix(U, "MA TRẬN U (User Factors)")
    print_matrix(sigma, "MA TRẬN SIGMA (Singular Values)")
    print_matrix(Vt, "MA TRẬN Vt (Item Factors)")
    
    # Giải thích
    print("\n💡 Giải thích:")
    print("U: Ma trận 3x2 - mỗi user có 2 latent factors")
    print("sigma: Ma trận 2x2 - độ quan trọng của mỗi factor")
    print("Vt: Ma trận 2x6 - mỗi game có 2 latent factors")
    
    # Bước 5: Tái tạo ma trận dự đoán
    print("\n📊 BƯỚC 5: TÁI TẠO MA TRẬN DỰ ĐOÁN")
    print("-"*40)
    
    # Tái tạo predicted ratings
    predicted_ratings = np.dot(np.dot(U, sigma), Vt) + user_ratings_mean.reshape(-1, 1)
    print_matrix(predicted_ratings, "MA TRẬN DỰ ĐOÁN (Predicted Ratings)")
    
    # So sánh với ma trận gốc
    print("\n📊 BƯỚC 6: SO SÁNH MA TRẬN GỐC VS DỰ ĐOÁN")
    print("-"*40)
    
    print_matrix(user_item_matrix, "MA TRẬN GỐC")
    print_matrix(predicted_ratings, "MA TRẬN DỰ ĐOÁN")
    
    # Tính độ lỗi
    error = np.abs(user_item_matrix - predicted_ratings)
    print_matrix(error, "ĐỘ LỖI (Absolute Error)")
    
    # Bước 7: Tính SVD scores cho từng game
    print("\n📊 BƯỚC 7: TÍNH SVD SCORES CHO TỪNG GAME")
    print("-"*40)
    
    # Chuẩn hóa predicted ratings về 0-1
    svd_scores = (predicted_ratings + 1) / 2
    svd_scores = np.clip(svd_scores, 0, 1)  # Đảm bảo trong khoảng 0-1
    
    print_matrix(svd_scores, "SVD SCORES (0-1)")
    
    # Giải thích ý nghĩa
    print("\n💡 Ý nghĩa SVD Scores:")
    for i in range(svd_scores.shape[0]):
        print(f"User {i+1}:")
        for j in range(svd_scores.shape[1]):
            score = svd_scores[i, j]
            print(f"  Game {j+1}: {score:.3f} ({score*100:.1f}% khả năng thích)")
    
    # Bước 8: Phân tích latent factors
    print("\n📊 BƯỚC 8: PHÂN TÍCH LATENT FACTORS")
    print("-"*40)
    
    print("🎯 User Factors (U matrix):")
    for i in range(U.shape[0]):
        print(f"User {i+1}: Factor 1 = {U[i,0]:.3f}, Factor 2 = {U[i,1]:.3f}")
    
    print("\n🎯 Game Factors (Vt matrix):")
    for j in range(Vt.shape[1]):
        print(f"Game {j+1}: Factor 1 = {Vt[0,j]:.3f}, Factor 2 = {Vt[1,j]:.3f}")
    
    print("\n🎯 Singular Values (Sigma):")
    print(f"Factor 1 importance: {sigma[0,0]:.3f}")
    print(f"Factor 2 importance: {sigma[1,1]:.3f}")
    
    # Bước 9: Kết luận
    print("\n📊 BƯỚC 9: KẾT LUẬN")
    print("-"*40)
    
    print("🎯 SVD đã học được:")
    print("1. Pattern ẩn trong dữ liệu user-game")
    print("2. Mối quan hệ giữa users và games")
    print("3. Dự đoán rating cho games chưa tương tác")
    
    print("\n🎯 Ứng dụng:")
    print("1. Gợi ý games mới cho user")
    print("2. Tìm user tương tự")
    print("3. Phân tích sở thích ẩn")
    
    print("\n" + "="*80)
    print("🎉 HOÀN THÀNH MINH HỌA SVD!")
    print("="*80)

if __name__ == "__main__":
    svd_step_by_step_demo()
