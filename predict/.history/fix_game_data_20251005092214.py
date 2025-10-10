#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de sua lai du lieu game.json cho hop ly hon
"""

import json
import random

# Load data
with open('game.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

games = data['games']
users = data['users']

print("Dang sua lai du lieu...")

# ===== 1. SUA LAI GENRES CHO CAC GAMES =====
print("\nSua genres cho games...")

genre_fixes = {
    1: ["RPG", "Action", "Cyberpunk"],  # Cyberpunk 2077
    3: ["Shooter", "Action", "FPS"],  # Call of Duty
    4: ["Sandbox", "Survival", "Creative"],  # Minecraft
}

for game_id, correct_genres in genre_fixes.items():
    game = next((g for g in games if g['id'] == game_id), None)
    if game:
        game['genre'] = correct_genres
        print(f"  - {game['name']}: {correct_genres}")

# ===== 2. CHUAN HOA SPECS CHO GAMES CUNG PUBLISHER =====
print("\nChuan hoa specs theo publisher...")

# Group games by publisher
publisher_groups = {}
for game in games:
    pub = game['publisher']
    if pub not in publisher_groups:
        publisher_groups[pub] = []
    publisher_groups[pub].append(game)

# Dieu chinh specs cho games cung publisher
for publisher, pub_games in publisher_groups.items():
    if len(pub_games) > 1:
        # Lay game dau tien lam base
        base_game = pub_games[0]
        base_cpu = base_game['min_spec']['cpu']
        base_ram = base_game['min_spec']['ram']
        
        # Ap dung specs tuong tu cho cac games con lai
        for i, game in enumerate(pub_games[1:], 1):
            # Giu nguyen GPU khac nhau nhung CPU/RAM tuong tu
            game['min_spec']['cpu'] = base_cpu
            game['min_spec']['ram'] = base_ram
            
        print(f"  - {publisher}: {len(pub_games)} games - base specs: {base_cpu}, {base_ram}")

# ===== 3. DIEU CHINH USER PREFERENCES THEO TUOI =====
print("\nDieu chinh user preferences theo nhom tuoi...")

# Nhom users theo do tuoi
age_groups = {
    'teen': [],      # 18-21
    'young': [],     # 22-28
    'adult': [],     # 29-35
    'mature': []     # 36+
}

for user in users:
    age = user['age']
    if age <= 21:
        age_groups['teen'].append(user)
    elif age <= 28:
        age_groups['young'].append(user)
    elif age <= 35:
        age_groups['adult'].append(user)
    else:
        age_groups['mature'].append(user)

# Dinh nghia games phu hop cho tung nhom tuoi
popular_games_by_age = {
    'teen': [13, 15, 18, 19, 20, 21, 22],  # Competitive, MOBA, Shooter
    'young': [5, 7, 9, 10, 12, 18, 19, 21],  # Action, RPG, Shooter
    'adult': [5, 7, 10, 11, 14, 24, 25, 30],  # RPG, MMORPG, Simulation
    'mature': [11, 14, 24, 25, 41, 43, 51, 52]  # Sports, Simulation, Strategy
}

# Dieu chinh favorite_games va purchased_games cho users trong cung nhom tuoi
for group_name, group_users in age_groups.items():
    if len(group_users) == 0:
        continue
    
    popular_games = popular_games_by_age[group_name]
    
    for user in group_users:
        # Giu mot so games cu, them games pho bien trong nhom tuoi
        old_favorites = user.get('favorite_games', [])
        old_purchased = user.get('purchased_games', [])
        
        # Chon 3-5 games tu danh sach pho bien
        num_popular = random.randint(3, 5)
        new_favorites = random.sample(popular_games, min(num_popular, len(popular_games)))
        
        # Ket hop games cu va moi (uu tien games moi)
        user['favorite_games'] = list(set(new_favorites + old_favorites[:2]))[:6]
        
        # Purchased games bao gom favorites + them mot so games khac
        additional = random.sample(popular_games, min(3, len(popular_games)))
        user['purchased_games'] = list(set(user['favorite_games'] + additional + old_purchased[:2]))[:10]
    
    print(f"  - {group_name}: {len(group_users)} users - popular games: {popular_games[:5]}")

# ===== 4. DIEU CHINH VIEW HISTORY DUA TREN PURCHASED GAMES =====
print("\nDieu chinh view history...")

for user in users:
    purchased = user.get('purchased_games', [])
    favorites = user.get('favorite_games', [])
    
    # Tao view history moi dua tren purchased va favorites
    new_view_history = {}
    
    # Favorite games duoc xem nhieu (8-15 lan)
    for game_id in favorites:
        new_view_history[str(game_id)] = random.randint(8, 15)
    
    # Purchased games duoc xem trung binh (5-10 lan)
    for game_id in purchased:
        if str(game_id) not in new_view_history:
            new_view_history[str(game_id)] = random.randint(5, 10)
    
    # Them mot so games khac duoc xem it (1-4 lan)
    num_other = random.randint(3, 7)
    all_game_ids = [g['id'] for g in games]
    viewed_ids = [int(k) for k in new_view_history.keys()]
    other_games = [gid for gid in all_game_ids if gid not in viewed_ids]
    
    if len(other_games) > 0:
        selected_others = random.sample(other_games, min(num_other, len(other_games)))
        for game_id in selected_others:
            new_view_history[str(game_id)] = random.randint(1, 4)
    
    user['view_history'] = new_view_history

print("  - Updated view history for all users")

# ===== 5. LUU FILE MOI =====
print("\nLuu file...")

# Backup file cu
import shutil
shutil.copy('game.json', 'game_backup.json')
print("  - Backup: game_backup.json")

# Luu file moi
with open('game.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("  - Saved: game.json")

# ===== 6. HIEN THI THONG KE =====
print("\nThong ke:")
print(f"  - Tong so games: {len(games)}")
print(f"  - Tong so users: {len(users)}")
print(f"  - Publishers: {len(publisher_groups)}")
print(f"  - Age groups:")
for group, group_users in age_groups.items():
    if len(group_users) > 0:
        avg_age = sum(u['age'] for u in group_users) / len(group_users)
        print(f"    + {group}: {len(group_users)} users (avg age: {avg_age:.1f})")

print("\nHoan tat!")