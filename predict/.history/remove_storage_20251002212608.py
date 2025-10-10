#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

def remove_storage_fields():
    """Xóa tất cả field storage khỏi min_spec và rec_spec"""
    
    # Đọc file game.json
    with open('game.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Xóa storage từ tất cả games
    for game in data['games']:
        # Xóa storage từ min_spec
        if 'min_spec' in game and 'storage' in game['min_spec']:
            del game['min_spec']['storage']
            print(f"Removed storage from min_spec of {game['name']}")
        
        # Xóa storage từ rec_spec
        if 'rec_spec' in game and 'storage' in game['rec_spec']:
            del game['rec_spec']['storage']
            print(f"Removed storage from rec_spec of {game['name']}")
    
    # Ghi lại file
    with open('game.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nHoàn thành! Đã xóa storage từ tất cả {len(data['games'])} games.")

if __name__ == "__main__":
    remove_storage_fields()
