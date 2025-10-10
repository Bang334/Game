#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script to regenerate content_comparison_chart with new design
"""

import sys
import os

# Set UTF-8 encoding for stdout
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from game_recommendation_system import GameRecommendationSystem

def regenerate_chart(user_id=5):
    """Regenerate content comparison chart for a specific user"""
    print(f"🚀 Initializing recommendation system...")
    
    # Create recommender
    recommender = GameRecommendationSystem()
    
    # Load and prepare data
    recommender.load_data()
    recommender.preprocess_data()
    recommender.train_svd_model(k=2)
    recommender.build_content_similarity()
    
    print(f"✅ System ready!")
    
    # Get user data
    user_data = next((u for u in recommender.users_data if u['id'] == user_id), None)
    if not user_data:
        print(f"❌ User {user_id} not found")
        return
    
    print(f"\n📊 Generating recommendations for {user_data['name']} (ID: {user_id})...")
    
    # Get all recommendations (no keyword)
    recommendations = recommender.get_hybrid_recommendations(
        user_id=user_id,
        top_n=100,  # Get enough recommendations
        keyword=""
    )
    
    print(f"✅ Generated {len(recommendations)} recommendations")
    
    # Generate content comparison chart
    print(f"\n🎨 Creating content comparison chart...")
    chart_file = recommender.create_content_comparison_chart(user_id, recommendations)
    
    if chart_file:
        print(f"✅ Chart saved: {chart_file}")
        print(f"📂 File size: {os.path.getsize(chart_file) / 1024:.1f} KB")
    else:
        print(f"❌ Failed to create chart")

if __name__ == "__main__":
    # Try with user 5 (Action Fan) - has many interacted games for a good chart
    regenerate_chart(user_id=5)
