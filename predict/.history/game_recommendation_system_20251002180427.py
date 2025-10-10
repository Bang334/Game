import json
import numpy as np
import pandas as pd
from scipy.sparse.linalg import svds
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

class GameRecommendationSystem:
    def __init__(self):
        self.games_data = None
        self.users_data = None
        self.cpu_data = None
        self.gpu_data = None
        self.user_item_matrix = None
        self.svd_model = None
        self.content_similarity_matrix = None
        self.games_df = None
        self.users_df = None
        
    def load_data(self):
        """Load dữ liệu từ các file JSON"""
        try:
            # Load game data
            with open('game.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.games_data = data['games']
                self.users_data = data['users']
            
            # Load CPU data
            with open('cpu.json', 'r', encoding='utf-8') as f:
                self.cpu_data = json.load(f)
            
            # Load GPU data
            with open('gpu.json', 'r', encoding='utf-8') as f:
                self.gpu_data = json.load(f)
                
            print("✅ Đã load dữ liệu thành công!")
            return True
        except Exception as e:
            print(f"❌ Lỗi khi load dữ liệu: {e}")
            return False
    
    def preprocess_data(self):
        """Tiền xử lý dữ liệu"""
        # Convert to DataFrame
        self.games_df = pd.DataFrame(self.games_data)
        self.users_df = pd.DataFrame(self.users_data)
        
        # Tạo rating matrix từ favorite_games (implicit feedback)
        # Giả sử: favorite = 5, purchased but not favorite = 3, not purchased = 0
        user_game_ratings = []
        
        for user in self.users_data:
            user_id = user['id']
            favorites = user.get('favorite_games', [])
            purchased = user.get('purchased_games', [])
            
            for game in self.games_data:
                game_id = game['id']
                if game_id in favorites:
                    rating = 5.0
                elif game_id in purchased:
                    rating = 3.0
                else:
                    rating = 0.0
                
                user_game_ratings.append({
                    'user_id': user_id,
                    'game_id': game_id,
                    'rating': rating
                })
        
        # Tạo user-item matrix
        ratings_df = pd.DataFrame(user_game_ratings)
        self.user_item_matrix = ratings_df.pivot(index='user_id', columns='game_id', values='rating').fillna(0)
        
        print("✅ Đã tiền xử lý dữ liệu thành công!")
        print(f"📊 User-Item Matrix shape: {self.user_item_matrix.shape}")
    
    def train_svd_model(self, k=2):
        """Huấn luyện mô hình SVD"""
        try:
            # Chuẩn hóa dữ liệu (trừ mean của mỗi user)
            user_ratings_mean = np.mean(self.user_item_matrix.values, axis=1)
            ratings_demeaned = self.user_item_matrix.values - user_ratings_mean.reshape(-1, 1)
            
            # Áp dụng SVD
            U, sigma, Vt = svds(ratings_demeaned, k=k)
            sigma = np.diag(sigma)
            
            # Tái tạo ma trận rating
            predicted_ratings = np.dot(np.dot(U, sigma), Vt) + user_ratings_mean.reshape(-1, 1)
            
            # Lưu kết quả
            self.svd_model = {
                'U': U,
                'sigma': sigma,
                'Vt': Vt,
                'user_ratings_mean': user_ratings_mean,
                'predicted_ratings': predicted_ratings
            }
            
            print(f"✅ Đã huấn luyện SVD model với k={k} thành công!")
            return True
        except Exception as e:
            print(f"❌ Lỗi khi huấn luyện SVD: {e}")
            return False
    
    def build_content_similarity(self):
        """Xây dựng ma trận tương đồng content-based"""
        try:
            # Tạo features cho content-based filtering
            features = []
            for game in self.games_data:
                # Kết hợp genre, publisher, age_rating, platform
                genre_str = ' '.join(game.get('genre', []))
                publisher = game.get('publisher', '')
                age_rating = game.get('age_rating', '')
                platform_str = ' '.join(game.get('platform', []))
                mode = game.get('mode', '')
                
                feature_text = f"{genre_str} {publisher} {age_rating} {platform_str} {mode}"
                features.append(feature_text)
            
            # Tính TF-IDF
            tfidf = TfidfVectorizer(stop_words='english', lowercase=True)
            tfidf_matrix = tfidf.fit_transform(features)
            
            # Tính cosine similarity
            self.content_similarity_matrix = cosine_similarity(tfidf_matrix)
            
            print("✅ Đã xây dựng content similarity matrix thành công!")
            return True
        except Exception as e:
            print(f"❌ Lỗi khi xây dựng content similarity: {e}")
            return False
    
    def get_cpu_score(self, cpu_name):
        """Lấy điểm benchmark CPU"""
        # Tìm trong tất cả các category
        for category in self.cpu_data.values():
            if isinstance(category, dict):
                if cpu_name in category:
                    return category[cpu_name]
        return 0
    
    def get_gpu_score(self, gpu_name):
        """Lấy điểm benchmark GPU"""
        # Tìm trong tất cả các category
        for category in self.gpu_data.values():
            if isinstance(category, dict):
                if gpu_name in category:
                    return category[gpu_name]
        return 0
    
    def can_run_game(self, user_cpu, user_gpu, user_ram, game_id):
        """Kiểm tra xem user có thể chạy game không"""
        game = next((g for g in self.games_data if g['id'] == game_id), None)
        if not game:
            return False, "Game không tồn tại"
        
        min_spec = game.get('min_spec', {})
        
        # Kiểm tra CPU
        user_cpu_score = self.get_cpu_score(user_cpu)
        min_cpu_score = self.get_cpu_score(min_spec.get('cpu', ''))
        
        # Kiểm tra GPU
        user_gpu_score = self.get_gpu_score(user_gpu)
        min_gpu_score = self.get_gpu_score(min_spec.get('gpu', ''))
        
        # Kiểm tra RAM (convert string to int)
        try:
            user_ram_gb = int(user_ram.replace('GB', ''))
            min_ram_gb = int(min_spec.get('ram', '0GB').replace('GB', ''))
        except:
            user_ram_gb = 0
            min_ram_gb = 0
        
        # Đánh giá khả năng chạy
        cpu_ok = user_cpu_score >= min_cpu_score
        gpu_ok = user_gpu_score >= min_gpu_score
        ram_ok = user_ram_gb >= min_ram_gb
        
        can_run = cpu_ok and gpu_ok and ram_ok
        
        performance_level = "Không thể chạy"
        if can_run:
            # Kiểm tra recommended spec
            rec_spec = game.get('rec_spec', {})
            rec_cpu_score = self.get_cpu_score(rec_spec.get('cpu', ''))
            rec_gpu_score = self.get_gpu_score(rec_spec.get('gpu', ''))
            rec_ram_gb = int(rec_spec.get('ram', '0GB').replace('GB', ''))
            
            if (user_cpu_score >= rec_cpu_score and 
                user_gpu_score >= rec_gpu_score and 
                user_ram_gb >= rec_ram_gb):
                performance_level = "Chạy mượt (Recommended)"
            else:
                performance_level = "Chạy được (Minimum)"
        
        return can_run, performance_level
    
    def get_svd_recommendations(self, user_id, top_n=5):
        """Gợi ý dựa trên SVD"""
        if self.svd_model is None:
            return []
        
        try:
            user_idx = user_id - 1  # Convert to 0-based index
            if user_idx >= len(self.svd_model['predicted_ratings']):
                return []
            
            # Lấy predicted ratings cho user
            user_predictions = self.svd_model['predicted_ratings'][user_idx]
            
            # Lấy games đã tương tác (để loại bỏ)
            user_data = next((u for u in self.users_data if u['id'] == user_id), None)
            if user_data:
                interacted_games = set(user_data.get('favorite_games', []) + 
                                     user_data.get('purchased_games', []))
            else:
                interacted_games = set()
            
            # Tạo danh sách recommendations
            recommendations = []
            for game_idx, predicted_rating in enumerate(user_predictions):
                game_id = game_idx + 1  # Convert back to 1-based
                if game_id not in interacted_games:
                    game = next((g for g in self.games_data if g['id'] == game_id), None)
                    if game:
                        recommendations.append({
                            'game_id': game_id,
                            'game_name': game['name'],
                            'predicted_rating': predicted_rating,
                            'actual_rating': game.get('rating', 0),
                            'genre': game.get('genre', []),
                            'price': game.get('price', 0)
                        })
            
            # Sắp xếp theo predicted rating
            recommendations.sort(key=lambda x: x['predicted_rating'], reverse=True)
            return recommendations[:top_n]
            
        except Exception as e:
            print(f"❌ Lỗi SVD recommendations: {e}")
            return []
    
    def get_content_recommendations(self, user_id, top_n=5):
        """Gợi ý dựa trên content similarity"""
        if self.content_similarity_matrix is None:
            return []
        
        try:
            # Lấy thông tin user
            user_data = next((u for u in self.users_data if u['id'] == user_id), None)
            if not user_data:
                return []
            
            favorite_games = user_data.get('favorite_games', [])
            if not favorite_games:
                return []
            
            # Tính điểm similarity trung bình cho mỗi game
            game_scores = {}
            
            for game_id in range(1, len(self.games_data) + 1):
                if game_id in favorite_games:
                    continue
                
                similarity_scores = []
                for fav_game_id in favorite_games:
                    if fav_game_id <= len(self.games_data):
                        sim_score = self.content_similarity_matrix[fav_game_id - 1][game_id - 1]
                        similarity_scores.append(sim_score)
                
                if similarity_scores:
                    game_scores[game_id] = np.mean(similarity_scores)
            
            # Sắp xếp và lấy top recommendations
            sorted_games = sorted(game_scores.items(), key=lambda x: x[1], reverse=True)
            
            recommendations = []
            for game_id, score in sorted_games[:top_n]:
                game = next((g for g in self.games_data if g['id'] == game_id), None)
                if game:
                    recommendations.append({
                        'game_id': game_id,
                        'game_name': game['name'],
                        'similarity_score': score,
                        'actual_rating': game.get('rating', 0),
                        'genre': game.get('genre', []),
                        'price': game.get('price', 0)
                    })
            
            return recommendations
            
        except Exception as e:
            print(f"❌ Lỗi Content recommendations: {e}")
            return []
    
    def get_hybrid_recommendations(self, user_id, user_cpu=None, user_gpu=None, user_ram=None, top_n=10):
        """Gợi ý kết hợp SVD + Content-based + Hardware compatibility"""
        print(f"\n🎮 Tạo gợi ý cho User ID: {user_id}")
        
        # Lấy recommendations từ cả hai phương pháp
        svd_recs = self.get_svd_recommendations(user_id, top_n)
        content_recs = self.get_content_recommendations(user_id, top_n)
        
        # Kết hợp và tính điểm hybrid
        all_games = {}
        
        # Thêm SVD recommendations
        for rec in svd_recs:
            game_id = rec['game_id']
            all_games[game_id] = {
                'game_id': game_id,
                'game_name': rec['game_name'],
                'svd_score': rec['predicted_rating'],
                'content_score': 0,
                'actual_rating': rec['actual_rating'],
                'genre': rec['genre'],
                'price': rec['price']
            }
        
        # Thêm Content recommendations
        for rec in content_recs:
            game_id = rec['game_id']
            if game_id in all_games:
                all_games[game_id]['content_score'] = rec['similarity_score']
            else:
                all_games[game_id] = {
                    'game_id': game_id,
                    'game_name': rec['game_name'],
                    'svd_score': 0,
                    'content_score': rec['similarity_score'],
                    'actual_rating': rec['actual_rating'],
                    'genre': rec['genre'],
                    'price': rec['price']
                }
        
        # Tính hybrid score (weighted combination)
        for game_id in all_games:
            svd_weight = 0.6
            content_weight = 0.4
            
            svd_score = all_games[game_id]['svd_score']
            content_score = all_games[game_id]['content_score']
            
            # Normalize scores to 0-1 range
            svd_normalized = (svd_score + 5) / 10 if svd_score != 0 else 0  # SVD scores can be negative
            content_normalized = content_score  # Already 0-1
            
            hybrid_score = (svd_weight * svd_normalized + content_weight * content_normalized)
            all_games[game_id]['hybrid_score'] = hybrid_score
        
        # Sắp xếp theo hybrid score
        sorted_recommendations = sorted(all_games.values(), 
                                      key=lambda x: x['hybrid_score'], 
                                      reverse=True)
        
        # Thêm thông tin hardware compatibility nếu có
        final_recommendations = []
        for rec in sorted_recommendations[:top_n]:
            rec_copy = rec.copy()
            
            if user_cpu and user_gpu and user_ram:
                can_run, performance = self.can_run_game(user_cpu, user_gpu, user_ram, rec['game_id'])
                rec_copy['can_run'] = can_run
                rec_copy['performance_level'] = performance
            
            final_recommendations.append(rec_copy)
        
        return final_recommendations
    
    def display_recommendations(self, recommendations, title="🎮 Game Recommendations"):
        """Hiển thị recommendations một cách đẹp mắt"""
        print(f"\n{title}")
        print("=" * 80)
        
        if not recommendations:
            print("❌ Không có gợi ý nào được tìm thấy.")
            return
        
        for i, rec in enumerate(recommendations, 1):
            print(f"\n{i}. 🎯 {rec['game_name']}")
            print(f"   ⭐ Rating: {rec['actual_rating']}/5.0")
            print(f"   🏷️ Genre: {', '.join(rec['genre'])}")
            print(f"   💰 Price: {rec['price']:,} VND")
            
            if 'hybrid_score' in rec:
                print(f"   📊 Hybrid Score: {rec['hybrid_score']:.3f}")
            if 'svd_score' in rec and rec['svd_score'] != 0:
                print(f"   🤖 SVD Score: {rec['svd_score']:.3f}")
            if 'content_score' in rec and rec['content_score'] != 0:
                print(f"   📝 Content Score: {rec['content_score']:.3f}")
            
            if 'can_run' in rec:
                status = "✅" if rec['can_run'] else "❌"
                print(f"   🖥️ Hardware: {status} {rec['performance_level']}")
            
            print("-" * 50)

def main():
    """Hàm main để test hệ thống"""
    print("Khoi tao Game Recommendation System...")
    
    # Tạo instance
    recommender = GameRecommendationSystem()
    
    # Load và preprocess data
    if not recommender.load_data():
        return
    
    recommender.preprocess_data()
    
    # Train models
    print("\nHuan luyen SVD model...")
    recommender.train_svd_model(k=2)
    
    print("\nXay dung Content-based model...")
    recommender.build_content_similarity()
    
    # Test recommendations
    print("\n" + "="*80)
    print("TESTING RECOMMENDATION SYSTEM")
    print("="*80)
    
    # Test cho từng user
    for user_id in [1, 2, 3]:
        user_data = next((u for u in recommender.users_data if u['id'] == user_id), None)
        if user_data:
            print(f"\n👤 User: {user_data['name']} (ID: {user_id})")
            print(f"❤️ Favorite Games: {user_data.get('favorite_games', [])}")
            print(f"🛒 Purchased Games: {user_data.get('purchased_games', [])}")
            
            # SVD Recommendations
            svd_recs = recommender.get_svd_recommendations(user_id, top_n=3)
            recommender.display_recommendations(svd_recs, f"🤖 SVD Recommendations for {user_data['name']}")
            
            # Content Recommendations
            content_recs = recommender.get_content_recommendations(user_id, top_n=3)
            recommender.display_recommendations(content_recs, f"📝 Content-based Recommendations for {user_data['name']}")
            
            # Hybrid Recommendations
            hybrid_recs = recommender.get_hybrid_recommendations(user_id, top_n=5)
            recommender.display_recommendations(hybrid_recs, f"🎯 Hybrid Recommendations for {user_data['name']}")
    
    # Test với hardware specs
    print("\n" + "="*80)
    print("🖥️ TESTING WITH HARDWARE SPECIFICATIONS")
    print("="*80)
    
    test_specs = [
        {"cpu": "Intel i5", "gpu": "GTX 1060", "ram": "8GB", "user": "Budget Gamer"},
        {"cpu": "Intel i7", "gpu": "RTX 3070", "ram": "16GB", "user": "Mid-range Gamer"},
        {"cpu": "Intel i9", "gpu": "RTX 4080", "ram": "32GB", "user": "High-end Gamer"}
    ]
    
    for spec in test_specs:
        print(f"\n🖥️ {spec['user']} - CPU: {spec['cpu']}, GPU: {spec['gpu']}, RAM: {spec['ram']}")
        
        # Test với user 1
        hardware_recs = recommender.get_hybrid_recommendations(
            user_id=1, 
            user_cpu=spec['cpu'], 
            user_gpu=spec['gpu'], 
            user_ram=spec['ram'], 
            top_n=5
        )
        recommender.display_recommendations(hardware_recs, f"🎮 Recommendations for {spec['user']}")
    
    return recommender

if __name__ == "__main__":
    recommender = main()
