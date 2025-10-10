#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
GIẢI THÍCH MEAN CỦA TEXT FEATURES
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler

def demonstrate_text_features_mean():
    """Minh họa mean của text features"""
    
    print("=" * 80)
    print("MEAN CỦA TEXT FEATURES")
    print("=" * 80)
    
    # Ví dụ text data
    print("\n📝 VÍ DỤ TEXT DATA:")
    print("-" * 40)
    
    # Dữ liệu text từ games
    game_descriptions = [
        "puzzle casual mobile simple easy fun colorful",
        "action shooter competitive hardcore violent intense",
        "sandbox creative building exploration adventure",
        "puzzle casual mobile simple easy fun colorful",  # Duplicate
        "action shooter competitive hardcore violent intense"  # Duplicate
    ]
    
    print("Game descriptions:")
    for i, desc in enumerate(game_descriptions):
        print(f"  {i+1}. {desc}")
    
    # 1. TF-IDF Vectorization
    print("\n🔍 BƯỚC 1: TF-IDF VECTORIZATION")
    print("-" * 40)
    
    vectorizer = TfidfVectorizer(max_features=10, stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(game_descriptions)
    tfidf_vectors = tfidf_matrix.toarray()
    
    print("TF-IDF vectors:")
    for i, vector in enumerate(tfidf_vectors):
        print(f"  Game {i+1}: {vector}")
    
    # 2. Tính mean của TF-IDF vectors
    print("\n📊 BƯỚC 2: TÍNH MEAN CỦA TF-IDF VECTORS")
    print("-" * 40)
    
    mean_tfidf = np.mean(tfidf_vectors, axis=0)
    print(f"Mean TF-IDF vector: {mean_tfidf}")
    
    # 3. Giải thích ý nghĩa
    print("\n💡 Ý NGHĨA MEAN CỦA TEXT FEATURES:")
    print("-" * 40)
    
    feature_names = vectorizer.get_feature_names_out()
    print("Feature names:", feature_names)
    
    print("\nMean values per feature:")
    for i, (name, mean_val) in enumerate(zip(feature_names, mean_tfidf)):
        if mean_val > 0.1:
            print(f"  {name}: {mean_val:.3f} (phổ biến)")
        elif mean_val > 0.05:
            print(f"  {name}: {mean_val:.3f} (trung bình)")
        else:
            print(f"  {name}: {mean_val:.3f} (ít phổ biến)")
    
    return tfidf_vectors, mean_tfidf, feature_names

def demonstrate_text_vs_numeric_mean():
    """So sánh mean của text vs numeric"""
    
    print("\n" + "=" * 80)
    print("SO SÁNH MEAN CỦA TEXT VS NUMERIC")
    print("=" * 80)
    
    # Text features (TF-IDF)
    print("\n📝 TEXT FEATURES (TF-IDF):")
    print("-" * 40)
    
    text_data = [
        "puzzle casual mobile",
        "action shooter competitive",
        "sandbox creative building"
    ]
    
    vectorizer = TfidfVectorizer(max_features=5)
    text_matrix = vectorizer.fit_transform(text_data)
    text_vectors = text_matrix.toarray()
    
    print("Text vectors:")
    for i, vector in enumerate(text_vectors):
        print(f"  {i+1}: {vector}")
    
    text_mean = np.mean(text_vectors, axis=0)
    print(f"Text mean: {text_mean}")
    
    # Numeric features
    print("\n🔢 NUMERIC FEATURES:")
    print("-" * 40)
    
    numeric_data = np.array([
        [0.8, 0.6, 0.4, 0.2, 0.1],
        [0.7, 0.8, 0.3, 0.1, 0.0],
        [0.6, 0.7, 0.5, 0.3, 0.2]
    ])
    
    print("Numeric vectors:")
    for i, vector in enumerate(numeric_data):
        print(f"  {i+1}: {vector}")
    
    numeric_mean = np.mean(numeric_data, axis=0)
    print(f"Numeric mean: {numeric_mean}")
    
    # So sánh
    print("\n🔄 SO SÁNH:")
    print("-" * 40)
    print("Text mean range:", f"[{text_mean.min():.3f}, {text_mean.max():.3f}]")
    print("Numeric mean range:", f"[{numeric_mean.min():.3f}, {numeric_mean.max():.3f}]")
    
    print("\n💡 KHÁC BIỆT:")
    print("• Text mean: Dựa trên tần suất từ (TF-IDF)")
    print("• Numeric mean: Dựa trên giá trị số")
    print("• Text mean: Luôn ≥ 0 (TF-IDF không âm)")
    print("• Numeric mean: Có thể âm hoặc dương")

def demonstrate_text_standardization():
    """Minh họa chuẩn hóa text features"""
    
    print("\n" + "=" * 80)
    print("CHUẨN HÓA TEXT FEATURES")
    print("=" * 80)
    
    # Tạo text features
    text_data = [
        "puzzle casual mobile simple easy",
        "action shooter competitive hardcore",
        "sandbox creative building exploration",
        "puzzle casual mobile simple easy",
        "action shooter competitive hardcore"
    ]
    
    vectorizer = TfidfVectorizer(max_features=8)
    text_matrix = vectorizer.fit_transform(text_data)
    text_vectors = text_matrix.toarray()
    
    print("Original text vectors:")
    for i, vector in enumerate(text_vectors):
        print(f"  {i+1}: {vector}")
    
    # Chuẩn hóa text features
    scaler = StandardScaler()
    standardized_text = scaler.fit_transform(text_vectors)
    
    print("\nStandardized text vectors:")
    for i, vector in enumerate(standardized_text):
        print(f"  {i+1}: {vector}")
    
    # Tính mean sau chuẩn hóa
    mean_after_standardization = np.mean(standardized_text, axis=0)
    print(f"\nMean after standardization: {mean_after_standardization}")
    
    print("\n💡 KẾT QUẢ:")
    print("• Mean sau chuẩn hóa ≈ 0")
    print("• Text features có thể âm sau chuẩn hóa")
    print("• Đây là lý do tại sao có giá trị âm trong feature vectors!")

if __name__ == "__main__":
    # Chạy ví dụ
    tfidf_vectors, mean_tfidf, feature_names = demonstrate_text_features_mean()
    demonstrate_text_vs_numeric_mean()
    demonstrate_text_standardization()
    
    print("\n" + "=" * 80)
    print("KẾT LUẬN")
    print("=" * 80)
    print("Mean của text features:")
    print("1. Dựa trên TF-IDF (tần suất từ)")
    print("2. Luôn ≥ 0 (TF-IDF không âm)")
    print("3. Sau chuẩn hóa có thể âm")
    print("4. Khác với numeric mean")
    print("5. Phản ánh độ phổ biến của từ trong dataset")
