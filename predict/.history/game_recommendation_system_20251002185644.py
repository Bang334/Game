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
                
            print("Load du lieu thanh cong!")
            return True
        except Exception as e:
            print(f"Loi khi load du lieu: {e}")
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
        
        print("Tien xu ly du lieu thanh cong!")
        print(f"User-Item Matrix shape: {self.user_item_matrix.shape}")
    
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
            
            print(f"Huan luyen SVD model voi k={k} thanh cong!")
            return True
        except Exception as e:
            print(f"Loi khi huan luyen SVD: {e}")
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
            
            print("Xay dung content similarity matrix thanh cong!")
            return True
        except Exception as e:
            print(f"Loi khi xay dung content similarity: {e}")
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
            print(f"Loi SVD recommendations: {e}")
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
            print(f"Loi Content recommendations: {e}")
            return []
    
    def calculate_demographic_similarity(self, user1, user2):
        """Tính độ tương đồng về tuổi và giới tính"""
        # Tính chênh lệch tuổi
        age_diff = abs(user1['age'] - user2['age'])
        
        # Trọng số tuổi: giảm 3% mỗi năm chênh lệch, tối thiểu 0.1
        age_weight = max(0.1, 1 - (age_diff * 0.03))
        
        # Trọng số giới tính: cùng giới tính = 1.0, khác giới tính = 0.7
        gender_weight = 1.0 if user1['gender'] == user2['gender'] else 0.7
        
        # Kết hợp cả hai trọng số
        demographic_similarity = age_weight * gender_weight
        
        return demographic_similarity
    
    def get_demographic_recommendations(self, user_id, top_n=5):
        """Gợi ý dựa trên người dùng có demographic tương tự"""
        try:
            # Lấy thông tin user hiện tại
            target_user = next((u for u in self.users_data if u['id'] == user_id), None)
            if not target_user:
                return []
            
            # Lấy games đã tương tác của target user
            target_interacted = set(target_user.get('favorite_games', []) + 
                                  target_user.get('purchased_games', []))
            
            # Tính điểm demographic cho mỗi game
            game_scores = {}
            
            # Duyệt qua tất cả games chưa tương tác
            for game_id in range(1, len(self.games_data) + 1):
                if game_id in target_interacted:
                    continue
                
                weighted_scores = []
                
                # Duyệt qua tất cả users khác
                for other_user in self.users_data:
                    if other_user['id'] == user_id:
                        continue
                    
                    # Kiểm tra user khác có thích game này không
                    other_favorites = other_user.get('favorite_games', [])
                    other_purchased = other_user.get('purchased_games', [])
                    
                    if game_id in other_favorites:
                        rating = 5.0  # Thích
                    elif game_id in other_purchased:
                        rating = 3.0  # Đã mua
                    else:
                        rating = 0.0  # Không tương tác
                    
                    if rating > 0:  # Chỉ tính những user có tương tác tích cực
                        # Tính độ tương đồng demographic
                        demo_sim = self.calculate_demographic_similarity(target_user, other_user)
                        
                        # Điểm có trọng số = rating × demographic_similarity
                        weighted_score = rating * demo_sim
                        weighted_scores.append(weighted_score)
                
                # Tính điểm trung bình cho game này
                if weighted_scores:
                    game_scores[game_id] = np.mean(weighted_scores)
            
            # Sắp xếp theo điểm
            sorted_games = sorted(game_scores.items(), key=lambda x: x[1], reverse=True)
            
            recommendations = []
            for game_id, score in sorted_games[:top_n]:
                game = next((g for g in self.games_data if g['id'] == game_id), None)
                if game:
                    recommendations.append({
                        'game_id': game_id,
                        'game_name': game['name'],
                        'demographic_score': score,
                        'actual_rating': game.get('rating', 0),
                        'genre': game.get('genre', []),
                        'price': game.get('price', 0)
                    })
            
            return recommendations
            
        except Exception as e:
            print(f"Loi Demographic recommendations: {e}")
            return []
    
    def get_hybrid_recommendations(self, user_id, top_n=10):
        """Gợi ý kết hợp SVD + Content-based"""
        
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
        
        return sorted_recommendations[:top_n]
    
    def display_recommendations(self, recommendations, title="Game Recommendations"):
        """Hien thi recommendations"""
        print(f"\n{title}")
        print("=" * 60)
        
        if not recommendations:
            print("Khong co goi y nao duoc tim thay.")
            return
        
        for i, rec in enumerate(recommendations, 1):
            print(f"\n{i}. {rec['game_name']}")
            print(f"   Rating: {rec['actual_rating']}/5.0")
            print(f"   Genre: {', '.join(rec['genre'])}")
            print(f"   Price: {rec['price']:,} VND")
            
            if 'hybrid_score' in rec:
                print(f"   Hybrid Score: {rec['hybrid_score']:.3f}")
            if 'svd_score' in rec and rec['svd_score'] != 0:
                print(f"   SVD Score: {rec['svd_score']:.3f}")
            if 'content_score' in rec and rec['content_score'] != 0:
                print(f"   Content Score: {rec['content_score']:.3f}")
            
            print("-" * 40)

def show_all_recommendations(recommender):
    """Hien thi goi y cho tat ca users"""
    print("\n" + "="*60)
    print("GAME RECOMMENDATION SYSTEM - SVD Algorithm")
    print("="*60)
    
    # Hien thi goi y cho tat ca users
    for user_id in [1, 2, 3]:
        user_data = next((u for u in recommender.users_data if u['id'] == user_id), None)
        if not user_data:
            continue
            
        print(f"\n" + "="*60)
        print(f"GOI Y CHO: {user_data['name']} (ID: {user_id})")
        print("="*60)
        
        # Hien thi thong tin user
        print(f"Tuoi: {user_data['age']}, Gioi tinh: {user_data['gender']}")
        print(f"Game yeu thich: {user_data.get('favorite_games', [])}")
        print(f"Game da mua: {user_data.get('purchased_games', [])}")
        
        # Lay tat ca games chua tuong tac
        interacted_games = set(user_data.get('favorite_games', []) + 
                             user_data.get('purchased_games', []))
        total_games = len(recommender.games_data)
        available_games = total_games - len(interacted_games)
        
        print(f"So game co the goi y: {available_games}")
        
        # Lay recommendations (tat ca games chua tuong tac)
        recommendations = recommender.get_hybrid_recommendations(
            user_id=user_id,
            top_n=available_games  # Lay tat ca
        )
        
        # Hien thi ket qua
        recommender.display_recommendations(recommendations, f"DANH SACH GOI Y CHO {user_data['name']}")
        
        print("\n" + "-"*60)

def main():
    """Ham main de chay he thong"""
    print("Khoi tao Game Recommendation System...")
    
    # Tao instance
    recommender = GameRecommendationSystem()
    
    # Load va preprocess data
    if not recommender.load_data():
        return
    
    recommender.preprocess_data()
    
    # Train models
    print("Huan luyen SVD model...")
    recommender.train_svd_model(k=2)
    
    print("Xay dung Content-based model...")
    recommender.build_content_similarity()
    
    print("He thong da san sang!")
    
    # Hien thi ket qua cho tat ca users
    show_all_recommendations(recommender)
    
    print("\nHoan thanh! He thong da tao goi y cho tat ca nguoi dung.")
    return recommender

if __name__ == "__main__":
    recommender = main()
