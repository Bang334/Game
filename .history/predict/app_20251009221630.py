#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
GAME RECOMMENDATION WEB APP
Flask web application với thông minh dựa trên tương tác người dùng
"""

from flask import Flask, render_template, request, jsonify, session
import json
import os
import numpy as np
from datetime import datetime
import sqlite3
from game_recommendation_system import GameRecommendationSystem

app = Flask(__name__)
app.secret_key = 'game_recommendation_secret_key_2024'

# Khởi tạo recommendation system
recommender = None
user_interactions = {}  # Lưu trữ tương tác người dùng
learning_data = {}      # Dữ liệu học từ tương tác

def init_recommender():
    """Khởi tạo recommendation system"""
    global recommender
    if recommender is None:
        print("🚀 Khởi tạo Game Recommendation System...")
        recommender = GameRecommendationSystem()
        recommender.load_data()
        recommender.preprocess_data()
        recommender.train_svd_model()
        recommender.build_content_similarity()
        print("✅ Hệ thống đã sẵn sàng!")
    return recommender

def init_database():
    """Khởi tạo database để lưu trữ tương tác"""
    conn = sqlite3.connect('user_interactions.db')
    cursor = conn.cursor()
    
    # Bảng lưu trữ tương tác người dùng
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            game_id INTEGER,
            interaction_type TEXT,
            rating REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Bảng lưu trữ feedback
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            game_id INTEGER,
            feedback_type TEXT,
            score REAL,
            comment TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Bảng lưu trữ learning data
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS learning_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            feature_name TEXT,
            feature_value REAL,
            weight REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database đã được khởi tạo!")

def get_user_interactions(user_id):
    """Lấy tương tác của user"""
    conn = sqlite3.connect('user_interactions.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT game_id, interaction_type, rating, timestamp 
        FROM user_interactions 
        WHERE user_id = ? 
        ORDER BY timestamp DESC
    ''', (user_id,))
    
    interactions = cursor.fetchall()
    conn.close()
    
    return interactions

def save_user_interaction(user_id, game_id, interaction_type, rating=None):
    """Lưu tương tác người dùng"""
    conn = sqlite3.connect('user_interactions.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO user_interactions (user_id, game_id, interaction_type, rating)
        VALUES (?, ?, ?, ?)
    ''', (user_id, game_id, interaction_type, rating))
    
    conn.commit()
    conn.close()
    
    # Cập nhật learning data
    update_learning_data(user_id, game_id, interaction_type, rating)

def update_learning_data(user_id, game_id, interaction_type, rating):
    """Cập nhật dữ liệu học từ tương tác"""
    global learning_data
    
    if user_id not in learning_data:
        learning_data[user_id] = {
            'preferences': {},
            'behavior_patterns': {},
            'interaction_history': []
        }
    
    # Lưu lịch sử tương tác
    learning_data[user_id]['interaction_history'].append({
        'game_id': game_id,
        'type': interaction_type,
        'rating': rating,
        'timestamp': datetime.now()
    })
    
    # Cập nhật preferences dựa trên tương tác
    if interaction_type == 'view':
        if 'viewed_games' not in learning_data[user_id]['preferences']:
            learning_data[user_id]['preferences']['viewed_games'] = []
        learning_data[user_id]['preferences']['viewed_games'].append(game_id)
    
    elif interaction_type == 'like':
        if 'liked_games' not in learning_data[user_id]['preferences']:
            learning_data[user_id]['preferences']['liked_games'] = []
        learning_data[user_id]['preferences']['liked_games'].append(game_id)
    
    elif interaction_type == 'purchase':
        if 'purchased_games' not in learning_data[user_id]['preferences']:
            learning_data[user_id]['preferences']['purchased_games'] = []
        learning_data[user_id]['preferences']['purchased_games'].append(game_id)
    
    # Phân tích behavior patterns
    analyze_user_behavior(user_id)
    
    # Kiểm tra có cần retrain SVD model không
    check_and_retrain_svd(user_id)

def analyze_user_behavior(user_id):
    """Phân tích hành vi người dùng để cải thiện recommendations"""
    if user_id not in learning_data:
        return
    
    user_data = learning_data[user_id]
    interactions = user_data['interaction_history']
    
    if len(interactions) < 2:  # Cần ít nhất 2 tương tác để phân tích
        return
    
    # Phân tích thời gian tương tác
    recent_interactions = [i for i in interactions if 
                         (datetime.now() - i['timestamp']).days <= 7]
    
    if len(recent_interactions) > 0:
        user_data['behavior_patterns']['active_recently'] = True
        user_data['behavior_patterns']['recent_activity_score'] = len(recent_interactions) / 7.0
    else:
        user_data['behavior_patterns']['active_recently'] = False
    
    # Phân tích loại games ưa thích
    game_types = {}
    release_dates = []
    price_ranges = []
    platforms = {}
    publishers = {}
    
    for interaction in interactions:
        # Lấy thông tin game từ recommender
        game_info = next((g for g in recommender.games_data if g['id'] == interaction['game_id']), None)
        if game_info:
            # Phân tích genres
            for genre in game_info.get('genre', []):
                if genre not in game_types:
                    game_types[genre] = 0
                game_types[genre] += 1
            
            # Phân tích platforms
            for platform in game_info.get('platform', []):
                if platform not in platforms:
                    platforms[platform] = 0
                platforms[platform] += 1
            
            # Phân tích publishers
            publisher = game_info.get('publisher', 'Unknown')
            if publisher not in publishers:
                publishers[publisher] = 0
            publishers[publisher] += 1
            
            # Phân tích release year
            release_date = game_info.get('release_date', '2020-01-01')
            if release_date:
                try:
                    release_year = int(release_date.split('-')[0])
                    release_dates.append(release_year)
                except:
                    release_dates.append(2020)
            
            # Phân tích price
            price = game_info.get('price', 0)
            price_ranges.append(price)
    
    user_data['behavior_patterns']['preferred_genres'] = game_types
    user_data['behavior_patterns']['preferred_platforms'] = platforms
    user_data['behavior_patterns']['preferred_publishers'] = publishers
    
    # Phân tích release year preferences
    if release_dates:
        current_year = datetime.now().year
        recent_years = [year for year in release_dates if year >= current_year - 2]
        user_data['behavior_patterns']['prefers_new_games'] = len(recent_years) / len(release_dates) > 0.5
        user_data['behavior_patterns']['avg_release_year'] = sum(release_dates) / len(release_dates)
    else:
        user_data['behavior_patterns']['prefers_new_games'] = False
        user_data['behavior_patterns']['avg_release_year'] = 2020
    
    # Phân tích price preferences
    if price_ranges:
        avg_price = sum(price_ranges) / len(price_ranges)
        user_data['behavior_patterns']['avg_price'] = avg_price
        user_data['behavior_patterns']['price_tolerance'] = {
            'low': avg_price < 500000,      # < 500k
            'medium': 500000 <= avg_price < 1500000,  # 500k - 1.5M
            'high': avg_price >= 1500000   # > 1.5M
        }
    else:
        user_data['behavior_patterns']['avg_price'] = 0
        user_data['behavior_patterns']['price_tolerance'] = {'medium': True}
    
    # Phân tích tương tác với game ngoài top 10
    # Lấy top 10 games phổ biến nhất (dựa trên downloads)
    try:
        with open('game.json', 'r', encoding='utf-8') as f:
            all_games = json.load(f)
        
        # Sắp xếp games theo downloads (giảm dần)
        sorted_games = sorted(all_games, key=lambda x: x.get('downloads', 0), reverse=True)
        top_10_game_ids = [game['id'] for game in sorted_games[:10]]
        
        # Đếm tương tác với game ngoài top 10
        interactions_outside_top10 = 0
        total_interactions = len(interactions)
        
        for interaction in interactions:
            game_id = interaction['game_id']
            if game_id not in top_10_game_ids:
                interactions_outside_top10 += 1
        
        # Tính tỷ lệ tương tác ngoài top 10
        if total_interactions > 0:
            outside_top10_ratio = interactions_outside_top10 / total_interactions
            user_data['behavior_patterns']['outside_top10_ratio'] = outside_top10_ratio
            user_data['behavior_patterns']['prefers_niche_games'] = outside_top10_ratio > 0.6  # > 60% tương tác ngoài top 10
        else:
            user_data['behavior_patterns']['outside_top10_ratio'] = 0.0
            user_data['behavior_patterns']['prefers_niche_games'] = False
            
    except Exception as e:
        print(f"Warning: Could not analyze top 10 games: {e}")
        user_data['behavior_patterns']['outside_top10_ratio'] = 0.0
        user_data['behavior_patterns']['prefers_niche_games'] = False
    
    # Phân tích mức độ tương tác
    view_count = len([i for i in interactions if i['type'] == 'view'])
    like_count = len([i for i in interactions if i['type'] == 'like'])
    purchase_count = len([i for i in interactions if i['type'] == 'purchase'])
    
    user_data['behavior_patterns']['engagement_level'] = {
        'views': view_count,
        'likes': like_count,
        'purchases': purchase_count,
        'total': len(interactions)
    }
    
    # Tính engagement score (0-1)
    total_interactions = len(interactions)
    if total_interactions > 0:
        engagement_score = (like_count * 2 + purchase_count * 3) / (total_interactions * 3)
        user_data['behavior_patterns']['engagement_score'] = min(engagement_score, 1.0)
    else:
        user_data['behavior_patterns']['engagement_score'] = 0.0
    
    # Phân tích conversion rate (view -> like -> purchase)
    if view_count > 0:
        like_conversion = like_count / view_count
        user_data['behavior_patterns']['like_conversion_rate'] = like_conversion
    else:
        user_data['behavior_patterns']['like_conversion_rate'] = 0.0
    
    if like_count > 0:
        purchase_conversion = purchase_count / like_count
        user_data['behavior_patterns']['purchase_conversion_rate'] = purchase_conversion
    else:
        user_data['behavior_patterns']['purchase_conversion_rate'] = 0.0
    
    # Phân tích session patterns
    session_interactions = {}
    for interaction in interactions:
        session_id = interaction.get('session_id', 'unknown')
        if session_id not in session_interactions:
            session_interactions[session_id] = []
        session_interactions[session_id].append(interaction)
    
    user_data['behavior_patterns']['session_patterns'] = {
        'total_sessions': len(session_interactions),
        'avg_interactions_per_session': total_interactions / len(session_interactions) if session_interactions else 0,
        'longest_session': max([len(session) for session in session_interactions.values()]) if session_interactions else 0
    }
    
    # Lưu behavior patterns vào database
    save_behavior_patterns_to_db(user_id, user_data['behavior_patterns'])

def save_behavior_patterns_to_db(user_id, behavior_patterns):
    """Lưu behavior patterns vào database"""
    try:
        conn = sqlite3.connect('user_interactions.db')
        cursor = conn.cursor()
        
        # Chuẩn bị dữ liệu
        preferred_genres = json.dumps(behavior_patterns.get('preferred_genres', {}))
        avg_price_range = f"{behavior_patterns.get('avg_price', 0):.0f}"
        prefers_new_games = 1 if behavior_patterns.get('prefers_new_games', False) else 0
        engagement_score = behavior_patterns.get('engagement_score', 0.0)
        pattern_data = json.dumps(behavior_patterns)
        
        # Insert or update behavior patterns
        cursor.execute('''
            INSERT OR REPLACE INTO user_behavior_patterns 
            (user_id, preferred_genres, avg_price_range, prefers_new_games, 
             engagement_score, last_analyzed, pattern_data)
            VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
        ''', [user_id, preferred_genres, avg_price_range, prefers_new_games, 
              engagement_score, pattern_data])
        
        conn.commit()
        conn.close()
        
        print(f"✅ Saved behavior patterns for user {user_id}")
        
    except Exception as e:
        print(f"❌ Error saving behavior patterns: {e}")

# ===== GLOBAL WEIGHT CONFIGURATIONS =====
# Các biến toàn cục để dễ quản lý và thay đổi trọng số

# Trọng số khi KHÔNG có keyword
DEFAULT_SVD_WEIGHT_NO_KEYWORD = 0.45        # 45% SVD
DEFAULT_CONTENT_WEIGHT_NO_KEYWORD = 0.35    # 35% Content-based
DEFAULT_DEMOGRAPHIC_WEIGHT_NO_KEYWORD = 0.20 # 20% Demographic
DEFAULT_KEYWORD_WEIGHT_NO_KEYWORD = 0.0     # 0% Keyword

# Trọng số khi CÓ keyword
DEFAULT_SVD_WEIGHT_WITH_KEYWORD = 0.15      # 15% SVD
DEFAULT_CONTENT_WEIGHT_WITH_KEYWORD = 0.15  # 15% Content-based
DEFAULT_DEMOGRAPHIC_WEIGHT_WITH_KEYWORD = 0.10 # 10% Demographic
DEFAULT_KEYWORD_WEIGHT_WITH_KEYWORD = 0.60  # 60% Keyword

def get_dynamic_weights(user_id, keyword=None):
    """Tính trọng số động dựa trên behavior patterns và keyword"""
    # Kiểm tra có keyword không
    has_keyword = keyword and keyword.strip()
    
    if user_id not in learning_data:
        # Trọng số mặc định - THỐNG NHẤT với game_recommendation_system.py
        if has_keyword:
            return {
                'svd': DEFAULT_SVD_WEIGHT_WITH_KEYWORD,        # 15%
                'content': DEFAULT_CONTENT_WEIGHT_WITH_KEYWORD,    # 15%
                'demographic': DEFAULT_DEMOGRAPHIC_WEIGHT_WITH_KEYWORD, # 10%
                'keyword': DEFAULT_KEYWORD_WEIGHT_WITH_KEYWORD     # 60%
            }
        else:
            return {
                'svd': DEFAULT_SVD_WEIGHT_NO_KEYWORD,        # 45%
                'content': DEFAULT_CONTENT_WEIGHT_NO_KEYWORD,    # 35%
                'demographic': DEFAULT_DEMOGRAPHIC_WEIGHT_NO_KEYWORD, # 20%
                'keyword': DEFAULT_KEYWORD_WEIGHT_NO_KEYWORD      # 0%
            }
    
    user_data = learning_data[user_id]
    behavior = user_data.get('behavior_patterns', {})
    
    # Trọng số cơ bản dựa trên keyword - SỬ DỤNG BIẾN TOÀN CỤC
    if has_keyword:
        weights = {
            'svd': DEFAULT_SVD_WEIGHT_WITH_KEYWORD,        # 15%
            'content': DEFAULT_CONTENT_WEIGHT_WITH_KEYWORD,    # 15%
            'demographic': DEFAULT_DEMOGRAPHIC_WEIGHT_WITH_KEYWORD, # 10%
            'keyword': DEFAULT_KEYWORD_WEIGHT_WITH_KEYWORD     # 60%
        }
    else:
        weights = {
            'svd': DEFAULT_SVD_WEIGHT_NO_KEYWORD,        # 45%
            'content': DEFAULT_CONTENT_WEIGHT_NO_KEYWORD,    # 35%
            'demographic': DEFAULT_DEMOGRAPHIC_WEIGHT_NO_KEYWORD, # 20%
            'keyword': DEFAULT_KEYWORD_WEIGHT_NO_KEYWORD      # 0%
        }
    
    # Điều chỉnh dựa trên behavior patterns
    
    # 1. Nếu user thích games mới → Tăng content weight (dựa trên attributes)
    if behavior.get('prefers_new_games', False):
        if has_keyword:
            weights['content'] += 0.05
            weights['svd'] -= 0.03
            weights['demographic'] -= 0.02
        else:
            weights['content'] += 0.1
            weights['svd'] -= 0.05
            weights['demographic'] -= 0.05
    
    # 2. Nếu user có nhiều tương tác → Tăng SVD weight (collaborative filtering)
    engagement = behavior.get('engagement_level', {})
    total_interactions = engagement.get('total', 0)
    engagement_score = behavior.get('engagement_score', 0.0)
    
    if total_interactions > 10:  # User có nhiều tương tác
        if has_keyword:
            weights['svd'] += 0.05
            weights['content'] -= 0.03
            weights['demographic'] -= 0.02
        else:
            weights['svd'] += 0.1
            weights['content'] -= 0.05
            weights['demographic'] -= 0.05
    
    # 3. Nếu user có engagement score cao → Tăng SVD weight
    if engagement_score > 0.5:  # User có tỷ lệ like/purchase cao
        if has_keyword:
            weights['svd'] += 0.03
            weights['content'] -= 0.02
            weights['demographic'] -= 0.01
        else:
            weights['svd'] += 0.05
            weights['content'] -= 0.03
            weights['demographic'] -= 0.02
    
    # 4. Nếu user có genre preferences rõ ràng → Tăng content weight
    preferred_genres = behavior.get('preferred_genres', {})
    if len(preferred_genres) > 0:
        max_genre_count = max(preferred_genres.values()) if preferred_genres else 0
        if max_genre_count >= 3:  # User có genre preference rõ ràng
            if has_keyword:
                weights['content'] += 0.03
                weights['svd'] -= 0.02
                weights['demographic'] -= 0.01
            else:
                weights['content'] += 0.05
                weights['svd'] -= 0.03
                weights['demographic'] -= 0.02
    
    # 5. Nếu user active gần đây → Tăng content weight (preferences hiện tại)
    if behavior.get('active_recently', False):
        if has_keyword:
            weights['content'] += 0.03
            weights['svd'] -= 0.02
            weights['demographic'] -= 0.01
        else:
            weights['content'] += 0.05
            weights['svd'] -= 0.03
            weights['demographic'] -= 0.02
    
    # 6. Nếu user có conversion rate cao → Tăng SVD weight
    like_conversion = behavior.get('like_conversion_rate', 0.0)
    purchase_conversion = behavior.get('purchase_conversion_rate', 0.0)
    
    if like_conversion > 0.3:  # User có tỷ lệ like cao
        if has_keyword:
            weights['svd'] += 0.02
            weights['content'] -= 0.01
            weights['demographic'] -= 0.01
        else:
            weights['svd'] += 0.03
            weights['content'] -= 0.02
            weights['demographic'] -= 0.01
    
    if purchase_conversion > 0.2:  # User có tỷ lệ purchase cao
        if has_keyword:
            weights['svd'] += 0.03
            weights['content'] -= 0.02
            weights['demographic'] -= 0.01
        else:
            weights['svd'] += 0.05
            weights['content'] -= 0.03
            weights['demographic'] -= 0.02
    
    # 7. Nếu user có session patterns dài → Tăng content weight
    session_patterns = behavior.get('session_patterns', {})
    avg_interactions_per_session = session_patterns.get('avg_interactions_per_session', 0)
    
    if avg_interactions_per_session > 5:  # User có session dài
        if has_keyword:
            weights['content'] += 0.02
            weights['svd'] -= 0.01
            weights['demographic'] -= 0.01
        else:
            weights['content'] += 0.03
            weights['svd'] -= 0.02
            weights['demographic'] -= 0.01
    
    # 8. Nếu user thường xuyên tương tác với game ngoài top 10 → Giảm keyword weight
    # (Keyword prediction không chính xác, cần giảm trọng số để các thuật toán khác gợi ý tốt hơn)
    outside_top10_ratio = behavior.get('outside_top10_ratio', 0.0)
    prefers_niche_games = behavior.get('prefers_niche_games', False)
    
    if prefers_niche_games and outside_top10_ratio > 0.6:  # > 60% tương tác ngoài top 10
        if has_keyword:
            # Keyword prediction không chính xác → Giảm keyword weight, tăng SVD và content
            weights['keyword'] -= 0.10  # Giảm keyword từ 60% xuống 50%
            weights['svd'] += 0.05      # Tăng SVD từ 15% lên 20%
            weights['content'] += 0.05  # Tăng content từ 15% lên 20%
            # demographic giữ nguyên 10%
        else:
            # Không có keyword, tăng SVD và content để gợi ý tốt hơn
            weights['svd'] += 0.05      # Tăng SVD từ 45% lên 50%
            weights['content'] += 0.05  # Tăng content từ 35% lên 40%
            weights['demographic'] -= 0.10  # Giảm demographic từ 20% xuống 10%
    
    elif outside_top10_ratio > 0.4:  # 40-60% tương tác ngoài top 10 (mức độ vừa phải)
        if has_keyword:
            # Keyword prediction kém chính xác → Giảm keyword weight nhẹ
            weights['keyword'] -= 0.05  # Giảm keyword từ 60% xuống 55%
            weights['svd'] += 0.03      # Tăng SVD từ 15% lên 18%
            weights['content'] += 0.02  # Tăng content từ 15% lên 17%
        else:
            # Tăng SVD và content nhẹ để cải thiện gợi ý
            weights['svd'] += 0.03      # Tăng SVD từ 45% lên 48%
            weights['content'] += 0.02  # Tăng content từ 35% lên 37%
            weights['demographic'] -= 0.05  # Giảm demographic từ 20% xuống 15%
    
    # Đảm bảo tổng = 1.0
    total = sum(weights.values())
    for key in weights:
        weights[key] = weights[key] / total
    
    return weights

def check_and_retrain_svd(user_id):
    """Kiểm tra và retrain SVD model nếu cần thiết"""
    global recommender
    
    if user_id not in learning_data:
        return
    
    user_data = learning_data[user_id]
    interactions = user_data['interaction_history']
    
    # Chỉ retrain nếu có đủ dữ liệu
    if len(interactions) < 10:  # Cần ít nhất 10 tương tác
        return
    
    # Kiểm tra xem có cần retrain không (mỗi 50 tương tác mới)
    last_retrain = user_data.get('last_retrain_count', 0)
    current_count = len(interactions)
    
    if current_count - last_retrain >= 50:  # Retrain mỗi 50 tương tác mới
        print(f"🔄 Auto-retraining SVD model for user {user_id}...")
        
        try:
            # Retrain SVD model
            recommender.retrain_svd_model()
            
            # Cập nhật last retrain count
            user_data['last_retrain_count'] = current_count
            
            # Log retraining event
            log_retraining_event(user_id, current_count)
            
            print(f"✅ SVD model retrained for user {user_id}")
            
        except Exception as e:
            print(f"❌ Error retraining SVD model: {e}")

def log_retraining_event(user_id, interactions_count):
    """Log retraining event vào database"""
    try:
        conn = sqlite3.connect('user_interactions.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO ai_training_log 
            (user_id, training_type, interactions_count, timestamp, notes)
            VALUES (?, ?, ?, datetime('now'), ?)
        ''', [user_id, 'auto_retrain', interactions_count, f'Auto-retrained after {interactions_count} interactions'])
        
        conn.commit()
        conn.close()
        
        print(f"✅ Logged retraining event for user {user_id}")
        
    except Exception as e:
        print(f"❌ Error logging retraining event: {e}")

def get_system_health():
    """Kiểm tra tình trạng hệ thống AI"""
    try:
        conn = sqlite3.connect('user_interactions.db')
        cursor = conn.cursor()
        
        # Lấy thống kê tổng quan
        cursor.execute('SELECT COUNT(*) FROM user_interactions')
        total_interactions = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(DISTINCT user_id) FROM user_interactions')
        total_users = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM user_behavior_patterns')
        users_with_behavior = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM ai_training_log')
        total_retrains = cursor.fetchone()[0]
        
        # Lấy retrain gần nhất
        cursor.execute('''
            SELECT timestamp, interactions_count, notes 
            FROM ai_training_log 
            ORDER BY timestamp DESC 
            LIMIT 1
        ''')
        last_retrain = cursor.fetchone()
        
        conn.close()
        
        return {
            'total_interactions': total_interactions,
            'total_users': total_users,
            'users_with_behavior': users_with_behavior,
            'total_retrains': total_retrains,
            'last_retrain': last_retrain,
            'system_status': 'healthy' if total_interactions > 0 else 'no_data'
        }
        
    except Exception as e:
        print(f"❌ Error getting system health: {e}")
        return {
            'system_status': 'error',
            'error': str(e)
        }
    
    # Chỉ retrain nếu có đủ dữ liệu mới (ít nhất 5 tương tác mới)
    if len(interactions) < 5:
        return
    
    # Kiểm tra xem có cần retrain không (mỗi 10 tương tác)
    if len(interactions) % 10 == 0:
        print(f"🔄 Retraining SVD model for user {user_id}...")
        
        # Cập nhật user-item matrix với dữ liệu mới
        try:
            # Lấy recommender instance
            global recommender
            if recommender:
                # Cập nhật user data trong recommender
                for user in recommender.users_data:
                    if user['id'] == user_id:
                        # Cập nhật favorite_games, purchased_games từ learning_data
                        user['favorite_games'] = learning_data[user_id]['preferences'].get('liked_games', [])
                        user['purchased_games'] = learning_data[user_id]['preferences'].get('purchased_games', [])
                        break
                
                # Retrain SVD model
                recommender.preprocess_data()
                recommender.train_svd_model()
                print(f"✅ SVD model retrained successfully for user {user_id}")
                
                # Ghi log retrain vào file với tham số model
                log_retrain_info(user_id, interactions, recommender)
                
        except Exception as e:
            print(f"❌ Error retraining SVD model: {e}")
            log_retrain_error(user_id, str(e))

def log_retrain_info(user_id, interactions, recommender=None):
    """Ghi thông tin retrain vào file log"""
    try:
        from datetime import datetime
        import json
        import numpy as np
        
        # Tạo thông tin retrain
        retrain_info = {
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'user_id': user_id,
            'total_interactions': len(interactions),
            'interaction_types': {},
            'recent_interactions': [],
            'behavior_patterns': learning_data.get(user_id, {}).get('behavior_patterns', {}),
            'preferences': learning_data.get(user_id, {}).get('preferences', {}),
            'model_parameters': {}
        }
        
        # Đếm loại tương tác
        for interaction in interactions:
            interaction_type = interaction.get('type', 'unknown')
            if interaction_type not in retrain_info['interaction_types']:
                retrain_info['interaction_types'][interaction_type] = 0
            retrain_info['interaction_types'][interaction_type] += 1
        
        # Lấy 5 tương tác gần nhất
        recent_interactions = sorted(interactions, key=lambda x: x.get('timestamp', datetime.now()), reverse=True)[:5]
        for interaction in recent_interactions:
            retrain_info['recent_interactions'].append({
                'game_id': interaction.get('game_id'),
                'type': interaction.get('type'),
                'rating': interaction.get('rating'),
                'timestamp': interaction.get('timestamp').strftime('%Y-%m-%d %H:%M:%S') if interaction.get('timestamp') else 'N/A'
            })
        
        # Ghi tham số model nếu có recommender
        if recommender:
            try:
                # SVD model parameters
                if hasattr(recommender, 'svd_model') and recommender.svd_model is not None:
                    if isinstance(recommender.svd_model, dict):
                        # SVD model là dict
                        retrain_info['model_parameters']['svd'] = {
                            'model_type': 'dict',
                            'keys': list(recommender.svd_model.keys()),
                            'size': len(recommender.svd_model)
                        }
                    else:
                        # SVD model là object
                        svd_params = {
                            'model_type': str(type(recommender.svd_model).__name__)
                        }
                        
                        # Thêm các thuộc tính có sẵn
                        if hasattr(recommender.svd_model, 'n_factors'):
                            svd_params['n_factors'] = recommender.svd_model.n_factors
                        if hasattr(recommender.svd_model, 'n_epochs'):
                            svd_params['n_epochs'] = recommender.svd_model.n_epochs
                        if hasattr(recommender.svd_model, 'lr_all'):
                            svd_params['lr_all'] = recommender.svd_model.lr_all
                        if hasattr(recommender.svd_model, 'reg_all'):
                            svd_params['reg_all'] = recommender.svd_model.reg_all
                        
                        retrain_info['model_parameters']['svd'] = svd_params
                
                # User-Item matrix info
                if hasattr(recommender, 'user_item_matrix') and recommender.user_item_matrix is not None:
                    matrix = recommender.user_item_matrix
                    retrain_info['model_parameters']['user_item_matrix'] = {
                        'shape': list(matrix.shape),
                        'type': str(type(matrix).__name__)
                    }
                
                # Content similarity matrix info
                if hasattr(recommender, 'content_similarity_matrix') and recommender.content_similarity_matrix is not None:
                    retrain_info['model_parameters']['content_similarity'] = {
                        'shape': list(recommender.content_similarity_matrix.shape),
                        'type': str(type(recommender.content_similarity_matrix).__name__)
                    }
                
                # Dynamic weights for this user
                dynamic_weights = get_dynamic_weights(user_id)
                retrain_info['model_parameters']['dynamic_weights'] = dynamic_weights
                
                # User behavior analysis
                user_data = learning_data.get(user_id, {})
                behavior = user_data.get('behavior_patterns', {})
                retrain_info['model_parameters']['user_analysis'] = {
                    'engagement_level': behavior.get('engagement_level', {}),
                    'preferred_genres': behavior.get('preferred_genres', {}),
                    'prefers_new_games': behavior.get('prefers_new_games', False),
                    'active_recently': behavior.get('active_recently', False),
                    'avg_release_year': behavior.get('avg_release_year', 2020),
                    'avg_price': behavior.get('avg_price', 0)
                }
                
            except Exception as e:
                retrain_info['model_parameters']['error'] = f"Error extracting model parameters: {str(e)}"
        
        # Ghi vào file log (append mode)
        with open('ai_retrain_log.json', 'a', encoding='utf-8') as f:
            f.write(json.dumps(retrain_info, ensure_ascii=False, indent=2) + '\n')
        
        print(f"📝 Retrain log saved for user {user_id}")
        
    except Exception as e:
        print(f"❌ Error logging retrain info: {e}")

def log_retrain_error(user_id, error_message):
    """Ghi lỗi retrain vào file log"""
    try:
        from datetime import datetime
        import json
        
        error_info = {
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'user_id': user_id,
            'error': error_message,
            'type': 'retrain_error'
        }
        
        # Ghi vào file log (append mode)
        with open('ai_retrain_log.json', 'a', encoding='utf-8') as f:
            f.write(json.dumps(error_info, ensure_ascii=False, indent=2) + '\n')
        
        print(f"📝 Error log saved for user {user_id}")
        
    except Exception as e:
        print(f"❌ Error logging retrain error: {e}")

def get_smart_recommendations(user_id, top_n=None, keyword=None):
    """Lấy recommendations thông minh dựa trên tương tác và keyword"""
    # Sử dụng trực tiếp get_hybrid_recommendations từ game_recommendation_system.py
    # Hàm này đã có sẵn logic xử lý keyword và trọng số động
    # ⏰ SỬ DỤNG 7 NGÀY GẦN NHẤT để analyze preferences
    basic_recs = recommender.get_hybrid_recommendations(
        user_id=user_id, 
        top_n=top_n, 
        keyword=keyword,
        enable_adaptive=True,    # Bật adaptive boosting
        recent_days=7            # Analyze từ 7 ngày gần đây
    )
    
    # Áp dụng learning từ tương tác
    if user_id in learning_data:
        user_data = learning_data[user_id]
        
        # Boost games theo preferred genres, release year, và price
        for rec in basic_recs:
            game_id = rec['game_id']
            game_info = next((g for g in recommender.games_data if g['id'] == game_id), None)
            
            if game_info:
                total_boost = 0
                
                # 1. Genre boost
                if 'preferred_genres' in user_data['behavior_patterns']:
                    preferred_genres = user_data['behavior_patterns']['preferred_genres']
                    game_genres = game_info.get('genre', [])
                    
                    genre_boost = 0
                    for genre in game_genres:
                        if genre in preferred_genres:
                            genre_boost += preferred_genres[genre] * 0.1
                    total_boost += genre_boost
                
                # 2. Release year boost (games mới)
                if user_data['behavior_patterns'].get('prefers_new_games', False):
                    current_year = datetime.now().year
                    release_date = game_info.get('release_date', '2020-01-01')
                    try:
                        game_year = int(release_date.split('-')[0]) if release_date else 2020
                    except:
                        game_year = 2020
                    if game_year >= current_year - 1:  # Games trong 1 năm gần đây
                        year_boost = 0.15  # Boost cao cho games mới
                        total_boost += year_boost
                
                # 3. Price boost (theo price tolerance)
                price_tolerance = user_data['behavior_patterns'].get('price_tolerance', {})
                game_price = game_info.get('price', 0)
                
                if price_tolerance.get('low', False) and game_price < 500000:
                    total_boost += 0.1
                elif price_tolerance.get('medium', False) and 500000 <= game_price < 1500000:
                    total_boost += 0.1
                elif price_tolerance.get('high', False) and game_price >= 1500000:
                    total_boost += 0.1
                
                rec['hybrid_score'] += total_boost
        
        # Boost cho users hoạt động gần đây
        if user_data['behavior_patterns'].get('active_recently', False):
            recent_boost = user_data['behavior_patterns'].get('recent_activity_score', 0) * 0.05
            for rec in basic_recs:
                rec['hybrid_score'] += recent_boost
    
    # Sắp xếp lại theo hybrid score (đã được tính trong get_hybrid_recommendations)
    basic_recs.sort(key=lambda x: x['hybrid_score'], reverse=True)
    
    
    return basic_recs

@app.route('/')
def index():
    """Trang chủ"""
    return render_template('index.html')

@app.route('/users')
def users():
    """Trang danh sách users"""
    recommender = init_recommender()
    return render_template('users.html', users=recommender.users_data)

@app.route('/user/<int:user_id>')
def user_profile(user_id):
    """Trang profile user"""
    recommender = init_recommender()
    user_data = next((u for u in recommender.users_data if u['id'] == user_id), None)
    
    if not user_data:
        return "User không tồn tại", 404
    
    # Lấy keyword từ query parameter và decode URL encoding
    keyword = request.args.get('keyword', '').strip()
    if keyword:
        from urllib.parse import unquote
        keyword = unquote(keyword)
    
    # Lấy interactions
    interactions = get_user_interactions(user_id)
    
    # Lấy smart recommendations - TẤT CẢ games với keyword
    recommendations = get_smart_recommendations(user_id, keyword=keyword)
    
    return render_template('user_profile.html', 
                         user=user_data, 
                         interactions=interactions,
                         recommendations=recommendations)

@app.route('/api/recommendations/<int:user_id>')
def api_recommendations(user_id):
    """API lấy recommendations"""
    recommender = init_recommender()
    keyword = request.args.get('keyword', '').strip()
    if keyword:
        from urllib.parse import unquote
        keyword = unquote(keyword)
    recommendations = get_smart_recommendations(user_id, keyword=keyword)
    return jsonify(recommendations)

@app.route('/api/interact', methods=['POST'])
def api_interact():
    """API xử lý tương tác người dùng"""
    data = request.json
    user_id = data.get('user_id')
    game_id = data.get('game_id')
    interaction_type = data.get('type')  # 'view', 'like', 'purchase', 'dislike'
    rating = data.get('rating')
    
    # Lưu tương tác
    save_user_interaction(user_id, game_id, interaction_type, rating)
    
    return jsonify({'status': 'success', 'message': 'Tương tác đã được lưu'})

@app.route('/api/feedback', methods=['POST'])
def api_feedback():
    """API xử lý feedback"""
    data = request.json
    user_id = data.get('user_id')
    game_id = data.get('game_id')
    feedback_type = data.get('feedback_type')  # 'helpful', 'not_helpful'
    score = data.get('score')
    comment = data.get('comment')
    
    # Lưu feedback
    conn = sqlite3.connect('user_interactions.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO user_feedback (user_id, game_id, feedback_type, score, comment)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, game_id, feedback_type, score, comment))
    
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success', 'message': 'Feedback đã được lưu'})

@app.route('/api/learning/<int:user_id>')
def api_learning_data(user_id):
    """API lấy dữ liệu học của user"""
    if user_id in learning_data:
        return jsonify(learning_data[user_id])
    else:
        return jsonify({'message': 'Chưa có dữ liệu học cho user này'})

@app.route('/api/keyword-search/<int:user_id>')
def keyword_search(user_id):
    """API endpoint để tìm kiếm games theo keyword"""
    keyword = request.args.get('keyword', '').strip()
    if keyword:
        from urllib.parse import unquote
        keyword = unquote(keyword)
    keyword = keyword.lower()
    
    if not keyword:
        return jsonify({
            'success': False,
            'error': 'Keyword is required'
        })
    
    try:
        # Lấy tất cả games
        all_games = recommender.games_data
        
        # Tìm games có keyword match
        keyword_results = []
        for game in all_games:
            # Tìm kiếm trong các trường text
            text_fields = []
            
            # Name
            if game.get('name'):
                text_fields.append(str(game['name']))
            
            # Genre (handle both list and string)
            genre = game.get('genre', [])
            if isinstance(genre, list):
                text_fields.append(' '.join(genre))
            else:
                text_fields.append(str(genre))
            
            # Description
            if game.get('description'):
                text_fields.append(str(game['description']))
            
            # Publisher
            if game.get('publisher'):
                text_fields.append(str(game['publisher']))
            
            # Platform (handle both list and string)
            platform = game.get('platform', [])
            if isinstance(platform, list):
                text_fields.append(' '.join(platform))
            else:
                text_fields.append(str(platform))
            
            # Mode
            if game.get('mode'):
                text_fields.append(str(game['mode']))
            
            # Multiplayer
            if game.get('multiplayer'):
                text_fields.append(str(game['multiplayer']))
            
            # Language
            if game.get('language'):
                text_fields.append(str(game['language']))
            
            # Kiểm tra keyword match
            text_content = ' '.join(text_fields).lower()
            
            # Tách keyword thành các từ riêng biệt
            keyword_words = keyword.split()
            
            # Tính điểm cho từng từ trong keyword
            total_score = 0
            for word in keyword_words:
                if word in text_content:
                    word_count = text_content.count(word)
                    word_score = min(word_count / len(text_content.split()) * 10, 1.0)
                    total_score += word_score
            
            # Xử lý đặc biệt cho release_year
            try:
                import re
                release_date = game.get('release_date', '2020-01-01')
                try:
                    release_year = int(release_date.split('-')[0]) if release_date else 0
                except:
                    release_year = 0
                
                # Tìm số năm trong keyword (có thể là "2021", "iRacing 2021", "2021 game", etc.)
                year_pattern = r'\b(?:19|20)\d{2}\b'  # Tìm năm 1900-2099 (non-capturing group)
                year_matches = re.findall(year_pattern, keyword.lower())
                
                if year_matches and release_year > 0:
                    # Lấy năm đầu tiên tìm thấy
                    keyword_year = int(year_matches[0])
                    
                    # Nếu keyword chứa năm và khớp với release_year
                    if keyword_year == release_year:
                        total_score += 2.0  # Trọng số cao cho năm chính xác
                    # Nếu keyword chứa năm gần với release_year (trong khoảng 2 năm)
                    elif abs(release_year - keyword_year) <= 2:
                        total_score += 1.0  # Trọng số thấp hơn cho năm gần
            except:
                pass
            
            # Xử lý đặc biệt cho multiplayer
            if 'multiplayer' in keyword.lower():
                game_multiplayer = game.get('multiplayer', False)
                if game_multiplayer:
                    total_score += 1.0  # Trọng số cho multiplayer
            
            # Chia cho số từ để có điểm trung bình
            if keyword_words:
                keyword_score = total_score / len(keyword_words)
            else:
                keyword_score = 0.0
            
            if keyword_score > 0:
                
                # Lấy thông tin game
                game_info = {
                    'game_id': game['id'],
                    'game_name': game['name'],
                    'keyword_score': keyword_score,
                    'hybrid_score': keyword_score,  # Tạm thời dùng keyword_score
                    'svd_score': 0.0,
                    'content_score': 0.0,
                    'demographic_score': 0.0
                }
                
                keyword_results.append(game_info)
        
        # Sắp xếp theo keyword score
        keyword_results.sort(key=lambda x: x['keyword_score'], reverse=True)
        
        return jsonify({
            'success': True,
            'results': keyword_results,
            'keyword': keyword,
            'total_found': len(keyword_results)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    # Khởi tạo database
    init_database()
    
    # Khởi tạo recommender
    init_recommender()
    
    print("🌐 Khởi động Game Recommendation Web App...")
    print("📱 Truy cập: http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
