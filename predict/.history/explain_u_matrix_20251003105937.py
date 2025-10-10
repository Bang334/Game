#!/usr/bin/env python3
"""
Giải thích chi tiết cách tính ma trận U (User Factors) trong SVD
"""

import numpy as np
from scipy.sparse.linalg import svds

def explain_u_matrix_calculation():
    """Giải thích cách tính ma trận U"""
    print("🎯 GIẢI THÍCH CÁCH TÍNH MA TRẬN U (USER FACTORS)")
    print("="*80)
    
    # Ma trận mẫu
    user_item_matrix = np.array([
        [8.0, 5.0, 8.0, 3.0, 0.0, 0.0],  # User 1
        [0.0, 0.0, 0.0, 5.0, 5.0, 0.0],  # User 2  
        [3.0, 0.0, 0.0, 0.0, 0.0, 0.0]   # User 3
    ])
    
    print("📊 BƯỚC 1: MA TRẬN GỐC")
    print("-"*40)
    print("User-Item Matrix (3 users × 6 games):")
    print(user_item_matrix)
    
    # Chuẩn hóa
    user_ratings_mean = np.mean(user_item_matrix, axis=1)
    ratings_demeaned = user_item_matrix - user_ratings_mean.reshape(-1, 1)
    
    print(f"\n📊 BƯỚC 2: CHUẨN HÓA")
    print("-"*40)
    print("Mean của mỗi user:", user_ratings_mean)
    print("Ma trận sau chuẩn hóa:")
    print(ratings_demeaned)
    
    # SVD
    U, sigma, Vt = svds(ratings_demeaned, k=2)
    
    print(f"\n📊 BƯỚC 3: KẾT QUẢ SVD")
    print("-"*40)
    print("Ma trận U (User Factors 3×2):")
    print(U)
    print(f"\nShape: {U.shape}")
    
    print(f"\n🎯 GIẢI THÍCH MA TRẬN U:")
    print("-"*40)
    print("U[i, j] = Mức độ User i liên quan đến Factor j")
    print()
    
    for i in range(U.shape[0]):
        print(f"User {i+1}:")
        print(f"  Factor 1: {U[i,0]:.3f}")
        print(f"  Factor 2: {U[i,1]:.3f}")
        print(f"  → User {i+1} có mức độ liên quan {U[i,0]:.3f} với Factor 1")
        print(f"  → User {i+1} có mức độ liên quan {U[i,1]:.3f} với Factor 2")
        print()
    
    print("🔍 PHÂN TÍCH CHI TIẾT:")
    print("-"*40)
    
    # Phân tích từng user
    print("User 1 (Gamer Pro):")
    print(f"  Factor 1: {U[0,0]:.3f} (âm) → Ít liên quan đến Factor 1")
    print(f"  Factor 2: {U[0,1]:.3f} (âm mạnh) → Rất ít liên quan đến Factor 2")
    print("  → User 1 có pattern riêng biệt, không theo factor nào")
    
    print("\nUser 2 (Casual Player):")
    print(f"  Factor 1: {U[1,0]:.3f} (âm mạnh) → Rất ít liên quan đến Factor 1")
    print(f"  Factor 2: {U[1,1]:.3f} (dương) → Liên quan tích cực đến Factor 2")
    print("  → User 2 theo Factor 2 (có thể là casual games)")
    
    print("\nUser 3 (Light User):")
    print(f"  Factor 1: {U[2,0]:.3f} (âm nhẹ) → Ít liên quan đến Factor 1")
    print(f"  Factor 2: {U[2,1]:.3f} (âm nhẹ) → Ít liên quan đến Factor 2")
    print("  → User 3 có ít dữ liệu, pattern không rõ ràng")
    
    print(f"\n🎯 CÁCH TÍNH TOÁN U MATRIX:")
    print("-"*40)
    print("1. SVD phân tích ma trận A thành: A = U × Σ × V^T")
    print("2. U được tính bằng cách:")
    print("   - Tìm eigenvectors của A × A^T")
    print("   - Chuẩn hóa thành ma trận trực giao")
    print("   - Mỗi cột của U là một eigenvector")
    
    print(f"\n🔢 CÔNG THỨC TOÁN HỌC:")
    print("-"*40)
    print("A = U × Σ × V^T")
    print("Trong đó:")
    print("- A: Ma trận gốc (3×6)")
    print("- U: User factors (3×2)")
    print("- Σ: Singular values (2×2)")
    print("- V^T: Item factors (2×6)")
    
    print(f"\n🎯 Ý NGHĨA THỰC TẾ:")
    print("-"*40)
    print("U[i,j] = Mức độ User i liên quan đến Latent Factor j")
    print()
    print("Ví dụ:")
    print("- U[0,0] = -0.458 → User 1 có mức độ liên quan -0.458 với Factor 1")
    print("- U[1,1] = 0.466 → User 2 có mức độ liên quan 0.466 với Factor 2")
    print()
    print("Giá trị dương: User liên quan tích cực đến factor")
    print("Giá trị âm: User liên quan tiêu cực đến factor")
    print("Giá trị gần 0: User ít liên quan đến factor")
    
    print(f"\n🎮 ỨNG DỤNG TRONG GAME RECOMMENDATION:")
    print("-"*40)
    print("1. Tìm user tương tự:")
    print("   - So sánh vector U của các user")
    print("   - User có vector U giống nhau → sở thích tương tự")
    print()
    print("2. Dự đoán rating:")
    print("   - Rating = U × Σ × V^T")
    print("   - Sử dụng U để dự đoán sở thích user")
    print()
    print("3. Phân tích sở thích:")
    print("   - Factor 1 có thể là 'Game Complexity'")
    print("   - Factor 2 có thể là 'Game Style'")
    print("   - U cho biết user thuộc nhóm nào")

def demonstrate_u_calculation():
    """Minh họa cách tính U matrix"""
    print(f"\n🔢 MINH HỌA CÁCH TÍNH U MATRIX:")
    print("="*80)
    
    # Ma trận đơn giản hơn để minh họa
    A = np.array([
        [1, 2],
        [3, 4],
        [5, 6]
    ])
    
    print("Ma trận A (3×2):")
    print(A)
    
    # Tính A × A^T
    AAT = np.dot(A, A.T)
    print(f"\nA × A^T (3×3):")
    print(AAT)
    
    # Tính eigenvalues và eigenvectors
    eigenvalues, eigenvectors = np.linalg.eigh(AAT)
    
    print(f"\nEigenvalues:")
    print(eigenvalues)
    
    print(f"\nEigenvectors (mỗi cột là một eigenvector):")
    print(eigenvectors)
    
    print(f"\n💡 Giải thích:")
    print("- Mỗi cột của eigenvectors là một vector riêng")
    print("- U matrix được tạo từ các eigenvectors này")
    print("- SVD tự động sắp xếp theo độ quan trọng (eigenvalues)")

if __name__ == "__main__":
    explain_u_matrix_calculation()
    demonstrate_u_calculation()
