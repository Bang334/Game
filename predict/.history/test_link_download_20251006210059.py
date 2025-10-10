#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import codecs
import json

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from game_recommendation_system import GameRecommendationSystem

print("=== Testing link_download field ===\n")

# Init system
recommender = GameRecommendationSystem()
recommender.load_data()
recommender.preprocess_data()
recommender.train_svd_model(k=2)
recommender.build_content_similarity()

# Get recommendations
user_id = 5
print(f"Getting recommendations for User {user_id}...\n")
recommendations = recommender.get_hybrid_recommendations(user_id, top_n=5, keyword="")

# Display recommendations with link_download
print(f"Top 5 Recommendations for User {user_id}:")
print("=" * 100)
for i, rec in enumerate(recommendations, 1):
    print(f"\n{i}. {rec['game_name']}")
    print(f"   - Game ID: {rec['game_id']}")
    print(f"   - Hybrid Score: {rec['hybrid_score']:.4f}")
    print(f"   - Genre: {', '.join(rec['genre'])}")
    print(f"   - Price: {rec['price']:,} VND")
    print(f"   - Link Download: {rec.get('link_download', 'NOT FOUND')}")

print("\n" + "=" * 100)
print("\nTest completed!")

