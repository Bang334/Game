from flask import Flask, request, jsonify
from flask_cors import CORS
from content_similarity_benchmark import get_similar_games_with_benchmarks
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load data once at startup
def load_data():
    with open('../game.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['games'], data['users']

games, users = load_data()

@app.route('/api/similar-games/<int:game_id>', methods=['GET'])
def get_similar_games(game_id):
    try:
        # Tìm game hiện tại
        current_game = None
        for game in games:
            if game['id'] == game_id:
                current_game = game
                break
        
        if not current_game:
            return jsonify({'error': 'Game not found'}), 404
        
        # Lấy user_id từ query params (mặc định là user đầu tiên)
        user_id = request.args.get('user_id', users[0]['id'], type=int)
        
        # Tìm user
        current_user = None
        for user in users:
            if user['id'] == user_id:
                current_user = user
                break
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Dự đoán 8 games tương tự
        similar_games = get_similar_games_with_benchmarks(
            current_game, user_id, games, users
        )
        
        # Chỉ lấy top 8
        top_8_games = similar_games[:8]
        
        # Log dữ liệu trả về
        print(f"🎮 Game: {current_game['name']} (ID: {game_id})")
        print(f"👤 User ID: {user_id}")
        print(f"📊 Found {len(top_8_games)} similar games:")
        for i, game in enumerate(top_8_games, 1):
            print(f"  {i}. {game['name']}")
            print(f"      Similarity: {game.get('similarity_score', 0):.3f} | Compatibility: {game.get('compatibility_score', 0):.3f}")
            # Extract year from release_date
            release_date = game.get('release_date', '')
            year = 'N/A'
            if release_date:
                try:
                    year = release_date.split('-')[0] if '-' in release_date else release_date[:4]
                except:
                    year = 'N/A'
            
            print(f"      Price: {game.get('price', 'N/A')} | Rating: {game.get('rating', 'N/A')} | Year: {year} | Age: {game.get('age_rating', 'N/A')}")
        print("=" * 50)
        
        return jsonify({
            'game_name': current_game['name'],
            'similar_games': top_8_games
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Similar Games API...")
    print("📡 Endpoint: http://localhost:5001/api/similar-games/<game_id>")
    print("💡 Example: http://localhost:5001/api/similar-games/1?user_id=1")
    app.run(debug=True, port=5001)
