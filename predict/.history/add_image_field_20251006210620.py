#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to add image field to all games
"""

import json

# Load game data
with open('game.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

games = data['games']

print(f"Adding image field to {len(games)} games...")

# Add image field to each game
for game in games:
    # Create image URL based on game name (URL-friendly)
    game_slug = game['name'].lower().replace(' ', '-').replace(':', '').replace("'", '')
    game['image'] = f"https://cdn.gamestore.com/images/{game['id']}/{game_slug}.jpg"
    print(f"  {game['id']:2d}. {game['name']:40s} -> {game['image']}")

# Save updated data
with open('game.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\nSuccess! Added image to all {len(games)} games.")

