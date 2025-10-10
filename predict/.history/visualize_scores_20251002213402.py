import matplotlib.pyplot as plt
import numpy as np
import json
from game_recommendation_system import GameRecommendationSystem

def get_scores_for_visualization(user_id=2):
    """Get scores from recommendation system for visualization"""
    print("Initializing recommendation system...")
    
    # Create instance
    recommender = GameRecommendationSystem()
    
    # Load and preprocess data
    if not recommender.load_data():
        return None
    
    recommender.preprocess_data()
    
    # Train models
    recommender.train_svd_model(k=2)
    recommender.build_content_similarity()
    
    print(f"Getting recommendations for user {user_id}...")
    
    # Get recommendations with all scores
    user_data = next((u for u in recommender.users_data if u['id'] == user_id), None)
    if not user_data:
        print(f"User {user_id} not found")
        return None
    
    # Get number of available games for recommendation
    interacted_games = set(user_data.get('favorite_games', []) + 
                         user_data.get('purchased_games', []))
    total_games = len(recommender.games_data)
    available_games = total_games - len(interacted_games)
    
    # Get hybrid recommendations with all games
    recommendations = recommender.get_hybrid_recommendations(
        user_id=user_id,
        top_n=available_games,  # Get all
        keyword=""  # No keyword
    )
    
    return recommendations, user_data

def create_stacked_bar_chart(recommendations, user_data, top_n=15):
    """Create stacked bar chart for scores"""
    if not recommendations:
        print("No data to create chart")
        return
    
    # Get top N games to draw (avoid too crowded)
    top_recs = recommendations[:top_n]
    
    # Prepare data
    game_names = [rec['game_name'] for rec in top_recs]
    svd_scores = [rec.get('svd_score', 0) for rec in top_recs]
    content_scores = [rec.get('content_score', 0) for rec in top_recs]
    demographic_scores = [rec.get('demographic_score', 0) for rec in top_recs]
    keyword_scores = [rec.get('keyword_score', 0) for rec in top_recs]
    
    # Tạo figure và axis
    fig, ax = plt.subplots(figsize=(16, 10))
    
    # Tạo vị trí cho các cột
    x = np.arange(len(game_names))
    width = 0.8
    
    # Vẽ các cột xếp chồng
    p1 = ax.bar(x, svd_scores, width, label='SVD Score', color='#FF6B6B', alpha=0.8)
    p2 = ax.bar(x, content_scores, width, bottom=svd_scores, label='Content Score', color='#4ECDC4', alpha=0.8)
    
    # Tính bottom cho demographic
    bottom_demo = np.array(svd_scores) + np.array(content_scores)
    p3 = ax.bar(x, demographic_scores, width, bottom=bottom_demo, label='Demographic Score', color='#45B7D1', alpha=0.8)
    
    # Tính bottom cho keyword
    bottom_keyword = bottom_demo + np.array(demographic_scores)
    p4 = ax.bar(x, keyword_scores, width, bottom=bottom_keyword, label='Keyword Score', color='#96CEB4', alpha=0.8)
    
    # Tùy chỉnh biểu đồ
    ax.set_xlabel('Games', fontsize=12, fontweight='bold')
    ax.set_ylabel('Scores', fontsize=12, fontweight='bold')
    ax.set_title(f'Game Recommendation Scores - {user_data["name"]} (ID: {user_data["id"]})\n'
                f'Age: {user_data["age"]}, Gender: {user_data["gender"]}', 
                fontsize=14, fontweight='bold', pad=20)
    
    # Đặt tên games trên trục x (xoay 45 độ)
    ax.set_xticks(x)
    ax.set_xticklabels(game_names, rotation=45, ha='right', fontsize=10)
    
    # Thêm legend
    ax.legend(loc='upper right', fontsize=11)
    
    # Thêm grid để dễ đọc
    ax.grid(True, alpha=0.3, axis='y')
    ax.set_axisbelow(True)
    
    # Thêm giá trị hybrid score lên đỉnh mỗi cột
    for i, rec in enumerate(top_recs):
        total_height = (svd_scores[i] + content_scores[i] + 
                       demographic_scores[i] + keyword_scores[i])
        hybrid_score = rec.get('hybrid_score', 0)
        ax.text(i, total_height + 0.01, f'{hybrid_score:.3f}', 
                ha='center', va='bottom', fontsize=9, fontweight='bold')
    
    # Điều chỉnh layout
    plt.tight_layout()
    
    # Hiển thị thông tin trọng số
    from game_recommendation_system import WEIGHTS_NO_KEYWORD
    weights_text = (f"Weights: SVD({WEIGHTS_NO_KEYWORD['svd']:.0%}) + "
                   f"Content({WEIGHTS_NO_KEYWORD['content']:.0%}) + "
                   f"Demographic({WEIGHTS_NO_KEYWORD['demographic']:.0%})")
    
    plt.figtext(0.5, 0.02, weights_text, ha='center', fontsize=10, 
                style='italic', bbox=dict(boxstyle="round,pad=0.3", facecolor="lightgray", alpha=0.5))
    
    # Lưu biểu đồ
    plt.savefig('game_scores_chart.png', dpi=300, bbox_inches='tight')
    print("Đã lưu biểu đồ vào file: game_scores_chart.png")
    
    # Hiển thị biểu đồ
    plt.show()
    
    return fig

def print_detailed_scores(recommendations, top_n=10):
    """In chi tiết điểm số để kiểm tra"""
    print(f"\n=== CHI TIẾT ĐIỂM SỐ TOP {top_n} GAMES ===")
    print(f"{'Rank':<4} {'Game Name':<25} {'Hybrid':<8} {'SVD':<8} {'Content':<8} {'Demo':<8} {'Keyword':<8}")
    print("-" * 85)
    
    for i, rec in enumerate(recommendations[:top_n], 1):
        print(f"{i:<4} {rec['game_name'][:24]:<25} "
              f"{rec.get('hybrid_score', 0):<8.3f} "
              f"{rec.get('svd_score', 0):<8.3f} "
              f"{rec.get('content_score', 0):<8.3f} "
              f"{rec.get('demographic_score', 0):<8.3f} "
              f"{rec.get('keyword_score', 0):<8.3f}")

def main():
    """Hàm main để chạy visualization"""
    print("=== GAME RECOMMENDATION SCORES VISUALIZATION ===\n")
    
    # Chọn user để phân tích (có thể thay đổi)
    user_id = 2
    
    # Lấy dữ liệu điểm số
    result = get_scores_for_visualization(user_id)
    if not result:
        return
    
    recommendations, user_data = result
    
    print(f"\nĐã lấy được {len(recommendations)} recommendations")
    
    # In chi tiết điểm số
    print_detailed_scores(recommendations, top_n=15)
    
    # Tạo biểu đồ
    print(f"\nTạo biểu đồ cột xếp chồng...")
    create_stacked_bar_chart(recommendations, user_data, top_n=15)
    
    print("\nHoàn thành!")

if __name__ == "__main__":
    # Cài đặt matplotlib để hiển thị tiếng Việt (nếu cần)
    plt.rcParams['font.size'] = 10
    plt.rcParams['axes.unicode_minus'] = False
    
    main()
