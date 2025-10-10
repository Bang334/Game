#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from game_recommendation_system import GameRecommendationSystem

print("Test heatmap voi du lieu moi...")

# Init
recommender = GameRecommendationSystem()
recommender.load_data()
recommender.preprocess_data()
recommender.train_svd_model(k=2)
recommender.build_content_similarity()

# Test voi user 5
user_id = 5
recommendations = recommender.get_hybrid_recommendations(user_id, top_n=100, keyword="")

# Create heatmap
print("\nTao heatmap...")
chart_file = recommender.create_content_comparison_chart(user_id, recommendations)

if chart_file:
    print(f"Success: {chart_file}")
else:
    print("Failed")
