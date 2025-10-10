from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json
from game_recommendation_system import GameRecommendationSystem

app = Flask(__name__)
CORS(app)

# Khởi tạo recommendation system
recommender = GameRecommendationSystem()
recommender.load_data()
recommender.preprocess_data()
recommender.train_svd_model(k=2)
recommender.build_content_similarity()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/users')
def get_users():
    """API để lấy danh sách users"""
    return jsonify(recommender.users_data)

@app.route('/api/games')
def get_games():
    """API để lấy danh sách games"""
    return jsonify(recommender.games_data)

@app.route('/api/cpu_options')
def get_cpu_options():
    """API để lấy danh sách CPU options"""
    cpu_options = []
    for category in recommender.cpu_data.values():
        if isinstance(category, dict):
            cpu_options.extend(list(category.keys()))
    return jsonify(sorted(cpu_options))

@app.route('/api/gpu_options')
def get_gpu_options():
    """API để lấy danh sách GPU options"""
    gpu_options = []
    for category in recommender.gpu_data.values():
        if isinstance(category, dict):
            gpu_options.extend(list(category.keys()))
    return jsonify(sorted(gpu_options))

@app.route('/api/recommend', methods=['POST'])
def get_recommendations():
    """API để lấy recommendations"""
    data = request.json
    user_id = data.get('user_id')
    cpu = data.get('cpu')
    gpu = data.get('gpu')
    ram = data.get('ram')
    top_n = data.get('top_n', 5)
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    try:
        # Lấy hybrid recommendations
        recommendations = recommender.get_hybrid_recommendations(
            user_id=int(user_id),
            user_cpu=cpu if cpu else None,
            user_gpu=gpu if gpu else None,
            user_ram=ram if ram else None,
            top_n=int(top_n)
        )
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'user_info': next((u for u in recommender.users_data if u['id'] == int(user_id)), None)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/game_details/<int:game_id>')
def get_game_details(game_id):
    """API để lấy chi tiết game"""
    game = next((g for g in recommender.games_data if g['id'] == game_id), None)
    if game:
        return jsonify(game)
    else:
        return jsonify({'error': 'Game not found'}), 404

if __name__ == '__main__':
    print("🚀 Starting Game Recommendation Web Interface...")
    print("📱 Access at: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
