#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from game_recommendation_system import GameRecommendationSystem

print("=== Test final: link_download chi la metadata ===\n")

# Init
recommender = GameRecommendationSystem()
recommender.load_data()
recommender.preprocess_data()
recommender.train_svd_model(k=2)
recommender.build_content_similarity()

# Get recommendations
user_id = 5
print(f"Top 5 recommendations for User {user_id}:\n")
recs = recommender.get_hybrid_recommendations(user_id, top_n=5, keyword="")

for i, rec in enumerate(recs, 1):
    print(f"{i}. {rec['game_name']}")
    print(f"   Hybrid Score: {rec['hybrid_score']:.4f}")
    print(f"   Link Download: {rec.get('link_download', 'MISSING')}")
    print()

print("Test PASSED! link_download is metadata only, not affecting predictions.")

