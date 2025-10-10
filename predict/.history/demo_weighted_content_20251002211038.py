#!/usr/bin/env python3
# -*- coding: utf-8 -*-

def demo_weighted_content_score():
    """Demo cách tính Content Score có trọng số"""
    
    print("=== DEMO: CONTENT SCORE WITH WEIGHTS ===")
    print()
    
    # User 1 data
    favorite_games = [1, 2, 3]  # Cyberpunk, Candy Crush, Call of Duty
    purchased_games = [1, 3, 4]  # Cyberpunk, Call of Duty, Minecraft
    
    print("User 1 (Gamer Pro):")
    print(f"  Favorite games: {favorite_games}")
    print(f"  Purchased games: {purchased_games}")
    print()
    
    # Cach cu (khong trung lap)
    old_way = list(set(favorite_games + purchased_games))
    print("OLD WAY (No duplicates):")
    print(f"  Combined: {old_way}")
    print(f"  Similarity calculations: {len(old_way)} times")
    print("  -> Games [1,3] only counted once despite being both liked & purchased")
    print()
    
    # Cach moi (giu trung lap)
    new_way = favorite_games + purchased_games
    print("NEW WAY (Keep duplicates - WEIGHTED):")
    print(f"  Combined: {new_way}")
    print(f"  Similarity calculations: {len(new_way)} times")
    print("  -> Game 1 (Cyberpunk): Counted 2x (liked + purchased)")
    print("  -> Game 2 (Candy Crush): Counted 1x (only liked)")  
    print("  -> Game 3 (Call of Duty): Counted 2x (liked + purchased)")
    print("  -> Game 4 (Minecraft): Counted 1x (only purchased)")
    print()
    
    # Ví dụ tính Content Score cho Red Dead Redemption 2
    print("VÍ DỤ: Content Score cho Red Dead Redemption 2")
    print()
    
    # Giả sử similarity scores
    similarities = {
        1: 0.77,  # vs Cyberpunk 2077
        2: 0.27,  # vs Candy Crush Saga  
        3: 0.95,  # vs Call of Duty
        4: 0.25   # vs Minecraft
    }
    
    print("Similarity scores (giả sử):")
    for game_id, sim in similarities.items():
        game_names = {1: "Cyberpunk 2077", 2: "Candy Crush", 3: "Call of Duty", 4: "Minecraft"}
        print(f"  vs {game_names[game_id]}: {sim:.2f}")
    print()
    
    # Tính theo cách cũ
    old_scores = [similarities[gid] for gid in old_way]
    old_content_score = sum(old_scores) / len(old_scores)
    
    print("CÁCH CŨ:")
    print(f"  Similarities: {[similarities[gid] for gid in old_way]}")
    print(f"  Content Score = ({' + '.join([f'{similarities[gid]:.2f}' for gid in old_way])}) / {len(old_way)}")
    print(f"  Content Score = {sum(old_scores):.2f} / {len(old_scores)} = {old_content_score:.3f}")
    print()
    
    # Tính theo cách mới  
    new_scores = [similarities[gid] for gid in new_way]
    new_content_score = sum(new_scores) / len(new_scores)
    
    print("CÁCH MỚI (WEIGHTED):")
    print(f"  Similarities: {[similarities[gid] for gid in new_way]}")
    print(f"  Content Score = ({' + '.join([f'{similarities[gid]:.2f}' for gid in new_way])}) / {len(new_way)}")
    print(f"  Content Score = {sum(new_scores):.2f} / {len(new_scores)} = {new_content_score:.3f}")
    print()
    
    # So sánh
    print("SO SÁNH:")
    print(f"  Cách cũ:  {old_content_score:.3f}")
    print(f"  Cách mới: {new_content_score:.3f}")
    print(f"  Chênh lệch: {new_content_score - old_content_score:+.3f}")
    print()
    
    if new_content_score > old_content_score:
        print("✅ CÁCH MỚI CHO ĐIỂM CAO HƠN!")
        print("   → Games vừa thích vừa mua có ảnh hưởng mạnh hơn")
        print("   → Phản ánh đúng sở thích thực tế của user")
    else:
        print("⚠️  Cách mới cho điểm thấp hơn")
    
    print()
    print("=== KẾT LUẬN ===")
    print("• Games vừa THÍCH vừa MUA → Xuất hiện 2 lần trong tính toán")
    print("• Games chỉ THÍCH hoặc chỉ MUA → Xuất hiện 1 lần")
    print("• Content Score phản ánh chính xác mức độ yêu thích")
    print("• Cyberpunk & Call of Duty có trọng số gấp đôi vì user rất thích!")

if __name__ == "__main__":
    demo_weighted_content_score()
