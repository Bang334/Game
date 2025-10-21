"""
AI Recommendation Microservice
Flask API for game recommendations without file intermediaries
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import sqlite3
import math
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Constants
INTERACTION_DB = 'user_interactions.db'

class GameRecommendationEngine:
    """Main recommendation engine"""
    
    def __init__(self):
        self.games_data = None
        self.users_data = None
        self.user_item_matrix = None
        self.svd_model = None
        self.user_mean_ratings = None
        self.content_similarity_matrix = None
        
    def load_data(self, games, users):
        """Load game and user data from request"""
        self.games_data = games
        self.users_data = users
        print(f"📊 Loaded {len(games)} games and {len(users)} users")
        
    def train_svd_model(self):
        """Train SVD model for collaborative filtering"""
        print("\n🤖 Training SVD model...")
        
        # Build user-item matrix
        user_game_ratings = []
        for user in self.users_data:
            user_id = user['id']
            favorites = user.get('favorite_games', [])
            purchased = user.get('purchased_games', {})
            view_history = user.get('view_history', {})
            
            for game in self.games_data:
                game_id = game['id']
                rating = 0.0
                
                if game_id in favorites:
                    rating += 5.0
                if str(game_id) in purchased:
                    rating += float(purchased[str(game_id)])
                
                view_count = view_history.get(str(game_id), 0)
                rating += view_count * 0.5
                
                if rating > 0:
                    user_game_ratings.append({
                        'user_id': user_id,
                        'game_id': game_id,
                        'rating': min(rating, 10.0)
                    })
        
        if not user_game_ratings:
            print("⚠️ No ratings data available")
            return False
            
        df = pd.DataFrame(user_game_ratings)
        self.user_item_matrix = df.pivot(
            index='user_id',
            columns='game_id',
            values='rating'
        ).fillna(0)
        
        # Normalize ratings
        self.user_mean_ratings = self.user_item_matrix.mean(axis=1)
        normalized_matrix = self.user_item_matrix.sub(self.user_mean_ratings, axis=0)
        
        # Train SVD
        n_components = min(20, min(normalized_matrix.shape) - 1)
        self.svd_model = TruncatedSVD(n_components=n_components, random_state=42)
        self.svd_model.fit(normalized_matrix)
        
        print(f"✅ SVD model trained with {n_components} components")
        return True
    
    def build_content_similarity(self):
        """Build content-based similarity matrix"""
        print("\n🔍 Building content similarity matrix...")
        
        game_features = []
        for game in self.games_data:
            features = []
            
            # Text features
            if game.get('name'):
                features.append(game['name'])
            if game.get('description'):
                features.append(game['description'][:100])
            if game.get('publisher'):
                features.append(game['publisher'])
            
            # Genres (repeat 3 times for higher weight)
            genres = game.get('genre', [])
            features.extend(genres * 3)
            
            # Platforms
            platforms = game.get('platform', [])
            features.extend(platforms)
            
            # Other attributes
            if game.get('mode'):
                features.append(game['mode'])
            if game.get('age_rating'):
                features.append(game['age_rating'])
            
            game_features.append(' '.join(features))
        
        # TF-IDF vectorization
        vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(game_features)
        
        # Calculate cosine similarity
        self.content_similarity_matrix = cosine_similarity(tfidf_matrix)
        
        print(f"✅ Content similarity matrix built ({len(self.games_data)}x{len(self.games_data)})")
        return True
    
    def get_svd_recommendations(self, user_id, top_n=10):
        """Get SVD collaborative filtering recommendations"""
        if self.svd_model is None:
            return []
        
        if user_id not in self.user_item_matrix.index:
            return []
        
        user_vector = self.user_item_matrix.loc[user_id]
        user_mean = self.user_mean_ratings.loc[user_id]
        
        # Predict ratings
        normalized_vector = user_vector - user_mean
        predicted_normalized = self.svd_model.inverse_transform(
            self.svd_model.transform([normalized_vector])
        )[0]
        predicted_ratings = predicted_normalized + user_mean
        
        # Get game recommendations
        recommendations = []
        for idx, game_id in enumerate(self.user_item_matrix.columns):
            if user_vector[game_id] == 0:  # Not interacted yet
                game = next((g for g in self.games_data if g['id'] == game_id), None)
                if game:
                    recommendations.append({
                        'game_id': game_id,
                        'game_name': game['name'],
                        'predicted_rating': float(predicted_ratings[idx]),
                        'genre': game.get('genre', []),
                        'price': game.get('price', 0),
                        'downloads': game.get('downloads', 0)
                    })
        
        recommendations.sort(key=lambda x: x['predicted_rating'], reverse=True)
        return recommendations[:top_n]
    
    def get_content_recommendations(self, user_id, top_n=10):
        """Get content-based recommendations"""
        if self.content_similarity_matrix is None:
            return []
        
        user = next((u for u in self.users_data if u['id'] == user_id), None)
        if not user:
            return []
        
        favorites = user.get('favorite_games', [])
        purchased = list(user.get('purchased_games', {}).keys())
        interacted_games = list(set(favorites + [int(p) for p in purchased]))
        
        if not interacted_games:
            return []
        
        # Calculate average similarity
        game_scores = {}
        for game in self.games_data:
            game_id = game['id']
            if game_id in interacted_games:
                continue
            
            game_idx = next((i for i, g in enumerate(self.games_data) if g['id'] == game_id), None)
            if game_idx is None:
                continue
            
            similarities = []
            for interacted_id in interacted_games:
                interacted_idx = next((i for i, g in enumerate(self.games_data) if g['id'] == interacted_id), None)
                if interacted_idx is not None:
                    similarities.append(self.content_similarity_matrix[game_idx][interacted_idx])
            
            if similarities:
                game_scores[game_id] = sum(similarities) / len(similarities)
        
        # Sort and return top N
        sorted_games = sorted(game_scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
        
        recommendations = []
        for game_id, score in sorted_games:
            game = next((g for g in self.games_data if g['id'] == game_id), None)
            if game:
                recommendations.append({
                    'game_id': game_id,
                    'game_name': game['name'],
                    'similarity_score': float(score),
                    'genre': game.get('genre', []),
                    'price': game.get('price', 0),
                    'downloads': game.get('downloads', 0)
                })
        
        return recommendations
    
    def get_demographic_recommendations(self, user_id, top_n=10):
        """Get demographic-based recommendations"""
        target_user = next((u for u in self.users_data if u['id'] == user_id), None)
        if not target_user:
            return []
        
        target_age = target_user.get('age')
        target_gender = target_user.get('gender')
        
        if not target_age or not target_gender:
            return []
        
        # Find similar users
        similar_users = []
        for user in self.users_data:
            if user['id'] == user_id:
                continue
            
            user_age = user.get('age')
            user_gender = user.get('gender')
            
            if not user_age or not user_gender:
                continue
            
            age_similarity = 1.0 - min(abs(target_age - user_age) / 50.0, 1.0)
            gender_similarity = 1.0 if target_gender == user_gender else 0.3
            
            demo_similarity = age_similarity * 0.6 + gender_similarity * 0.4
            
            if demo_similarity > 0.5:
                similar_users.append((user, demo_similarity))
        
        similar_users.sort(key=lambda x: x[1], reverse=True)
        similar_users = similar_users[:10]
        
        if not similar_users:
            return []
        
        # Get games from similar users
        target_interacted = set(target_user.get('favorite_games', []) + 
                               list(target_user.get('purchased_games', {}).keys()))
        
        game_scores = {}
        for game in self.games_data:
            game_id = game['id']
            if game_id in target_interacted:
                continue
            
            weighted_score = 0.0
            total_weight = 0.0
            
            for other_user, demo_sim in similar_users:
                other_favorites = other_user.get('favorite_games', [])
                other_purchased = other_user.get('purchased_games', {})
                
                rating = 0.0
                if game_id in other_favorites:
                    rating = 5.0
                elif str(game_id) in other_purchased:
                    rating = float(other_purchased[str(game_id)])
                
                if rating > 0:
                    weighted_score += rating * demo_sim
                    total_weight += demo_sim
            
            if total_weight > 0:
                game_scores[game_id] = weighted_score / total_weight
        
        sorted_games = sorted(game_scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
        
        recommendations = []
        for game_id, score in sorted_games:
            game = next((g for g in self.games_data if g['id'] == game_id), None)
            if game:
                recommendations.append({
                    'game_id': game_id,
                    'game_name': game['name'],
                    'demo_score': float(score),
                    'genre': game.get('genre', []),
                    'price': game.get('price', 0),
                    'downloads': game.get('downloads', 0)
                })
        
        return recommendations
    
    def get_hybrid_recommendations(self, user_id, top_n=10, keyword='', enable_adaptive=True, recent_days=7):
        """Get hybrid recommendations combining all methods"""
        print(f"\n🎯 Generating hybrid recommendations for user {user_id}")
        
        # Get recommendations from all methods
        svd_recs = self.get_svd_recommendations(user_id, top_n)
        content_recs = self.get_content_recommendations(user_id, top_n)
        demo_recs = self.get_demographic_recommendations(user_id, top_n)
        
        # Combine scores
        all_games = {}
        
        # SVD scores (weight: 0.45)
        for rec in svd_recs:
            game_id = rec['game_id']
            all_games[game_id] = {
                'game_id': game_id,
                'game_name': rec['game_name'],
                'svd_score': rec['predicted_rating'] * 0.45,
                'content_score': 0,
                'demo_score': 0,
                'genre': rec['genre'],
                'price': rec['price'],
                'downloads': rec['downloads']
            }
        
        # Content scores (weight: 0.35)
        for rec in content_recs:
            game_id = rec['game_id']
            if game_id in all_games:
                all_games[game_id]['content_score'] = rec['similarity_score'] * 0.35
            else:
                all_games[game_id] = {
                    'game_id': game_id,
                    'game_name': rec['game_name'],
                    'svd_score': 0,
                    'content_score': rec['similarity_score'] * 0.35,
                    'demo_score': 0,
                    'genre': rec['genre'],
                    'price': rec['price'],
                    'downloads': rec['downloads']
                }
        
        # Demographic scores (weight: 0.20)
        for rec in demo_recs:
            game_id = rec['game_id']
            if game_id in all_games:
                all_games[game_id]['demo_score'] = rec['demo_score'] * 0.20
            else:
                all_games[game_id] = {
                    'game_id': game_id,
                    'game_name': rec['game_name'],
                    'svd_score': 0,
                    'content_score': 0,
                    'demo_score': rec['demo_score'] * 0.20,
                    'genre': rec['genre'],
                    'price': rec['price'],
                    'downloads': rec['downloads']
                }
        
        # Calculate final scores
        for game_data in all_games.values():
            game_data['base_score'] = (
                game_data['svd_score'] +
                game_data['content_score'] +
                game_data['demo_score']
            )
        
        # Sort by base score
        sorted_games = sorted(all_games.values(), key=lambda x: x['base_score'], reverse=True)
        
        # Get full game details
        final_recommendations = []
        for game_data in sorted_games[:top_n]:
            game = next((g for g in self.games_data if g['id'] == game_data['game_id']), None)
            if game:
                final_recommendations.append({
                    'id': game['id'],
                    'name': game['name'],
                    'description': game.get('description', ''),
                    'price': game.get('price', 0),
                    'rating': game.get('rating', 0),
                    'image': game.get('image', ''),
                    'genre': game.get('genre', []),
                    'platform': game.get('platform', []),
                    'publisher': game.get('publisher', ''),
                    'score': float(game_data['base_score']),
                    'downloads': game.get('downloads', 0)
                })
        
        print(f"✅ Generated {len(final_recommendations)} recommendations")
        return final_recommendations


# Global engine instance
engine = GameRecommendationEngine()


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Recommendation Service',
        'version': '2.0'
    })


@app.route('/api/recommend', methods=['POST'])
def get_recommendations():
    """
    Main recommendation endpoint
    POST /api/recommend
    Body: {
        "user_id": 1,
        "games": [...],
        "users": [...],
        "query": "",
        "days": 7,
        "top_n": 10
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'NO_DATA',
                'message': 'Request body is required'
            }), 400
        
        user_id = data.get('user_id')
        games = data.get('games', [])
        users = data.get('users', [])
        query = data.get('query', '')
        days = data.get('days', 7)
        top_n = data.get('top_n', 10)
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'USER_ID_REQUIRED',
                'message': 'user_id is required'
            }), 400
        
        if not games or not users:
            return jsonify({
                'success': False,
                'error': 'INVALID_DATA',
                'message': 'games and users data are required'
            }), 400
        
        print(f"\n{'='*50}")
        print(f"📨 Recommendation request received")
        print(f"   User ID: {user_id}")
        print(f"   Games: {len(games)}")
        print(f"   Users: {len(users)}")
        print(f"   Query: {query or '(none)'}")
        print(f"   Days: {days}")
        print(f"   Top N: {top_n}")
        print(f"{'='*50}\n")
        
        # Load data
        engine.load_data(games, users)
        
        # Train models
        engine.train_svd_model()
        engine.build_content_similarity()
        
        # Get recommendations
        recommendations = engine.get_hybrid_recommendations(
            user_id=user_id,
            top_n=top_n,
            keyword=query,
            enable_adaptive=True,
            recent_days=days
        )
        
        return jsonify({
            'success': True,
            'games': recommendations,
            'total': len(recommendations),
            'message': 'Recommendations generated successfully'
        })
        
    except Exception as e:
        print(f"❌ Error in get_recommendations: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': 'RECOMMENDATION_ERROR',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 Starting AI Recommendation Service")
    print("="*50)
    print("📡 Endpoints:")
    print("   GET  /health - Health check")
    print("   POST /api/recommend - Get recommendations")
    print("="*50)
    print("🌐 Service running on http://localhost:5000")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=False)

