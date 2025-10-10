#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to add link_download field to all games
"""

import json

# Load game data
with open('game.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

games = data['games']

print(f"Adding link_download to {len(games)} games...")

# Add link_download field to each game
for game in games:
    # Create download link based on game name (URL-friendly)
    game_slug = game['name'].lower().replace(' ', '-').replace(':', '').replace("'", '')
    game['link_download'] = f"https://gamestore.com/download/{game['id']}/{game_slug}"
    print(f"  {game['id']:2d}. {game['name']:40s} -> {game['link_download']}")

# Save updated data
with open('game.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\nSuccess! Added link_download to all {len(games)} games.")

