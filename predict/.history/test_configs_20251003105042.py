#!/usr/bin/env python3
"""
Script để test các cấu hình khác nhau của hệ thống gợi ý game
"""

from game_recommendation_system import (
    show_current_config, 
    update_rating_scores, 
    update_weights,
    test_different_configs,
    GameRecommendationSystem
)

def demo_configuration_changes():
    """Demo việc thay đổi cấu hình và xem ảnh hưởng"""
    print("="*80)
    print("DEMO THAY ĐỔI CẤU HÌNH HỆ THỐNG GỢI Ý GAME")
    print("="*80)
    
    # Hiển thị cấu hình ban đầu
    print("\n1. CẤU HÌNH BAN ĐẦU:")
    show_current_config()
    
    # Test cấu hình 1: Nhấn mạnh favorite
    print("\n2. CẤU HÌNH 1: Nhấn mạnh Favorite (10, 2, 0)")
    update_rating_scores(favorite_rating=10.0, purchased_rating=2.0)
    print("   → Games favorite sẽ có điểm cao hơn nhiều")
    print("   → Trùng lặp (Favorite + Purchased) = 12.0")
    
    # Test cấu hình 2: Cân bằng
    print("\n3. CẤU HÌNH 2: Cân bằng (5, 3, 0)")
    update_rating_scores(favorite_rating=5.0, purchased_rating=3.0)
    print("   → Cân bằng giữa favorite và purchased")
    print("   → Trùng lặp (Favorite + Purchased) = 8.0")
    
    # Test cấu hình 3: Nhấn mạnh purchased
    print("\n4. CẤU HÌNH 3: Nhấn mạnh Purchased (3, 5, 0)")
    update_rating_scores(favorite_rating=3.0, purchased_rating=5.0)
    print("   → Games purchased sẽ có điểm cao hơn")
    print("   → Trùng lặp (Favorite + Purchased) = 8.0")
    
    # Test cấu hình 4: Trọng số khác
    print("\n5. CẤU HÌNH 4: Trọng số khác (SVD 60%, Content 30%, Demo 10%)")
    update_weights(weights_no_keyword={'svd': 0.6, 'content': 0.3, 'demographic': 0.1, 'keyword': 0.0})
    print("   → SVD sẽ có ảnh hưởng mạnh hơn")
    print("   → Content và Demographic ít ảnh hưởng hơn")
    
    # Test cấu hình 5: Nhấn mạnh content
    print("\n6. CẤU HÌNH 5: Nhấn mạnh Content (SVD 20%, Content 60%, Demo 20%)")
    update_weights(weights_no_keyword={'svd': 0.2, 'content': 0.6, 'demographic': 0.2, 'keyword': 0.0})
    print("   → Content-based filtering sẽ chiếm ưu thế")
    print("   → SVD ít ảnh hưởng hơn")
    
    # Khôi phục cấu hình ban đầu
    print("\n7. KHÔI PHỤC CẤU HÌNH BAN ĐẦU:")
    update_rating_scores(favorite_rating=5.0, purchased_rating=3.0)
    update_weights(weights_no_keyword={'svd': 0.45, 'content': 0.35, 'demographic': 0.2, 'keyword': 0.0})
    show_current_config()
    
    print("\n" + "="*80)
    print("KẾT LUẬN:")
    print("- Thay đổi FAVORITE_RATING và PURCHASED_RATING ảnh hưởng đến SVD scores")
    print("- Thay đổi WEIGHTS ảnh hưởng đến Hybrid scores")
    print("- Có thể điều chỉnh để phù hợp với từng loại user khác nhau")
    print("="*80)

def demo_rating_impact():
    """Demo ảnh hưởng của việc thay đổi rating scores"""
    print("\n" + "="*60)
    print("DEMO ẢNH HƯỞNG CỦA RATING SCORES")
    print("="*60)
    
    configs = [
        {"name": "Nhấn mạnh Favorite", "favorite": 10.0, "purchased": 2.0},
        {"name": "Cân bằng", "favorite": 5.0, "purchased": 3.0},
        {"name": "Nhấn mạnh Purchased", "favorite": 3.0, "purchased": 5.0},
        {"name": "Bình đẳng", "favorite": 4.0, "purchased": 4.0},
    ]
    
    for config in configs:
        print(f"\n{config['name']}:")
        print(f"  Favorite: {config['favorite']}, Purchased: {config['purchased']}")
        print(f"  Trùng lặp: {config['favorite'] + config['purchased']}")
        
        # Cập nhật cấu hình
        update_rating_scores(
            favorite_rating=config['favorite'], 
            purchased_rating=config['purchased']
        )
        
        print(f"  → Games favorite sẽ có điểm: {config['favorite']}")
        print(f"  → Games purchased sẽ có điểm: {config['purchased']}")
        print(f"  → Games trùng lặp sẽ có điểm: {config['favorite'] + config['purchased']}")

if __name__ == "__main__":
    demo_configuration_changes()
    demo_rating_impact()
