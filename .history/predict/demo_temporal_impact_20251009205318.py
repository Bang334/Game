#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Demo script để tạo Temporal Impact Chart
Hiển thị ảnh hưởng của interactions gần đây (7 days) vs all-time
"""

import sys
from game_recommendation_system import GameRecommendationSystem

def main():
    print("="*80)
    print("📊 TEMPORAL IMPACT ANALYSIS DEMO")
    print("="*80)
    print("\nĐây là demo thể hiện ảnh hưởng của interactions gần đây đến game scores")
    print("\n📈 Chart sẽ so sánh:")
    print("   1. Scores dựa trên ALL-TIME interactions")
    print("   2. Scores dựa trên 7 DAYS gần nhất")
    print("\n🎯 Mục đích:")
    print("   - Thấy rõ games nào được BOOST bởi recent activities")
    print("   - Thấy rõ games nào bị WEAKEN do preference shift")
    print("="*80)
    
    # Khởi tạo recommender system
    print("\n🚀 Initializing recommendation system...")
    recommender = GameRecommendationSystem()
    
    if not recommender.use_sqlite:
        print("\n❌ Error: SQLite database required for temporal analysis")
        print("   Please ensure game_interactions.db exists in predict/ folder")
        return
    
    # Chọn user để analyze
    user_id = 1
    user_data = next((u for u in recommender.users_data if u['id'] == user_id), None)
    
    if user_data:
        print(f"\n👤 Analyzing user: {user_data['name']} (ID: {user_id})")
        print(f"   Age: {user_data['age']}, Gender: {user_data['gender']}")
    else:
        print(f"\n👤 Analyzing user ID: {user_id}")
    
    # Generate temporal impact chart
    print("\n📊 Generating Temporal Impact Chart...")
    print("   This may take a moment as we calculate both all-time and 7-day scores...")
    
    filename = recommender.create_temporal_impact_chart(
        user_id=user_id,
        keyword="",
        filename="temporal_impact_demo.png"
    )
    
    if filename:
        print(f"\n✅ Success! Chart saved to: {filename}")
        print("\n💡 Cách đọc chart:")
        print("   📍 Left panel: Score comparison bars")
        print("      - Blue (All-time) vs Red (7 days)")
        print("   📍 Right panel: Impact analysis")
        print("      - Green bars: Games BOOSTED by recent interactions")
        print("      - Red bars: Games WEAKENED by preference shift")
        print("      - Arrows (↑↓): Indicate strong impact (>0.05)")
    else:
        print("\n❌ Failed to generate chart")
    
    print("\n" + "="*80)
    print("🎓 TIP: Run with different users to see how recent activities affect recommendations")
    print("   Example: Modify user_id in this script or add command line args")
    print("="*80)

if __name__ == "__main__":
    main()

