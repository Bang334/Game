#!/usr/bin/env python3
"""
Ví dụ cụ thể về cách tính Content Score
"""

import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def explain_content_score_calculation():
    """Giải thích cách tính content score với ví dụ cụ thể"""
    
    print("=" * 80)
    print("CÁCH TÍNH CONTENT SCORE - VÍ DỤ CỤ THỂ")
    print("=" * 80)
    
    # Ví dụ dữ liệu user
    user_data = {
        'id': 2,
        'name': 'Casual Player',
        'favorite_games': [36, 6, 40, 41, 11, 43, 14, 31],
        'purchased_games': [36, 6, 40, 41, 10, 11, 43, 14, 19, 31],
        'view_history': {
            19: 6,  # Game 19 xem 6 lần
            6: 5,   # Game 6 xem 5 lần
            42: 5,  # Game 42 xem 5 lần
            32: 3,  # Game 32 xem 3 lần
            41: 5,  # Game 41 xem 5 lần
            49: 8,  # Game 49 xem 8 lần
            31: 3,  # Game 31 xem 3 lần
            50: 10, # Game 50 xem 10 lần
            9: 10,  # Game 9 xem 10 lần
            24: 4,  # Game 24 xem 4 lần
            44: 8   # Game 44 xem 8 lần
        }
    }
    
    print(f"\n1. THÔNG TIN USER:")
    print(f"   - User: {user_data['name']} (ID: {user_data['id']})")
    print(f"   - Favorite games: {user_data['favorite_games']}")
    print(f"   - Purchased games: {user_data['purchased_games']}")
    print(f"   - View history: {user_data['view_history']}")
    
    # Tạo danh sách games user đã tương tác với trọng số
    favorite_games = user_data.get('favorite_games', [])
    purchased_games = user_data.get('purchased_games', [])
    view_history = user_data.get('view_history', {})
    
    # Tạo danh sách games với trọng số từ view history
    view_games_weighted = []
    for game_id, view_count in view_history.items():
        # Lặp lại game_id theo số lần xem để tăng trọng số
        view_games_weighted.extend([game_id] * view_count)
    
    # Kết hợp tất cả games đã tương tác (có trọng số)
    interacted_games = favorite_games + purchased_games + view_games_weighted
    
    print(f"\n2. GAMES USER ĐÃ TƯƠNG TÁC (CÓ TRỌNG SỐ):")
    print(f"   - Favorite games: {favorite_games}")
    print(f"   - Purchased games: {purchased_games}")
    print(f"   - View games (weighted): {view_games_weighted}")
    print(f"   - Total interacted games: {len(interacted_games)} games")
    print(f"   - Unique games: {len(set(interacted_games))} unique games")
    
    # Ví dụ tính content score cho một game cụ thể
    target_game_id = 1  # Ví dụ: Assassin's Creed Valhalla
    
    print(f"\n3. TÍNH CONTENT SCORE CHO GAME ID {target_game_id}:")
    print(f"   - Game: Assassin's Creed Valhalla")
    
    # Giả sử similarity matrix (thực tế sẽ được tính từ TF-IDF)
    # Ví dụ similarity scores với các games user đã tương tác
    similarity_scores = {
        6: 0.25,   # Similarity với game 6
        10: 0.15,  # Similarity với game 10
        11: 0.30,  # Similarity với game 11
        14: 0.20,  # Similarity với game 14
        19: 0.35,  # Similarity với game 19 (xem 6 lần)
        24: 0.10,  # Similarity với game 24
        31: 0.28,  # Similarity với game 31
        32: 0.12,  # Similarity với game 32
        36: 0.22,  # Similarity với game 36
        40: 0.18,  # Similarity với game 40
        41: 0.33,  # Similarity với game 41
        42: 0.16,  # Similarity với game 42
        43: 0.24,  # Similarity với game 43
        44: 0.14,  # Similarity với game 44
        49: 0.19,  # Similarity với game 49
        50: 0.21   # Similarity với game 50
    }
    
    print(f"\n4. SIMILARITY SCORES VỚI GAMES USER ĐÃ TƯƠNG TÁC:")
    similarities = []
    for game_id in interacted_games:
        if game_id in similarity_scores:
            sim_score = similarity_scores[game_id]
            similarities.append(sim_score)
            print(f"   - Game {game_id}: similarity = {sim_score:.3f}")
    
    # Tính content score
    if similarities:
        content_score = np.mean(similarities)
        print(f"\n5. TÍNH CONTENT SCORE:")
        print(f"   - Số lượng similarities: {len(similarities)}")
        print(f"   - Tổng similarities: {sum(similarities):.3f}")
        print(f"   - Content Score = Tổng / Số lượng = {sum(similarities):.3f} / {len(similarities)} = {content_score:.3f}")
    else:
        content_score = 0.0
        print(f"\n5. TÍNH CONTENT SCORE:")
        print(f"   - Không có similarity scores")
        print(f"   - Content Score = 0.0")
    
    print(f"\n6. KẾT QUẢ:")
    print(f"   - Content Score cho Game {target_game_id} = {content_score:.3f}")
    
    # Giải thích ý nghĩa
    print(f"\n7. Ý NGHĨA:")
    if content_score > 0.3:
        print(f"   - Content Score cao ({content_score:.3f}) → Game này tương đồng cao với games user thích")
    elif content_score > 0.1:
        print(f"   - Content Score trung bình ({content_score:.3f}) → Game này có một số điểm tương đồng")
    else:
        print(f"   - Content Score thấp ({content_score:.3f}) → Game này ít tương đồng với games user thích")
    
    print("\n" + "=" * 80)
    print("TÓM TẮT CÁCH TÍNH CONTENT SCORE:")
    print("=" * 80)
    print("1. Lấy tất cả games user đã tương tác (favorite + purchased + view_history)")
    print("2. Tạo danh sách có trọng số từ view_history (game xem nhiều lần = trọng số cao)")
    print("3. Với mỗi game cần tính content score:")
    print("   - Lấy similarity scores với tất cả games user đã tương tác")
    print("   - Tính trung bình của tất cả similarity scores")
    print("   - Kết quả = Content Score")
    print("4. Content Score cao = game tương đồng nhiều với games user thích")
    print("5. Content Score thấp = game ít tương đồng với games user thích")
    print("=" * 80)

if __name__ == "__main__":
    explain_content_score_calculation()