"""
Unified AI Service
Combines Recommendation System + Similar Games into one microservice
- GameRecommendationSystem: Personalized recommendations (needs user data)
- ContentSimilarityEngine: Similar games (pure content-based, no user data)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json

# Import recommendation system (needs user data)
from game_recommendation_system import GameRecommendationSystem

# Import content similarity engine (no user data needed)
from content_similarity_engine import ContentSimilarityEngine

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global recommendation system instance
recommender = None


def initialize_recommender(games, users):
    """Initialize or update the recommender with new data"""
    global recommender
    
    # Create new instance
    recommender = GameRecommendationSystem()
    
    # Set data directly (skip file loading)
    recommender.games_data = games
    recommender.users_data = users
    
    # Load keyword library
    try:
        with open('library.json', 'r', encoding='utf-8') as f:
            library_data = json.load(f)
            recommender.keyword_library = library_data.get('keywords', {})
    except:
        recommender.keyword_library = {}
    
    # Preprocess and train models
    recommender.preprocess_data()
    recommender.train_svd_model(k=2)
    recommender.build_content_similarity()
    
    return recommender


# ==========================
# API ENDPOINTS
# ==========================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Unified AI Service',
        'version': '4.0',
        'engines': {
            'recommendations': 'GameRecommendationSystem (user-based)',
            'similar_games': 'ContentSimilarityEngine (content-based)'
        },
        'features': [
            'personalized_recommendations',
            'keyword_search',
            'similar_games',
            'adaptive_boosting'
        ]
    })


@app.route('/api/recommend', methods=['POST'])
def get_recommendations():
    """
    Get personalized game recommendations with keyword support
    POST /api/recommend
    Body: {
        "user_id": 1,
        "games": [...],
        "users": [...],
        "query": "action game",  # Optional keyword
        "days": 7,               # Optional: recent days filter
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
        query = data.get('query', '').strip()  # Keyword search
        recent_days = data.get('days', None)
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
        print(f"📨 Recommendation request")
        print(f"   User ID: {user_id}")
        print(f"   Games: {len(games)}")
        print(f"   Users: {len(users)}")
        print(f"   Keyword: '{query}'" if query else "   Keyword: (none)")
        print(f"   Recent days: {recent_days}" if recent_days else "   Recent days: (all time)")
        print(f"   Top N: {top_n}")
        print(f"{'='*50}\n")
        
        # Initialize recommender with data
        rec = initialize_recommender(games, users)
        
        # Get hybrid recommendations with keyword support
        recommendations = rec.get_hybrid_recommendations(
            user_id=user_id,
            top_n=top_n,
            keyword=query,
            enable_adaptive=True,
            recent_days=recent_days
        )
        
        # Transform to API format
        api_recommendations = []
        for rec_item in recommendations:
            game = next((g for g in games if g['id'] == rec_item['game_id']), None)
            if game:
                api_recommendations.append({
                    'id': game['id'],
                    'name': game['name'],
                    'description': game.get('description', ''),
                    'price': game.get('price', 0),
                    'rating': game.get('rating', 0),
                    'image': game.get('image', ''),
                    'genre': game.get('genre', []),
                    'platform': game.get('platform', []),
                    'publisher': game.get('publisher', ''),
                    'score': float(rec_item.get('hybrid_score', 0)),
                    'downloads': game.get('downloads', 0)
                })
        
        print(f"✅ Generated {len(api_recommendations)} recommendations")
        if query:
            matching_count = sum(1 for r in recommendations if r.get('keyword_score', 0) > 0)
            print(f"   {matching_count} games match keyword '{query}'")
        
        return jsonify({
            'success': True,
            'games': api_recommendations,
            'total': len(api_recommendations),
            'message': 'Recommendations generated successfully',
            'keyword': query if query else None
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


@app.route('/api/similar-games', methods=['POST'])
def get_similar_games():
    """
    Get similar games using content-based filtering from GameRecommendationSystem
    POST /api/similar-games
    Body: {
        "game_id": 1,
        "games": [...],
        "top_n": 8,
        "exclude_purchased": [1, 2, 3]
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
        
        game_id = data.get('game_id')
        games = data.get('games', [])
        top_n = data.get('top_n', 8)
        exclude_purchased = set(data.get('exclude_purchased', []))
        
        if not game_id:
            return jsonify({
                'success': False,
                'error': 'GAME_ID_REQUIRED',
                'message': 'game_id is required'
            }), 400
        
        if not games:
            return jsonify({
                'success': False,
                'error': 'INVALID_DATA',
                'message': 'games data is required'
            }), 400
        
        print(f"\n{'='*50}")
        print(f"🎮 Similar games request")
        print(f"   Game ID: {game_id}")
        print(f"   Total games: {len(games)}")
        print(f"   Top N: {top_n}")
        print(f"   Exclude purchased: {len(exclude_purchased)} games")
        print(f"{'='*50}\n")
        
        # Find current game
        current_game = next((g for g in games if g['id'] == game_id), None)
        if not current_game:
            return jsonify({
                'success': False,
                'error': 'GAME_NOT_FOUND',
                'message': f'Game {game_id} not found'
            }), 404
        
        # Use ContentSimilarityEngine (no user data needed!)
        # This is pure content-based similarity
        engine = ContentSimilarityEngine()
        engine.load_games(games)
        
        # Get similar games with exclusions
        similar_games_list = engine.get_similar_games(
            game_id=game_id,
            top_n=top_n,
            exclude_ids=list(exclude_purchased)
        )
        
        # Format response (already formatted by engine)
        similar_games = []
        for item in similar_games_list:
            game = item['game']
            similar_games.append({
                'id': game['id'],
                'name': game['name'],
                'description': game.get('description', ''),
                'image': game.get('image', ''),
                'price': game.get('price', 0),
                'rating': game.get('rating', 0),
                'downloads': game.get('downloads', 0),
                'publisher': game.get('publisher', ''),
                'genre': game.get('genre', []),
                'platform': game.get('platform', []),
                'release_date': game.get('release_date', ''),
                'age_rating': game.get('age_rating', ''),
                'similarity_score': item['similarity_score'],
                'multiplayer': game.get('multiplayer', False)
            })
        
        print(f"✅ Found {len(similar_games)} similar games for '{current_game['name']}'")
        for i, sg in enumerate(similar_games[:3], 1):
            print(f"   {i}. {sg['name']} (similarity: {sg['similarity_score']:.3f})")
        
        return jsonify({
            'success': True,
            'game_id': game_id,
            'game_name': current_game['name'],
            'similar_games': similar_games,
            'total': len(similar_games),
            'message': 'Similar games found successfully'
        })
        
    except Exception as e:
        print(f"❌ Error in get_similar_games: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': 'SIMILAR_GAMES_ERROR',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Starting Unified AI Service v4.0")
    print("="*60)
    print("📡 Endpoints:")
    print("   GET  /health - Health check")
    print("   POST /api/recommend - Personalized recommendations")
    print("   POST /api/similar-games - Content-based similar games")
    print("="*60)
    print("🧠 AI Engines:")
    print("   • GameRecommendationSystem (with user data)")
    print("     → SVD + Content + Demographic + Keyword Search")
    print("   • ContentSimilarityEngine (no user data)")
    print("     → Pure content-based similarity")
    print("="*60)
    print("🌐 Service running on http://localhost:5000")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
