#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from game_recommendation_system import GameRecommendationSystem

print("Regenerating recommendations.json with image and link_download fields...\n")

# Init system
recommender = GameRecommendationSystem()
recommender.load_data()
recommender.preprocess_data()
recommender.train_svd_model(k=2)
recommender.build_content_similarity()

# Get recommendations
user_id = 5
print(f"Getting recommendations for User {user_id}...\n")
recommendations = recommender.get_hybrid_recommendations(user_id, top_n=60, keyword="")

# Get user data
user_data = next((u for u in recommender.users_data if u['id'] == user_id), None)

# Export to JSON
recommender.export_recommendations_to_json(recommendations, user_data)

print("\nDone! Checking first 3 games:")

import json
with open('recommendations.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    for i, game in enumerate(data['games'][:3], 1):
        print(f"\n{i}. {game['name']}")
        print(f"   Image: {game.get('image', 'MISSING!')}")
        print(f"   Link:  {game.get('link_download', 'MISSING!')}")

