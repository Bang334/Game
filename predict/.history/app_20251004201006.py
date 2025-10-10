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
    
    if len(interactions) < 3:  # Cần ít nhất 3 tương tác để phân tích
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
    release_years = []
    price_ranges = []
    
    for interaction in interactions:
        # Lấy thông tin game từ recommender
        game_info = next((g for g in recommender.games_data if g['id'] == interaction['game_id']), None)
        if game_info:
            # Phân tích genres
            for genre in game_info.get('genre', []):
                if genre not in game_types:
                    game_types[genre] = 0
                game_types[genre] += 1
            
            # Phân tích release year
            release_year = game_info.get('release_year', 2020)
            release_years.append(release_year)
            
            # Phân tích price
            price = game_info.get('price', 0)
            price_ranges.append(price)
    
    user_data['behavior_patterns']['preferred_genres'] = game_types
    
    # Phân tích release year preferences
    if release_years:
        current_year = datetime.now().year
        recent_years = [year for year in release_years if year >= current_year - 2]
        user_data['behavior_patterns']['prefers_new_games'] = len(recent_years) / len(release_years) > 0.5
        user_data['behavior_patterns']['avg_release_year'] = sum(release_years) / len(release_years)
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

def get_dynamic_weights(user_id, keyword=None):
    """Tính trọng số động dựa trên behavior patterns và keyword"""
    # Kiểm tra có keyword không
    has_keyword = keyword and keyword.strip()
    
    if user_id not in learning_data:
        # Trọng số mặc định
        if has_keyword:
            return {
                'svd': 0.20,
                'content': 0.20,
                'demographic': 0.10,
                'keyword': 0.50
            }
        else:
            return {
                'svd': 0.45,
                'content': 0.35,
                'demographic': 0.20,
                'keyword': 0.0
            }
    
    user_data = learning_data[user_id]
    behavior = user_data.get('behavior_patterns', {})
    
    # Trọng số cơ bản dựa trên keyword
    if has_keyword:
        weights = {
            'svd': 0.20,
            'content': 0.20,
            'demographic': 0.10,
            'keyword': 0.50
        }
    else:
        weights = {
            'svd': 0.45,
            'content': 0.35,
            'demographic': 0.20,
            'keyword': 0.0
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
    if total_interactions > 10:  # User có nhiều tương tác
        if has_keyword:
            weights['svd'] += 0.05
            weights['content'] -= 0.03
            weights['demographic'] -= 0.02
        else:
            weights['svd'] += 0.1
            weights['content'] -= 0.05
            weights['demographic'] -= 0.05
    
    # 3. Nếu user có genre preferences rõ ràng → Tăng content weight
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
    
    # 4. Nếu user active gần đây → Tăng content weight (preferences hiện tại)
    if behavior.get('active_recently', False):
        if has_keyword:
            weights['content'] += 0.03
            weights['svd'] -= 0.02
            weights['demographic'] -= 0.01
        else:
            weights['content'] += 0.05
            weights['svd'] -= 0.03
            weights['demographic'] -= 0.02
    
    # Đảm bảo tổng = 1.0
    total = sum(weights.values())
    for key in weights:
        weights[key] = weights[key] / total
    
    return weights

def check_and_retrain_svd(user_id):
    """Kiểm tra và retrain SVD model nếu cần thiết"""
    if user_id not in learning_data:
        return
    
    user_data = learning_data[user_id]
    interactions = user_data['interaction_history']
    
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
                
        except Exception as e:
            print(f"❌ Error retraining SVD model: {e}")

def get_smart_recommendations(user_id, top_n=None, keyword=None):
    """Lấy recommendations thông minh dựa trên tương tác và keyword"""
    # Sử dụng trực tiếp get_hybrid_recommendations từ game_recommendation_system.py
    # Hàm này đã có sẵn logic xử lý keyword và trọng số động
    basic_recs = recommender.get_hybrid_recommendations(user_id, top_n, keyword)
    
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
                    game_year = game_info.get('release_year', 2020)
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
                release_year = game.get('release_year', 0)
                
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
                    total_score += 2.0  # Trọng số cao cho multiplayer
            
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
