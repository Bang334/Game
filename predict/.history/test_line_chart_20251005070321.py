#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import codecs

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from game_recommendation_system import GameRecommendationSystem

print("🚀 Testing new line chart...")

# Init system
recommender = GameRecommendationSystem()
recommender.load_data()
recommender.preprocess_data()
recommender.train_svd_model(k=2)
recommender.build_content_similarity()

# Get recommendations for user 5
user_id = 5
recommendations = recommender.get_hybrid_recommendations(user_id, top_n=100, keyword="")

# Create line chart
print("\n🎨 Creating line chart...")
chart_file = recommender.create_content_comparison_chart(user_id, recommendations)

if chart_file:
    print(f"✅ Line chart created: {chart_file}")
else:
    print("❌ Failed to create chart")
