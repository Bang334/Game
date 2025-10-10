import json
import numpy as np
import pandas as pd
from scipy.sparse.linalg import svds
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import warnings
import sys
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

warnings.filterwarnings('ignore')

# Import matplotlib for visualization
try:
    import matplotlib.pyplot as plt
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False
    print("Warning: matplotlib not available. Charts will be skipped.")

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

# Dictionary trọng số khi KHÔNG có keyword
WEIGHTS_NO_KEYWORD = {
    'svd': DEFAULT_SVD_WEIGHT_NO_KEYWORD,
    'content': DEFAULT_CONTENT_WEIGHT_NO_KEYWORD,
    'demographic': DEFAULT_DEMOGRAPHIC_WEIGHT_NO_KEYWORD,
    'keyword': DEFAULT_KEYWORD_WEIGHT_NO_KEYWORD
}

# Dictionary trọng số khi CÓ keyword
WEIGHTS_WITH_KEYWORD = {
    'svd': DEFAULT_SVD_WEIGHT_WITH_KEYWORD,
    'content': DEFAULT_CONTENT_WEIGHT_WITH_KEYWORD,
    'demographic': DEFAULT_DEMOGRAPHIC_WEIGHT_WITH_KEYWORD,
    'keyword': DEFAULT_KEYWORD_WEIGHT_WITH_KEYWORD
}

# Kiểm tra tổng trọng số = 1.0
assert sum(WEIGHTS_NO_KEYWORD.values()) == 1.0, "Tổng trọng số không có keyword phải = 1.0"
assert sum(WEIGHTS_WITH_KEYWORD.values()) == 1.0, "Tổng trọng số có keyword phải = 1.0"

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
        # Adaptive preferences
        self.user_preferences = {}  # Cache user preferences
        
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
            
            # Load library data (keyword mapping)
            with open('library.json', 'r', encoding='utf-8') as f:
                library_data = json.load(f)
                self.keyword_library = library_data['keywords']
                
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
        
        # Tạo rating matrix từ favorite_games, purchased_games, và view_history (implicit feedback)
        # Giả sử: favorite = 5, purchased = 3, view = 0.5 (mỗi lần xem), có thể cộng dồn
        user_game_ratings = []
        
        for user in self.users_data:
            user_id = user['id']
            favorites = user.get('favorite_games', [])
            purchased = user.get('purchased_games', {})  # Now a dictionary: {game_id: rating}
            view_history = user.get('view_history', [])
            
            for game in self.games_data:
                game_id = game['id']
                rating = 0.0
                
                # Tính điểm cộng dồn cho trường hợp trùng lặp
                if game_id in favorites:
                    rating += 5.0  # Favorite games
                if game_id in purchased:
                    rating += purchased[game_id]  # Use actual rating from review (1-5) or default 3
                
                # Thêm điểm từ view history (0.5 điểm mỗi lần xem)
                view_count = view_history.get(game_id, 0)
                rating += view_count * 0.5  # 0.5 điểm mỗi lần xem
                
                # Nếu vừa favorite vừa purchased vừa xem nhiều lần = 5.0 + 3.0 + (số lần xem * 0.5)
                
                user_game_ratings.append({
                    'user_id': user_id,
                    'game_id': game_id,
                    'rating': rating
                })
        
        # Tạo user-item matrix
        ratings_df = pd.DataFrame(user_game_ratings)
        
        # Loại bỏ duplicate entries nếu có
        ratings_df = ratings_df.drop_duplicates(subset=['user_id', 'game_id'], keep='last')
        
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
        """Xây dựng ma trận tương đồng content-based với nhiều thuộc tính chi tiết"""
        try:
            from sklearn.preprocessing import StandardScaler
            import numpy as np
            
            # Tạo features chi tiết và đa dạng
            text_features = []
            numeric_features = []
            
            for game in self.games_data:
                # === TEXT FEATURES ===
                # Genre (quan trọng nhất - lặp lại 3 lần để tăng trọng số)
                genre_list = game.get('genre', [])
                genre_str = ' '.join(genre_list)
                genre_weighted = ' '.join([genre_str] * 3)  # Tăng trọng số cho genre
                
                # Publisher (quan trọng)
                publisher = game.get('publisher', '')
                
                # Age rating
                age_rating = game.get('age_rating', '')
                
                # Platform
                platform_list = game.get('platform', [])
                platform_str = ' '.join(platform_list)
                
                # Mode
                mode = game.get('mode', '')
                
                # Multiplayer
                multiplayer = 'multiplayer' if game.get('multiplayer', False) else 'singleplayer'
                
                # Language
                language_list = game.get('language', [])
                language_str = ' '.join(language_list)
                
                # Description (nếu có)
                description = game.get('description', '')
                # Lấy 50 từ đầu của description để tránh quá dài
                description_words = description.split()[:50]
                description_str = ' '.join(description_words)
                
                # Kết hợp text features
                text_feature = f"{genre_weighted} {publisher} {age_rating} {platform_str} {mode} {multiplayer} {language_str} {description_str}"
                text_features.append(text_feature)
                
                # === NUMERIC FEATURES ===
                # Rating (chuẩn hóa về 0-1)
                rating = game.get('rating', 0)
                rating_normalized = rating / 5.0 if rating > 0 else 0
                
                # Price (chuẩn hóa về log scale)
                price = game.get('price', 0)
                price_normalized = np.log10(max(price, 1)) / 7.0  # Chuẩn hóa về 0-1
                
                # Downloads (chuẩn hóa về log scale)
                downloads = game.get('downloads', 0)
                downloads_normalized = np.log10(max(downloads, 1)) / 9.0  # Chuẩn hóa về 0-1
                
                # Capacity (GB)
                capacity = game.get('capacity', 0)
                capacity_normalized = min(capacity / 100.0, 1.0)  # Chuẩn hóa về 0-1
                
                # Release date (chuẩn hóa)
                release_date = game.get('release_date', '2020-01-01')
                try:
                    release_year = int(release_date.split('-')[0]) if release_date else 2020
                except:
                    release_year = 2020
                year_normalized = (release_year - 1990) / 35.0  # Chuẩn hóa về 0-1
                
                # CPU Score từ min_spec
                min_spec = game.get('min_spec', {})
                cpu_name = min_spec.get('cpu', '')
                cpu_score = self.get_cpu_score(cpu_name)
                cpu_normalized = min(cpu_score / 10000.0, 1.0)  # Chuẩn hóa về 0-1
                
                # GPU Score từ min_spec
                gpu_name = min_spec.get('gpu', '')
                gpu_score = self.get_gpu_score(gpu_name)
                gpu_normalized = min(gpu_score / 10000.0, 1.0)  # Chuẩn hóa về 0-1
                
                # RAM (GB)
                ram_str = min_spec.get('ram', '0GB')
                try:
                    ram_gb = int(ram_str.replace('GB', ''))
                    ram_normalized = min(ram_gb / 32.0, 1.0)  # Chuẩn hóa về 0-1
                except:
                    ram_normalized = 0
                
                # Kết hợp numeric features
                numeric_feature = [
                    rating_normalized, price_normalized, downloads_normalized,
                    capacity_normalized, year_normalized, cpu_normalized,
                    gpu_normalized, ram_normalized
                ]
                numeric_features.append(numeric_feature)
            
            # Tính TF-IDF cho text features
            tfidf = TfidfVectorizer(stop_words='english', lowercase=True, min_df=1, max_features=1000)
            text_matrix = tfidf.fit_transform(text_features)
            
            # Chuẩn hóa numeric features
            numeric_array = np.array(numeric_features)
            scaler = StandardScaler()
            numeric_matrix = scaler.fit_transform(numeric_array)
            
            # Kết hợp text và numeric features
            from scipy.sparse import hstack, csr_matrix
            numeric_sparse = csr_matrix(numeric_matrix)
            
            # Kết hợp với trọng số: Text (1x), Numeric (0.5x)
            combined_matrix = hstack([text_matrix, numeric_sparse * 0.5])
            
            # Tính cosine similarity
            similarity_matrix = cosine_similarity(combined_matrix)
            
            # Lưu ma trận similarity
            self.content_similarity_matrix = similarity_matrix
            
            print("Xay dung content similarity matrix chi tiet thanh cong!")
            print(f"Text features: {text_matrix.shape[1]} dimensions")
            print(f"Numeric features: {numeric_matrix.shape[1]} dimensions")
            print(f"Total features: {combined_matrix.shape[1]} dimensions")
            print("Content similarity calculated with detailed features")
            print(f"Similarity range: {similarity_matrix.min():.3f} - {similarity_matrix.max():.3f}")
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
    
    def expand_query(self, query):
        """Mở rộng query 1 lần duy nhất từ tiếng Việt sang tiếng Anh"""
        if not query or not hasattr(self, 'keyword_library'):
            return query
        
        query = query.lower().strip()
        expanded_keywords = set()
        
        # Thêm query gốc
        expanded_keywords.add(query)
        
        # Tách query theo dấu phẩy (ví dụ: "hành động, kịch tính" → ["hành động", "kịch tính"])
        query_phrases = [phrase.strip() for phrase in query.split(',')]
        
        # Tìm kiếm trong library để mở rộng 1 lần duy nhất
        for english_key, vietnamese_synonyms in self.keyword_library.items():
            vietnamese_synonyms = vietnamese_synonyms.lower()
            
            # Kiểm tra từng phrase trong query
            for phrase in query_phrases:
                # Match whole word - kiểm tra phrase có xuất hiện như một từ hoàn chỉnh trong synonyms
                if phrase in vietnamese_synonyms:
                    # Chỉ thêm english_key, không mở rộng thêm
                    expanded_keywords.add(english_key.lower())
        
        # Kết hợp tất cả keywords (chỉ mở rộng 1 lần)
        return ' '.join(expanded_keywords)
    
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
                view_history = user_data.get('view_history', {})
                purchased_games = user_data.get('purchased_games', {})
                interacted_games = set(user_data.get('favorite_games', []) + 
                                     list(purchased_games.keys()) +
                                     list(view_history.keys()))
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
                            'price': game.get('price', 0),
                            'downloads': game.get('downloads', 0)
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
            
            # Lấy tất cả games đã tương tác (GIỮ TRÙNG LẶP để tăng trọng số)
            favorite_games = user_data.get('favorite_games', [])
            purchased_games_dict = user_data.get('purchased_games', {})
            view_history = user_data.get('view_history', {})
            
            # Convert purchased_games dict to list of game_ids
            purchased_games = list(purchased_games_dict.keys())
            
            # Tạo danh sách games với trọng số từ view history
            view_games_weighted = []
            for game_id, view_count in view_history.items():
                # Lặp lại game_id theo số lần xem để tăng trọng số
                view_games_weighted.extend([game_id] * view_count)
            
            # KHÔNG dùng set() để giữ trùng lặp - games vừa thích vừa mua vừa xem sẽ xuất hiện nhiều lần
            interacted_games = favorite_games + purchased_games + view_games_weighted
            
            if not interacted_games:
                return []
            
            # Lấy unique games để loại bỏ khỏi gợi ý
            unique_interacted = set(interacted_games)
            
            # Tính điểm similarity trung bình có trọng số cho mỗi game
            game_scores = {}
            
            for game_id in range(1, len(self.games_data) + 1):
                if game_id in unique_interacted:
                    continue
                
                similarity_scores = []
                for interacted_game_id in interacted_games:  # Dùng list có trùng lặp
                    # Đảm bảo interacted_game_id là int và trong phạm vi hợp lệ
                    try:
                        game_id_int = int(interacted_game_id)
                        if 1 <= game_id_int <= len(self.games_data):
                            sim_score = self.content_similarity_matrix[game_id_int - 1][game_id - 1]
                            similarity_scores.append(sim_score)
                    except (ValueError, TypeError):
                        # Bỏ qua nếu không thể convert thành int
                        continue
                
                if similarity_scores:
                    # Tính content score tự nhiên dựa trên similarity thực tế
                    avg_similarity = np.mean(similarity_scores)
                    game_scores[game_id] = avg_similarity
                else:
                    # Nếu không có similarity scores, content score = 0 (tự nhiên)
                    game_scores[game_id] = 0.0
            
            # Không điều chỉnh ở đây, sẽ điều chỉnh trong get_hybrid_recommendations
            
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
                        'price': game.get('price', 0),
                        'downloads': game.get('downloads', 0)
                    })
            
            return recommendations
            
        except Exception as e:
            print(f"Loi Content recommendations: {e}")
            return []
    
    def calculate_demographic_similarity(self, user1, user2):
        """Tính độ tương đồng về tuổi và giới tính"""
        # Tính chênh lệch tuổi
        age_diff = abs(user1['age'] - user2['age'])
        
        # Trọng số tuổi: giảm 0.2 mỗi năm chênh lệch, cách 5 tuổi = 0
        # 1 tuổi: 1 - 0.2 = 0.8
        # 2 tuổi: 1 - 0.4 = 0.6  
        # 3 tuổi: 1 - 0.6 = 0.4
        # 4 tuổi: 1 - 0.8 = 0.2
        # 5 tuổi: 1 - 1.0 = 0.0
        age_weight = max(0.0, 1 - (age_diff * 0.2))
        
        # Trọng số giới tính: cùng giới tính = 1.0, khác giới tính = 0.5
        gender_weight = 1.0 if user1['gender'] == user2['gender'] else 0.5
        
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
            view_history = target_user.get('view_history', {})
            purchased_games_dict = target_user.get('purchased_games', {})
            target_interacted = set(target_user.get('favorite_games', []) + 
                                  list(purchased_games_dict.keys()) +
                                  list(view_history.keys()))
            
            # Tìm những user có demographic tương tự và tính trọng số
            similar_users = []
            for other_user in self.users_data:
                if other_user['id'] == user_id:
                    continue
                
                # Tính độ tương đồng demographic
                demo_sim = self.calculate_demographic_similarity(target_user, other_user)
                similar_users.append((other_user, demo_sim))
            
            # Tính điểm cho mỗi game dựa trên sở thích của similar users
            game_scores = {}
            
            # Duyệt qua tất cả games chưa tương tác
            for game_id in range(1, len(self.games_data) + 1):
                if game_id in target_interacted:
                    continue
                
                weighted_score = 0.0
                total_weight = 0.0
                
                # Tính điểm từ các similar users
                for other_user, demo_sim in similar_users:
                    other_favorites = other_user.get('favorite_games', [])
                    other_purchased_dict = other_user.get('purchased_games', {})
                    other_purchased = list(other_purchased_dict.keys())
                    other_view_history = other_user.get('view_history', {})
                    
                    rating = 0.0
                    
                    if game_id in other_favorites:
                        rating = 5.0  # User tương tự thích game này
                    elif game_id in other_purchased:
                        rating = other_purchased_dict.get(game_id, 3.0)  # Use actual rating from review
                    elif game_id in other_view_history:
                        # User tương tự đã xem game này - tính điểm dựa trên số lần xem
                        view_count = other_view_history[game_id]
                        rating = view_count * 0.5  # 0.5 điểm mỗi lần xem
                    
                    # Cộng điểm có trọng số
                    weighted_score += rating * demo_sim
                    total_weight += demo_sim
                
                # Tính điểm trung bình có trọng số
                if total_weight > 0:
                    game_scores[game_id] = weighted_score / total_weight
            
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
                        'price': game.get('price', 0),
                        'downloads': game.get('downloads', 0)
                    })
            
            return recommendations
            
        except Exception as e:
            print(f"Loi Demographic recommendations: {e}")
            return []
    
    def get_keyword_score(self, game, keyword, debug=False):
        """Tính điểm keyword cho một game"""
        if not keyword or keyword.strip() == "":
            return 0.0
        
        # Mở rộng keyword bằng library
        expanded_keyword = self.expand_query(keyword)
        
        # Tách thành các từ khóa riêng lẻ
        keywords_to_search = expanded_keyword.lower().split()
        
        if debug:
            print(f"\n=== DEBUG KEYWORD SCORE: {game['name']} ===")
            print(f"Original keyword: {keyword}")
            print(f"Expanded length: {len(expanded_keyword)} chars")
            print(f"Keywords count: {len(keywords_to_search)}")
        
        score = 0.0
        
        # Tìm trong tất cả các field của game
        searchable_fields = {
            'name': 3.0,           # Tên game quan trọng nhất
            'description': 2.0,    # Mô tả quan trọng thứ 2
            'genre': 2.5,          # Genre quan trọng
            'publisher': 1.5,      # Publisher
            'platform': 1.5,      # Platform
            'language': 1.5,       # Language quan trọng
            'mode': 1.0,           # Mode
            'age_rating': 1.0,     # Age rating
        }
        
        # Tìm trong text fields
        for field, weight in searchable_fields.items():
            field_value = game.get(field, '')
            if isinstance(field_value, list):
                field_value = ' '.join(field_value)
            field_value = str(field_value).lower()
            
            # Tìm kiếm với tất cả keywords đã mở rộng (whole word matching)
            matched_keyword = None
            field_words = field_value.split()  # Tách thành từng từ
            for kw in keywords_to_search:
                if len(kw) >= 2 and kw in field_words:  # Chỉ tìm từ >= 2 ký tự và match whole word
                    score += weight
                    matched_keyword = kw
                    break  # Chỉ tính 1 lần cho mỗi field
            
            if debug:
                if matched_keyword:
                    print(f"  {field} (+{weight}): '{field_value}' contains '{matched_keyword}'")
                else:
                    print(f"  {field} (0): '{field_value}' - no match")
        
        # Tìm trong specs (CPU, GPU, RAM) - bỏ storage vì đã có capacity
        min_spec = game.get('min_spec', {})
        rec_spec = game.get('rec_spec', {})
        
        spec_fields = ['cpu', 'gpu', 'ram']
        for spec_field in spec_fields:
            min_val = str(min_spec.get(spec_field, '')).lower()
            rec_val = str(rec_spec.get(spec_field, '')).lower()
            
            # Tìm kiếm với tất cả keywords đã mở rộng (whole word matching)
            matched_keyword = None
            min_words = min_val.split()
            rec_words = rec_val.split()
            for kw in keywords_to_search:
                if len(kw) >= 2 and (kw in min_words or kw in rec_words):
                    score += 1.5  # Specs có trọng số trung bình
                    matched_keyword = kw
                    break  # Chỉ tính 1 lần cho mỗi spec field
            
            if debug:
                if matched_keyword:
                    print(f"  {spec_field} (+1.5): '{min_val}' or '{rec_val}' contains '{matched_keyword}'")
                else:
                    print(f"  {spec_field} (0): '{min_val}' / '{rec_val}' - no match")
        
        # Tìm trong price (nếu keyword gốc là số)
        price_matched = False
        try:
            original_keyword = keyword.lower().strip()
            keyword_num = float(original_keyword.replace('gb', '').replace('mb', '').replace('k', '000').replace('m', '000000'))
            price = game.get('price', 0)
            
            # Nếu keyword gần với price (trong khoảng 20%)
            if price > 0 and abs(price - keyword_num) / price < 0.2:
                score += 1.0
                price_matched = True
        except:
            pass
        
        # Tìm trong release_date (nếu keyword chứa số năm)
        release_year_matched = False
        try:
            original_keyword = keyword.lower().strip()
            release_date = game.get('release_date', '2020-01-01')
            try:
                release_year = int(release_date.split('-')[0]) if release_date else 0
            except:
                release_year = 0
            
            # Tìm số năm trong keyword (có thể là "2021", "iRacing 2021", "2021 game", etc.)
            import re
            year_pattern = r'\b(?:19|20)\d{2}\b'  # Tìm năm 1900-2099 (non-capturing group)
            year_matches = re.findall(year_pattern, original_keyword)
            
            if year_matches and release_year > 0:
                # Lấy năm đầu tiên tìm thấy
                keyword_year = int(year_matches[0])
                
                # Nếu keyword chứa năm và khớp với release_year
                if keyword_year == release_year:
                    score += 2.0  # Trọng số cao cho năm chính xác
                    release_year_matched = True
                # Nếu keyword chứa năm gần với release_year (trong khoảng 2 năm)
                elif abs(release_year - keyword_year) <= 2:
                    score += 1.0  # Trọng số thấp hơn cho năm gần
                    release_year_matched = True
        except:
            pass
        
        # Tìm trong multiplayer (nếu keyword là "multiplayer")
        multiplayer_matched = False
        if 'multiplayer' in original_keyword.lower():
            game_multiplayer = game.get('multiplayer', False)
            if game_multiplayer:
                score += 1.0  # Trọng số cho multiplayer
                multiplayer_matched = True
        
        if debug:
            if price_matched:
                print(f"  price (+1.0): {game.get('price', 0)} matches {keyword}")
            else:
                print(f"  price (0): {game.get('price', 0)} - no match")
            
            if release_year_matched:
                print(f"  release_date (+2.0): {release_year} matches {keyword}")
            else:
                print(f"  release_date (0): {release_year} - no match")
            
            if multiplayer_matched:
                print(f"  multiplayer (+1.0): {game.get('multiplayer', False)} matches {keyword}")
            else:
                print(f"  multiplayer (0): {game.get('multiplayer', False)} - no match")
            
            print(f"\nTotal raw score: {score}")
            final_score = min(score / 15.0, 1.0)
            print(f"Final score: {score} / 15.0 = {final_score:.3f}")
            print("=" * 50)
        
        # Chuẩn hóa score về 0-1 (max possible score ≈ 15.0)
        # 3.0 + 2.0 + 2.5 + 1.5 + 1.5 + 1.5 + 1.0 + 1.0 + (3 specs * 1.5) + 1.0 + 2.0 (release_date) + 1.0 (multiplayer) = 15.0
        return min(score / 15.0, 1.0)
    
    def analyze_user_preferences(self, user_id, recent_days=None):
        """
        Phân tích sở thích người dùng dựa trên lịch sử tương tác
        
        Args:
            user_id: ID của user
            recent_days: Số ngày gần đây để phân tích (None = all time)
                        Ví dụ: recent_days=7 → chỉ phân tích 7 ngày vừa qua
        
        Trả về dictionary chứa preferences: publisher, genre, price_range, etc.
        """
        # Check cache (bỏ qua cache nếu có recent_days)
        cache_key = f"{user_id}_{recent_days}" if recent_days else str(user_id)
        if cache_key in self.user_preferences:
            return self.user_preferences[cache_key]
        
        user_data = next((u for u in self.users_data if u['id'] == user_id), None)
        if not user_data:
            return None
        
        # Lấy tất cả games đã tương tác với trọng số khác nhau
        favorite_games = user_data.get('favorite_games', [])
        purchased_games = list(user_data.get('purchased_games', {}).keys())
        view_history = user_data.get('view_history', {})
        
        # ⭐ FILTER BY RECENT DAYS (if timestamps available)
        if recent_days:
            from datetime import datetime, timedelta
            cutoff_date = datetime.now() - timedelta(days=recent_days)
            
            # Filter favorite_games (nếu có timestamps)
            favorite_games_timestamps = user_data.get('favorite_games_timestamps', {})
            if favorite_games_timestamps:
                favorite_games = [
                    game_id for game_id in favorite_games
                    if game_id in favorite_games_timestamps and 
                    datetime.fromisoformat(favorite_games_timestamps[str(game_id)]) >= cutoff_date
                ]
            
            # Filter purchased_games (nếu có timestamps)
            purchased_games_timestamps = user_data.get('purchased_games_timestamps', {})
            if purchased_games_timestamps:
                purchased_games = [
                    game_id for game_id in purchased_games
                    if game_id in purchased_games_timestamps and
                    datetime.fromisoformat(purchased_games_timestamps[str(game_id)]) >= cutoff_date
                ]
            
            # Filter view_history (nếu có timestamps)
            view_history_timestamps = user_data.get('view_history_timestamps', {})
            if view_history_timestamps:
                view_history = {
                    game_id: count for game_id, count in view_history.items()
                    if game_id in view_history_timestamps and
                    datetime.fromisoformat(view_history_timestamps[str(game_id)]) >= cutoff_date
                }
        
        # Tạo weighted interactions: favorite=5, purchased=3, view=view_count*0.5
        weighted_interactions = {}
        
        for game_id in favorite_games:
            weighted_interactions[game_id] = weighted_interactions.get(game_id, 0) + 5.0
        
        for game_id in purchased_games:
            weighted_interactions[game_id] = weighted_interactions.get(game_id, 0) + 3.0
        
        for game_id, view_count in view_history.items():
            weighted_interactions[game_id] = weighted_interactions.get(game_id, 0) + (view_count * 0.5)
        
        # Phân tích preferences
        publisher_scores = {}
        genre_scores = {}
        price_ranges = []
        age_ratings = {}
        modes = {}
        platforms = {}
        
        total_weight = sum(weighted_interactions.values())
        
        for game_id, weight in weighted_interactions.items():
            try:
                game_id_int = int(game_id)
                game = next((g for g in self.games_data if g['id'] == game_id_int), None)
                if not game:
                    continue
                
                # Publisher preferences
                publisher = game.get('publisher', '')
                if publisher:
                    publisher_scores[publisher] = publisher_scores.get(publisher, 0) + weight
                
                # Genre preferences
                genres = game.get('genre', [])
                for genre in genres:
                    genre_scores[genre] = genre_scores.get(genre, 0) + weight
                
                # Price range
                price = game.get('price', 0)
                price_ranges.append(price)
                
                # Age rating
                age_rating = game.get('age_rating', '')
                if age_rating:
                    age_ratings[age_rating] = age_ratings.get(age_rating, 0) + weight
                
                # Mode
                mode = game.get('mode', '')
                if mode:
                    modes[mode] = modes.get(mode, 0) + weight
                
                # Platform
                platforms_list = game.get('platform', [])
                for platform in platforms_list:
                    platforms[platform] = platforms.get(platform, 0) + weight
                    
            except (ValueError, TypeError):
                continue
        
        # Normalize scores
        if total_weight > 0:
            for key in publisher_scores:
                publisher_scores[key] /= total_weight
            for key in genre_scores:
                genre_scores[key] /= total_weight
            for key in age_ratings:
                age_ratings[key] /= total_weight
            for key in modes:
                modes[key] /= total_weight
            for key in platforms:
                platforms[key] /= total_weight
        
        # Calculate preferred price range
        if price_ranges:
            avg_price = sum(price_ranges) / len(price_ranges)
            min_price = min(price_ranges)
            max_price = max(price_ranges)
            price_std = np.std(price_ranges) if len(price_ranges) > 1 else 0
        else:
            avg_price = min_price = max_price = price_std = 0
        
        preferences = {
            'publishers': publisher_scores,  # {publisher: score}
            'genres': genre_scores,          # {genre: score}
            'price_avg': avg_price,
            'price_min': min_price,
            'price_max': max_price,
            'price_std': price_std,
            'age_ratings': age_ratings,      # {age_rating: score}
            'modes': modes,                  # {mode: score}
            'platforms': platforms,          # {platform: score}
            'total_interactions': len(weighted_interactions)
        }
        
        # Cache preferences
        self.user_preferences[cache_key] = preferences
        
        return preferences
    
    def calculate_preference_boost(self, game, user_preferences, debug=False):
        """
        Tính boost factor cho game dựa trên user preferences
        Boost factor từ 1.0 đến 1.5 (có thể tăng hơn nếu nhiều attributes khớp)
        """
        if not user_preferences:
            return 1.0
        
        boost_factor = 1.0
        boost_details = []
        
        # Publisher boost (rất quan trọng - boost 1.5x nếu match top publisher)
        publisher = game.get('publisher', '')
        publisher_prefs = user_preferences.get('publishers', {})
        if publisher in publisher_prefs:
            publisher_score = publisher_prefs[publisher]
            # Top publisher (score >= 0.3) → boost 1.5x
            # Medium publisher (0.1 - 0.3) → boost 1.3x
            # Low publisher (< 0.1) → boost 1.1x
            if publisher_score >= 0.3:
                boost_factor *= 1.5
                boost_details.append(f"Publisher '{publisher}' (top: {publisher_score:.2f}) → x1.5")
            elif publisher_score >= 0.1:
                boost_factor *= 1.3
                boost_details.append(f"Publisher '{publisher}' (med: {publisher_score:.2f}) → x1.3")
            else:
                boost_factor *= 1.1
                boost_details.append(f"Publisher '{publisher}' (low: {publisher_score:.2f}) → x1.1")
        
        # Genre boost (quan trọng - boost lên đến 1.4x)
        genres = game.get('genre', [])
        genre_prefs = user_preferences.get('genres', {})
        max_genre_score = 0
        matched_genre = None
        for genre in genres:
            if genre in genre_prefs:
                if genre_prefs[genre] > max_genre_score:
                    max_genre_score = genre_prefs[genre]
                    matched_genre = genre
        
        if max_genre_score > 0:
            if max_genre_score >= 0.4:
                boost_factor *= 1.4
                boost_details.append(f"Genre '{matched_genre}' (top: {max_genre_score:.2f}) → x1.4")
            elif max_genre_score >= 0.2:
                boost_factor *= 1.25
                boost_details.append(f"Genre '{matched_genre}' (med: {max_genre_score:.2f}) → x1.25")
            else:
                boost_factor *= 1.1
                boost_details.append(f"Genre '{matched_genre}' (low: {max_genre_score:.2f}) → x1.1")
        
        # Price range boost (boost 1.2x nếu trong khoảng giá quen thuộc)
        price = game.get('price', 0)
        price_avg = user_preferences.get('price_avg', 0)
        price_std = user_preferences.get('price_std', 0)
        
        if price_avg > 0 and price_std > 0:
            # Nếu price trong khoảng [avg - std, avg + std] → boost
            if abs(price - price_avg) <= price_std:
                boost_factor *= 1.2
                boost_details.append(f"Price {price:,} in preferred range [{price_avg-price_std:,.0f}, {price_avg+price_std:,.0f}] → x1.2")
            elif abs(price - price_avg) <= 2 * price_std:
                boost_factor *= 1.1
                boost_details.append(f"Price {price:,} near preferred range → x1.1")
        
        # Age rating boost (boost 1.15x nếu match)
        age_rating = game.get('age_rating', '')
        age_rating_prefs = user_preferences.get('age_ratings', {})
        if age_rating in age_rating_prefs:
            age_score = age_rating_prefs[age_rating]
            if age_score >= 0.3:
                boost_factor *= 1.15
                boost_details.append(f"Age rating '{age_rating}' ({age_score:.2f}) → x1.15")
        
        # Mode boost (boost 1.15x nếu match)
        mode = game.get('mode', '')
        mode_prefs = user_preferences.get('modes', {})
        if mode in mode_prefs:
            mode_score = mode_prefs[mode]
            if mode_score >= 0.3:
                boost_factor *= 1.15
                boost_details.append(f"Mode '{mode}' ({mode_score:.2f}) → x1.15")
        
        # Platform boost (boost 1.1x nếu match)
        platforms = game.get('platform', [])
        platform_prefs = user_preferences.get('platforms', {})
        max_platform_score = 0
        matched_platform = None
        for platform in platforms:
            if platform in platform_prefs:
                if platform_prefs[platform] > max_platform_score:
                    max_platform_score = platform_prefs[platform]
                    matched_platform = platform
        
        if max_platform_score >= 0.3:
            boost_factor *= 1.1
            boost_details.append(f"Platform '{matched_platform}' ({max_platform_score:.2f}) → x1.1")
        
        if debug:
            print(f"\n=== BOOST DEBUG: {game['name']} ===")
            print(f"Base boost: 1.0")
            for detail in boost_details:
                print(f"  + {detail}")
            print(f"Final boost factor: {boost_factor:.3f}")
        
        return boost_factor
    
    def adjust_weights_based_on_behavior(self, user_id, recommendations_before_boost):
        """
        Điều chỉnh trọng số dựa trên hành vi:
        - Nếu user thường chọn game ngoài top 10 → giảm keyword weight, tăng content/demographic
        - Nếu user có patterns mạnh (publisher, genre) → tăng content weight
        
        Trả về adjusted weights
        """
        user_data = next((u for u in self.users_data if u['id'] == user_id), None)
        if not user_data:
            return None
        
        # Phân tích: user có thường chọn game ngoài top 10 không?
        favorite_games = set(user_data.get('favorite_games', []))
        purchased_games = set(user_data.get('purchased_games', {}).keys())
        view_history = set(user_data.get('view_history', {}).keys())
        
        # Tất cả games user đã tương tác
        all_interacted = favorite_games.union(purchased_games).union(view_history)
        
        # Đếm có bao nhiêu games nằm ngoài top 10
        top_10_game_ids = set([rec['game_id'] for rec in recommendations_before_boost[:10]])
        
        # Games user chọn nhưng không nằm trong top 10 dự đoán
        games_outside_top10 = all_interacted - top_10_game_ids
        
        ratio_outside_top10 = len(games_outside_top10) / len(all_interacted) if len(all_interacted) > 0 else 0
        
        # Phân tích preferences strength
        preferences = self.analyze_user_preferences(user_id)
        
        # Tính độ mạnh của preferences (có publisher/genre preferences mạnh không?)
        publisher_strength = max(preferences['publishers'].values()) if preferences['publishers'] else 0
        genre_strength = max(preferences['genres'].values()) if preferences['genres'] else 0
        
        preference_strength = (publisher_strength + genre_strength) / 2
        
        print(f"\n📊 User Behavior Analysis (ID: {user_id}):")
        print(f"  - Games outside top 10: {len(games_outside_top10)}/{len(all_interacted)} ({ratio_outside_top10:.1%})")
        print(f"  - Publisher preference strength: {publisher_strength:.2f}")
        print(f"  - Genre preference strength: {genre_strength:.2f}")
        print(f"  - Overall preference strength: {preference_strength:.2f}")
        
        # Quyết định điều chỉnh weights
        adjusted_weights = None
        
        # Case 1: User thường chọn game ngoài top 10 (ratio >= 50%)
        # → Giảm keyword weight (nếu có), tăng content/demographic
        if ratio_outside_top10 >= 0.5:
            print(f"  → User tends to explore beyond recommendations")
            print(f"  → Adjusting: reduce keyword weight, boost content/demographic")
            
            # Giảm keyword từ 0.60 → 0.30, phân bổ cho content & demographic
            adjusted_weights = {
                'svd': 0.15,
                'content': 0.35,      # tăng từ 0.15 → 0.35
                'demographic': 0.20,  # tăng từ 0.10 → 0.20
                'keyword': 0.30       # giảm từ 0.60 → 0.30
            }
        
        # Case 2: User có preference strength cao (>= 0.4)
        # → Tăng content weight vì preferences patterns mạnh
        elif preference_strength >= 0.4:
            print(f"  → User has strong preferences (publisher/genre)")
            print(f"  → Adjusting: boost content weight for better matching")
            
            adjusted_weights = {
                'svd': 0.10,          # giảm SVD
                'content': 0.25,      # tăng content từ 0.15 → 0.25
                'demographic': 0.05,  # giảm demographic
                'keyword': 0.60       # giữ keyword
            }
        
        return adjusted_weights
    
    def get_hybrid_recommendations(self, user_id, top_n=10, keyword="", enable_adaptive=True, recent_days=None):
        """
        Gợi ý kết hợp SVD + Content-based + Demographic + Keyword
        
        Args:
            user_id: ID của user
            top_n: Số lượng games gợi ý
            keyword: Từ khóa tìm kiếm
            enable_adaptive: Bật adaptive preference boosting
            recent_days: Phân tích preferences từ N ngày gần đây (None = all time)
                        Ví dụ: recent_days=7 → chỉ dùng data 7 ngày vừa qua
        """
        
        # Lấy recommendations từ cả ba phương pháp
        svd_recs = self.get_svd_recommendations(user_id, top_n)
        content_recs = self.get_content_recommendations(user_id, top_n)
        demographic_recs = self.get_demographic_recommendations(user_id, top_n)
        
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
                'demographic_score': 0,
                'keyword_score': 0,
                'actual_rating': rec['actual_rating'],
                'genre': rec['genre'],
                'price': rec['price'],
                'downloads': rec['downloads']
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
                    'demographic_score': 0,
                    'keyword_score': 0,
                    'actual_rating': rec['actual_rating'],
                    'genre': rec['genre'],
                    'price': rec['price'],
                    'downloads': rec['downloads']
                }
        
        # Thêm Demographic recommendations
        for rec in demographic_recs:
            game_id = rec['game_id']
            if game_id in all_games:
                all_games[game_id]['demographic_score'] = rec['demographic_score']
            else:
                all_games[game_id] = {
                    'game_id': game_id,
                    'game_name': rec['game_name'],
                    'svd_score': 0,
                    'content_score': 0,
                    'demographic_score': rec['demographic_score'],
                    'keyword_score': 0,
                    'actual_rating': rec['actual_rating'],
                    'genre': rec['genre'],
                    'price': rec['price'],
                    'downloads': rec['downloads']
                }
        
        # Thêm tất cả games để tính keyword score
        for game in self.games_data:
            game_id = game['id']
            if game_id not in all_games:
                all_games[game_id] = {
                    'game_id': game_id,
                    'game_name': game['name'],
                    'svd_score': 0,
                    'content_score': 0,  # Sẽ được tính sau
                    'demographic_score': 0,
                    'keyword_score': 0,
                    'actual_rating': game.get('rating', 0),
                    'genre': game.get('genre', []),
                    'price': game.get('price', 0),
                    'downloads': game.get('downloads', 0)
                }
        
        # Tính content score cho các games chưa có content score
        for game_id in all_games:
            if all_games[game_id]['content_score'] == 0:
                # Tính content score dựa trên similarity với games user đã tương tác
                user_data = next((u for u in self.users_data if u['id'] == user_id), None)
                if user_data and self.content_similarity_matrix is not None:
                    # Lấy games user đã tương tác
                    favorite_games = user_data.get('favorite_games', [])
                    purchased_games_dict = user_data.get('purchased_games', {})
                    purchased_games = list(purchased_games_dict.keys())
                    view_history = user_data.get('view_history', {})
                    
                    # Tạo danh sách games với trọng số từ view history
                    view_games_weighted = []
                    for gid, view_count in view_history.items():
                        view_games_weighted.extend([gid] * view_count)
                    
                    interacted_games = favorite_games + purchased_games + view_games_weighted
                    
                    if interacted_games:
                        # Tính similarity với games user đã tương tác
                        similarities = []
                        game_idx = game_id - 1
                        if 0 <= game_idx < len(self.content_similarity_matrix):
                            for interacted_game_id in interacted_games:
                                try:
                                    interacted_idx = int(interacted_game_id) - 1
                                    if 0 <= interacted_idx < len(self.content_similarity_matrix):
                                        sim_score = self.content_similarity_matrix[game_idx][interacted_idx]
                                        similarities.append(sim_score)
                                except (ValueError, TypeError):
                                    continue
                        
                        if similarities:
                            content_score = np.mean(similarities)
                            all_games[game_id]['content_score'] = content_score
        
        # Tính keyword score cho tất cả games
        for game_id in all_games:
            game = next((g for g in self.games_data if g['id'] == game_id), None)
            if game:
                keyword_score = self.get_keyword_score(game, keyword)
                all_games[game_id]['keyword_score'] = keyword_score
        
        # Tìm content score âm lớn nhất để điều chỉnh
        content_scores = [all_games[game_id]['content_score'] for game_id in all_games]
        min_content_score = min(content_scores)
        content_adjustment = 0
        if min_content_score < 0:
            content_adjustment = abs(min_content_score)
            print(f"Adjusting content scores: adding {content_adjustment:.3f} to make all positive")
            print(f"Before adjustment: min={min_content_score:.3f}, max={max(content_scores):.3f}")
        
        # Tính min-max normalization cho SVD scores (giữ nguyên thứ tự)
        svd_scores = [all_games[game_id]['svd_score'] for game_id in all_games if all_games[game_id]['svd_score'] != 0]
        if svd_scores:
            svd_min = min(svd_scores)
            svd_max = max(svd_scores)
            svd_range = svd_max - svd_min
        else:
            svd_min = svd_max = svd_range = 0
        
        # Tính hybrid score (weighted combination)
        for game_id in all_games:
            # Chọn trọng số dựa trên có keyword hay không
            if keyword and keyword.strip():
                weights = WEIGHTS_WITH_KEYWORD
            else:
                weights = WEIGHTS_NO_KEYWORD
            
            svd_weight = weights['svd']
            content_weight = weights['content']
            demographic_weight = weights['demographic']
            keyword_weight = weights['keyword']
            
            svd_score = all_games[game_id]['svd_score']
            content_score = all_games[game_id]['content_score'] + content_adjustment  # Điều chỉnh content score
            demographic_score = all_games[game_id]['demographic_score']
            keyword_score = all_games[game_id]['keyword_score']
            
            # Min-max normalization cho SVD scores (giữ nguyên thứ tự a > b)
            if svd_score != 0 and svd_range > 0:
                svd_normalized = (svd_score - svd_min) / svd_range
            else:
                svd_normalized = 0
            content_normalized = content_score  # Đã được điều chỉnh để dương
            demographic_normalized = demographic_score / 5.0  # Normalize demographic (max = 5) to 0-1
            keyword_normalized = keyword_score  # Already 0-1
            
            # Cập nhật scores đã chuẩn hóa để hiển thị
            all_games[game_id]['svd_score'] = svd_normalized if svd_score != 0 else 0
            all_games[game_id]['content_score'] = content_normalized  # Cập nhật content score đã điều chỉnh
            all_games[game_id]['demographic_score'] = demographic_normalized
            all_games[game_id]['keyword_score'] = keyword_normalized
            
            hybrid_score = (svd_weight * svd_normalized + 
                          content_weight * content_normalized + 
                          demographic_weight * demographic_normalized +
                          keyword_weight * keyword_normalized)
            all_games[game_id]['hybrid_score'] = hybrid_score
            all_games[game_id]['boost_factor'] = 1.0  # Initialize boost factor
        
        # Debug: Kiểm tra content scores sau điều chỉnh
        adjusted_content_scores = [all_games[game_id]['content_score'] for game_id in all_games]
        print(f"After adjustment: min={min(adjusted_content_scores):.3f}, max={max(adjusted_content_scores):.3f}")
        
        # Lọc games đã thích và mua (KHÔNG lọc games đã xem)
        user_data = next((u for u in self.users_data if u['id'] == user_id), None)
        if user_data:
            # Chỉ loại bỏ games đã thích và mua, KHÔNG loại bỏ games đã xem
            favorite_games = set(user_data.get('favorite_games', []))
            purchased_games = set(user_data.get('purchased_games', {}).keys())
            excluded_games = favorite_games.union(purchased_games)
            
            # Chỉ loại bỏ games đã thích và mua
            filtered_games = {game_id: game_data for game_id, game_data in all_games.items() 
                            if game_id not in excluded_games}
        else:
            filtered_games = all_games
        
        # ⭐ ADAPTIVE BOOSTING SYSTEM ⭐
        if enable_adaptive:
            # Phân tích user preferences (có thể filter theo recent_days)
            user_preferences = self.analyze_user_preferences(user_id, recent_days=recent_days)
            
            if user_preferences:
                print(f"\n🎯 Adaptive Preference Boosting Enabled")
                if recent_days:
                    print(f"   Time Window: Last {recent_days} days ⏰")
                else:
                    print(f"   Time Window: All time history")
                print(f"   Top Publishers: {list(user_preferences['publishers'].keys())[:3]}")
                print(f"   Top Genres: {list(user_preferences['genres'].keys())[:3]}")
                print(f"   Price Range: {user_preferences['price_avg']:,.0f} VND (±{user_preferences['price_std']:,.0f})")
                
                # Áp dụng boost cho từng game
                for game_id in filtered_games:
                    game = next((g for g in self.games_data if g['id'] == game_id), None)
                    if game:
                        # Tính boost factor
                        boost_factor = self.calculate_preference_boost(game, user_preferences, debug=False)
                        
                        # Lưu boost factor vào game data
                        filtered_games[game_id]['boost_factor'] = boost_factor
                        
                        # Áp dụng boost vào hybrid score
                        original_score = filtered_games[game_id]['hybrid_score']
                        boosted_score = original_score * boost_factor
                        filtered_games[game_id]['hybrid_score'] = boosted_score
                        filtered_games[game_id]['original_score'] = original_score  # Lưu score gốc để debug
                
                # Tính số games được boost
                boosted_games_count = sum(1 for game_data in filtered_games.values() if game_data.get('boost_factor', 1.0) > 1.0)
                print(f"   ✓ Boosted {boosted_games_count}/{len(filtered_games)} games based on preferences")
        
        # Sắp xếp theo hybrid score (sau khi đã boost)
        sorted_recommendations = sorted(filtered_games.values(), 
                                      key=lambda x: x['hybrid_score'], 
                                      reverse=True)
        
        # ⭐ KHÔNG filter games - chỉ sắp xếp theo hybrid score
        # Games có keyword match sẽ có keyword_score > 0 → hybrid_score cao hơn → tự động lên đầu
        if keyword and keyword.strip():
            matching_count = sum(1 for rec in sorted_recommendations if rec['keyword_score'] > 0)
            print(f"\n🔍 Keyword: '{keyword}' - {matching_count} games match (sorted to top)")
        
        # Thêm link_download và image vào kết quả cuối cùng (fields phụ, không ảnh hưởng dự đoán)
        final_recommendations = sorted_recommendations[:top_n]
        for rec in final_recommendations:
            game = next((g for g in self.games_data if g['id'] == rec['game_id']), None)
            if game:
                rec['link_download'] = game.get('link_download', '')
                rec['image'] = game.get('image', '')
        
        return final_recommendations
    
    def create_scores_chart(self, recommendations, user_data, keyword="", top_n=15):
        """Tạo biểu đồ cột xếp chồng cho điểm số"""
        if not MATPLOTLIB_AVAILABLE:
            print("Matplotlib not available. Skipping chart creation.")
            return None
            
        if not recommendations:
            print("No data to create chart")
            return None
        
        # Get top N games to draw (avoid too crowded)
        top_recs = recommendations[:top_n]
        
        # Prepare data
        game_names = [rec['game_name'] for rec in top_recs]
        svd_scores = [rec.get('svd_score', 0) for rec in top_recs]
        content_scores = [rec.get('content_score', 0) for rec in top_recs]
        demographic_scores = [rec.get('demographic_score', 0) for rec in top_recs]
        keyword_scores = [rec.get('keyword_score', 0) for rec in top_recs]
        
        # Create figure and axis
        fig, ax = plt.subplots(figsize=(16, 10))
        
        # Create positions for bars
        x = np.arange(len(game_names))
        width = 0.8
        
        # Draw stacked bars
        p1 = ax.bar(x, svd_scores, width, label='SVD Score', color='#FF6B6B', alpha=0.8)
        p2 = ax.bar(x, content_scores, width, bottom=svd_scores, label='Content Score', color='#4ECDC4', alpha=0.8)
        
        # Calculate bottom for demographic
        bottom_demo = np.array(svd_scores) + np.array(content_scores)
        p3 = ax.bar(x, demographic_scores, width, bottom=bottom_demo, label='Demographic Score', color='#45B7D1', alpha=0.8)
        
        # Calculate bottom for keyword
        bottom_keyword = bottom_demo + np.array(demographic_scores)
        p4 = ax.bar(x, keyword_scores, width, bottom=bottom_keyword, label='Keyword Score', color='#96CEB4', alpha=0.8)
        
        # Customize chart
        ax.set_xlabel('Games', fontsize=12, fontweight='bold')
        ax.set_ylabel('Scores', fontsize=12, fontweight='bold')
        title = f'Game Recommendation Scores - {user_data["name"]} (ID: {user_data["id"]})\nAge: {user_data["age"]}, Gender: {user_data["gender"]}'
        if keyword:
            title += f' - Keyword: "{keyword}"'
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
        
        # Set game names on x-axis (rotate 45 degrees)
        ax.set_xticks(x)
        ax.set_xticklabels(game_names, rotation=45, ha='right', fontsize=10)
        
        # Add legend
        ax.legend(loc='upper right', fontsize=11)
        
        # Add grid for easier reading
        ax.grid(True, alpha=0.3, axis='y')
        ax.set_axisbelow(True)
        
        # Add score values on each section of the bars
        for i, rec in enumerate(top_recs):
            # SVD Score (bottom section)
            if svd_scores[i] > 0.05:  # Only show if score is significant
                ax.text(i, svd_scores[i] / 2, f'{svd_scores[i]:.3f}', 
                        ha='center', va='center', fontsize=8, fontweight='bold', color='white')
            
            # Content Score (second section)
            if content_scores[i] > 0.05:
                content_center = svd_scores[i] + content_scores[i] / 2
                ax.text(i, content_center, f'{content_scores[i]:.3f}', 
                        ha='center', va='center', fontsize=8, fontweight='bold', color='white')
            
            # Demographic Score (third section)
            if demographic_scores[i] > 0.05:
                demo_center = svd_scores[i] + content_scores[i] + demographic_scores[i] / 2
                ax.text(i, demo_center, f'{demographic_scores[i]:.3f}', 
                        ha='center', va='center', fontsize=8, fontweight='bold', color='white')
            
            # Keyword Score (top section)
            if keyword_scores[i] > 0.05:
                keyword_center = (svd_scores[i] + content_scores[i] + 
                                demographic_scores[i] + keyword_scores[i] / 2)
                ax.text(i, keyword_center, f'{keyword_scores[i]:.3f}', 
                        ha='center', va='center', fontsize=8, fontweight='bold', color='white')
            
            # Hybrid Score (total on top)
            total_height = (svd_scores[i] + content_scores[i] + 
                           demographic_scores[i] + keyword_scores[i])
            hybrid_score = rec.get('hybrid_score', 0)
            ax.text(i, total_height + 0.01, f'Total: {hybrid_score:.3f}', 
                    ha='center', va='bottom', fontsize=9, fontweight='bold', color='black')
        
        # Adjust layout
        plt.tight_layout()
        
        # Display weight information
        if keyword and keyword.strip():
            weights = WEIGHTS_WITH_KEYWORD
            weights_text = (f"Weights: SVD({weights['svd']:.0%}) + "
                           f"Content({weights['content']:.0%}) + "
                           f"Demographic({weights['demographic']:.0%}) + "
                           f"Keyword({weights['keyword']:.0%})")
        else:
            weights = WEIGHTS_NO_KEYWORD
            weights_text = (f"Weights: SVD({weights['svd']:.0%}) + "
                           f"Content({weights['content']:.0%}) + "
                           f"Demographic({weights['demographic']:.0%})")
        
        plt.figtext(0.5, 0.02, weights_text, ha='center', fontsize=10, 
                    style='italic', bbox=dict(boxstyle="round,pad=0.3", facecolor="lightgray", alpha=0.5))
        
        # Save chart
        chart_filename = 'game_scores_chart.png'  # Tên file cố định
        plt.savefig(chart_filename, dpi=300, bbox_inches='tight')
        print(f"Chart saved to: {chart_filename}")
        
        # Close the figure to free memory
        plt.close(fig)
        
        return chart_filename
    
    def create_user_similarity_heatmap(self, user_id, filename=None):
        """Tạo heatmap hiển thị độ tương đồng giữa các users"""
        if not MATPLOTLIB_AVAILABLE:
            print("Matplotlib not available. Skipping heatmap creation.")
            return None
        
        try:
            import seaborn as sns
        except ImportError:
            print("Seaborn not available. Installing...")
            import subprocess
            subprocess.check_call(['pip', 'install', 'seaborn'])
            import seaborn as sns
        
        # Tạo ma trận similarity giữa các users
        user_ids = [user['id'] for user in self.users_data]
        n_users = len(user_ids)
        similarity_matrix = np.zeros((n_users, n_users))
        user_names = [user['name'] for user in self.users_data]
        
        # Tính similarity cho từng cặp user
        for i, user1 in enumerate(self.users_data):
            for j, user2 in enumerate(self.users_data):
                if i == j:
                    similarity_matrix[i][j] = 1.0  # User với chính mình = 1.0
                else:
                    # Tính demographic similarity
                    demo_sim = self.calculate_demographic_similarity(user1, user2)
                    
                    # Tính content similarity (dựa trên games đã tương tác)
                    user1_games = set(user1.get('favorite_games', []) + list(user1.get('purchased_games', {}).keys()))
                    user2_games = set(user2.get('favorite_games', []) + list(user2.get('purchased_games', {}).keys()))
                    
                    # Jaccard similarity cho games
                    if len(user1_games) == 0 and len(user2_games) == 0:
                        game_sim = 0.0
                    else:
                        intersection = len(user1_games.intersection(user2_games))
                        union = len(user1_games.union(user2_games))
                        game_sim = intersection / union if union > 0 else 0.0
                    
                    # Kết hợp demographic và game similarity
                    combined_sim = (demo_sim * 0.6 + game_sim * 0.4)  # Demographic quan trọng hơn
                    similarity_matrix[i][j] = combined_sim
        
        # Tạo heatmap
        plt.figure(figsize=(12, 10))
        
        # Highlight target user
        target_user_idx = next((i for i, user in enumerate(self.users_data) if user['id'] == user_id), 0)
        
        # Tạo mask để highlight target user
        mask = np.zeros_like(similarity_matrix, dtype=bool)
        
        # Tạo heatmap với seaborn
        ax = sns.heatmap(similarity_matrix, 
                        annot=False,  # Không hiển thị số trong ô
                        cmap='RdYlBu_r',
                        xticklabels=[name[:12] for name in user_names],  # Chỉ tên user
                        yticklabels=[name[:12] for name in user_names],  # Chỉ tên user
                        cbar_kws={'label': 'Similarity Score'},
                        square=True,
                        linewidths=0.5)
        
        # Highlight target user row and column
        ax.add_patch(plt.Rectangle((0, target_user_idx), n_users, 1, fill=False, edgecolor='red', lw=3))
        ax.add_patch(plt.Rectangle((target_user_idx, 0), 1, n_users, fill=False, edgecolor='red', lw=3))
        
        # Customize plot
        target_user_data = next((u for u in self.users_data if u['id'] == user_id), None)
        plt.title(f'User Similarity Heatmap - Target: {target_user_data["name"]} (ID: {user_id})\n'
                 f'Age: {target_user_data["age"]}, Gender: {target_user_data["gender"]}', 
                 fontsize=14, fontweight='bold', pad=20)
        
        plt.xlabel('Users', fontsize=12, fontweight='bold')
        plt.ylabel('Users', fontsize=12, fontweight='bold')
        
        # Rotate labels for better readability
        plt.xticks(rotation=45, ha='right')
        plt.yticks(rotation=0)
        
        # Add explanation
        plt.figtext(0.5, 0.02, 'Red borders highlight the target user. Similarity = 0.6×Demographic + 0.4×Game_Overlap', 
                   ha='center', fontsize=10, style='italic',
                   bbox=dict(boxstyle="round,pad=0.3", facecolor="lightgray", alpha=0.5))
        
        # Adjust layout
        plt.tight_layout()
        
        # Save heatmap
        if not filename:
            filename = 'user_similarity_heatmap.png'  # Tên file cố định
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        print(f"User similarity heatmap saved to: {filename}")
        
        # Close figure to free memory
        plt.close()
        
        return filename
        
    def print_user_similarity_analysis(self, user_id):
        """In phân tích chi tiết về user similarity"""
        target_user = next((u for u in self.users_data if u['id'] == user_id), None)
        if not target_user:
            return
        
        # Tính similarity với tất cả users khác
        similarities = []
        target_games = set(target_user.get('favorite_games', []) + list(target_user.get('purchased_games', {}).keys()))
        
        for other_user in self.users_data:
            if other_user['id'] == user_id:
                continue
            
            # Demographic similarity
            demo_sim = self.calculate_demographic_similarity(target_user, other_user)
            
            # Game similarity
            other_games = set(other_user.get('favorite_games', []) + list(other_user.get('purchased_games', {}).keys()))
            if len(target_games) == 0 and len(other_games) == 0:
                game_sim = 0.0
            else:
                intersection = len(target_games.intersection(other_games))
                union = len(target_games.union(other_games))
                game_sim = intersection / union if union > 0 else 0.0
            
            # Combined similarity
            combined_sim = (demo_sim * 0.6 + game_sim * 0.4)
            
            similarities.append({
                'user_id': other_user['id'],
                'name': other_user['name'],
                'age': other_user['age'],
                'gender': other_user['gender'],
                'demo_sim': demo_sim,
                'game_sim': game_sim,
                'combined_sim': combined_sim,
                'common_games': list(target_games.intersection(other_games))
            })
        
        # Sắp xếp theo combined similarity
        similarities.sort(key=lambda x: x['combined_sim'], reverse=True)
        
        print(f"{'Rank':<4} {'User':<15} {'Age':<4} {'Gender':<8} {'Demo':<6} {'Game':<6} {'Total':<6} {'Common Games'}")
        print("-" * 80)
        
        for i, sim in enumerate(similarities[:10], 1):  # Top 10
            common_games_str = str(sim['common_games']) if sim['common_games'] else "[]"
            if len(common_games_str) > 20:
                common_games_str = common_games_str[:17] + "..."
            
            print(f"{i:<4} {sim['name'][:14]:<15} {sim['age']:<4} {sim['gender']:<8} "
                  f"{sim['demo_sim']:<6.3f} {sim['game_sim']:<6.3f} {sim['combined_sim']:<6.3f} {common_games_str}")
        
        return similarities
    
    def create_content_comparison_chart(self, user_id, recommendations, filename=None):
        """Tạo heatmap ma trận so sánh content similarity giữa games được gợi ý và games user đã thích"""
        if not MATPLOTLIB_AVAILABLE:
            print("Matplotlib not available. Skipping content comparison chart creation.")
            return None
        
        try:
            import seaborn as sns
        except ImportError:
            print("Seaborn not available. Installing...")
            import subprocess
            subprocess.check_call(['pip', 'install', 'seaborn'])
            import seaborn as sns
        
        # Lấy thông tin target user
        target_user = next((u for u in self.users_data if u['id'] == user_id), None)
        if not target_user:
            return None
        
        # Lấy games user đã tương tác
        favorite_games = target_user.get('favorite_games', [])
        purchased_games = target_user.get('purchased_games', {})
        interacted_games = favorite_games + purchased_games
        
        if not interacted_games:
            print("User chưa có game nào đã tương tác")
            return None
        
        # Lấy top 10 recommendations để phân tích (nhiều hơn để ma trận đẹp hơn)
        top_recommendations = recommendations[:10]
        
        if not top_recommendations:
            print("Không có recommendations để phân tích")
            return None
        
        # Lấy thông tin chi tiết của games user đã tương tác
        user_game_details = []
        for game_id in set(interacted_games):
            game = next((g for g in self.games_data if g['id'] == game_id), None)
            if game:
                interaction_type = []
                if game_id in favorite_games:
                    interaction_type.append("Favorite")
                if game_id in purchased_games:
                    interaction_type.append("Purchased")
                
                user_game_details.append({
                    'game_id': game_id,
                    'game_name': game['name'],
                    'interaction_icon': ''.join(interaction_type),
                    'rating': game.get('rating', 0)
                })
        
        if not user_game_details:
            print("Không có dữ liệu games user đã tương tác")
            return None
        
        # Tạo similarity matrix
        n_recommended = len(top_recommendations)
        n_user_games = len(user_game_details)
        similarity_matrix = np.zeros((n_recommended, n_user_games))
        
        # Tính similarity cho từng cặp
        for i, rec in enumerate(top_recommendations):
            for j, user_game in enumerate(user_game_details):
                sim_score = self.content_similarity_matrix[rec['game_id'] - 1][user_game['game_id'] - 1]
                similarity_matrix[i][j] = sim_score
        
        # Tạo labels cho trục
        recommended_labels = [f"{i+1}. {rec['game_name'][:25]}" for i, rec in enumerate(top_recommendations)]
        user_game_labels = [f"{game['game_name'][:20]} {game['interaction_icon']}" for game in user_game_details]
        
        # Tính average similarity cho mỗi recommended game để thêm vào label
        avg_similarities = np.mean(similarity_matrix, axis=1)
        recommended_labels_with_avg = [f"{label} (Avg: {avg:.2f})" for label, avg in zip(recommended_labels, avg_similarities)]
        
        # Tạo figure với kích thước tối ưu
        fig_height = max(8, n_recommended * 0.6)
        fig_width = max(10, n_user_games * 0.8)
        plt.figure(figsize=(fig_width, fig_height))
        
        # Tạo heatmap với seaborn
        ax = sns.heatmap(similarity_matrix,
                        annot=True,  # Hiển thị giá trị
                        fmt='.2f',   # Format 2 chữ số thập phân
                        cmap='RdYlGn',  # Màu: Đỏ (thấp) -> Vàng (trung bình) -> Xanh (cao)
                        xticklabels=user_game_labels,
                        yticklabels=recommended_labels_with_avg,
                        cbar_kws={'label': 'Content Similarity Score', 'shrink': 0.8},
                        linewidths=1,
                        linecolor='white',
                        vmin=0,
                        vmax=1,
                        annot_kws={'fontsize': 9, 'fontweight': 'bold'})
        
        # Customize colorbar
        cbar = ax.collections[0].colorbar
        cbar.ax.tick_params(labelsize=10)
        
        # Customize plot
        plt.title(f'Content Similarity Heatmap: Recommended Games vs User\'s Favorites\n'
                 f'User: {target_user["name"]} (ID: {user_id}) | Age: {target_user["age"]}, Gender: {target_user["gender"]}',
                 fontsize=15, fontweight='bold', pad=20, color='#2C3E50')
        
        plt.xlabel('User\'s Favorite/Purchased Games', fontsize=13, fontweight='bold', color='#2C3E50')
        plt.ylabel('Top Recommended Games', fontsize=13, fontweight='bold', color='#2C3E50')
        
        # Rotate labels
        plt.xticks(rotation=45, ha='right', fontsize=10)
        plt.yticks(rotation=0, fontsize=10)
        
        # Adjust layout
        plt.tight_layout(rect=[0, 0.03, 1, 1])
        
        # Save chart
        if not filename:
            filename = 'content_comparison_chart.png'
        plt.savefig(filename, dpi=300, bbox_inches='tight', facecolor='white')
        print(f"Content similarity heatmap saved to: {filename}")
        
        # Close figure
        plt.close()
        
        return filename

    def create_user_game_relationship_chart(self, user_id, recommendations, filename=None):
        """Tạo biểu đồ thể hiện mối quan hệ giữa user similarity và games được gợi ý"""
        if not MATPLOTLIB_AVAILABLE:
            print("Matplotlib not available. Skipping relationship chart creation.")
            return None
        
        # Lấy thông tin target user
        target_user = next((u for u in self.users_data if u['id'] == user_id), None)
        if not target_user:
            return None
        
        # Tính similarity với tất cả users
        user_similarities = self.print_user_similarity_analysis(user_id)
        
        # Lấy top games có demographic score cao
        demo_games = [rec for rec in recommendations if rec.get('demographic_score', 0) > 0][:10]
        
        if not demo_games or not user_similarities:
            print("Not enough data for relationship chart")
            return None
        
        # Tạo figure với subplots
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
        
        # === SUBPLOT 1: User Similarity Ranking ===
        top_users = user_similarities[:8]  # Top 8 similar users
        user_names = [sim['name'][:10] for sim in top_users]
        similarities = [sim['combined_sim'] for sim in top_users]
        
        bars1 = ax1.barh(user_names, similarities, color='skyblue', alpha=0.7)
        ax1.set_xlabel('Similarity Score')
        ax1.set_title('Top Similar Users to Target User', fontweight='bold')
        ax1.set_xlim(0, 1)
        
        # Add value labels
        for i, (bar, sim) in enumerate(zip(bars1, similarities)):
            ax1.text(sim + 0.02, i, f'{sim:.3f}', va='center', fontsize=9)
        
        # === SUBPLOT 2: Games with High Demographic Score ===
        game_names = [game['game_name'][:15] for game in demo_games]
        demo_scores = [game.get('demographic_score', 0) for game in demo_games]
        
        bars2 = ax2.barh(game_names, demo_scores, color='lightcoral', alpha=0.7)
        ax2.set_xlabel('Demographic Score')
        ax2.set_title('Games with High Demographic Score', fontweight='bold')
        
        # Add value labels
        for i, (bar, score) in enumerate(zip(bars2, demo_scores)):
            ax2.text(score + 0.01, i, f'{score:.3f}', va='center', fontsize=9)
        
        # === SUBPLOT 3: User-Game Connection Matrix ===
        # Tạo ma trận showing which similar users like which recommended games
        connection_matrix = np.zeros((len(top_users), len(demo_games)))
        
        for i, user_sim in enumerate(top_users):
            other_user = next((u for u in self.users_data if u['id'] == user_sim['user_id']), None)
            if other_user:
                user_games = set(other_user.get('favorite_games', []) + list(other_user.get('purchased_games', {}).keys()))
                for j, game in enumerate(demo_games):
                    if game['game_id'] in user_games:
                        connection_matrix[i][j] = 1
        
        im = ax3.imshow(connection_matrix, cmap='RdYlBu_r', aspect='auto')
        ax3.set_xticks(range(len(demo_games)))
        ax3.set_xticklabels([game['game_name'][:10] for game in demo_games], rotation=45, ha='right')
        ax3.set_yticks(range(len(top_users)))
        ax3.set_yticklabels([sim['name'][:10] for sim in top_users])
        ax3.set_title('User-Game Interaction Matrix\n(1=Liked/Purchased, 0=No interaction)', fontweight='bold')
        
        # Add text annotations
        for i in range(len(top_users)):
            for j in range(len(demo_games)):
                text = ax3.text(j, i, int(connection_matrix[i, j]), 
                              ha="center", va="center", color="black", fontweight='bold')
        
        # === SUBPLOT 4: Correlation Analysis ===
        # Scatter plot: User similarity vs Game demographic score
        scatter_data = []
        for user_sim in top_users:
            other_user = next((u for u in self.users_data if u['id'] == user_sim['user_id']), None)
            if other_user:
                user_games = set(other_user.get('favorite_games', []) + list(other_user.get('purchased_games', {}).keys()))
                for game in demo_games:
                    if game['game_id'] in user_games:
                        scatter_data.append({
                            'user_sim': user_sim['combined_sim'],
                            'demo_score': game.get('demographic_score', 0),
                            'user_name': user_sim['name'][:8],
                            'game_name': game['game_name'][:8]
                        })
        
        if scatter_data:
            x_vals = [d['user_sim'] for d in scatter_data]
            y_vals = [d['demo_score'] for d in scatter_data]
            
            ax4.scatter(x_vals, y_vals, alpha=0.6, s=100, c='purple')
            ax4.set_xlabel('User Similarity Score')
            ax4.set_ylabel('Game Demographic Score')
            ax4.set_title('Correlation: User Similarity ↔ Game Demo Score', fontweight='bold')
            
            # Add trend line
            if len(x_vals) > 1:
                z = np.polyfit(x_vals, y_vals, 1)
                p = np.poly1d(z)
                ax4.plot(sorted(x_vals), p(sorted(x_vals)), "r--", alpha=0.8, linewidth=2)
                
                # Calculate correlation
                correlation = np.corrcoef(x_vals, y_vals)[0,1]
                ax4.text(0.05, 0.95, f'Correlation: {correlation:.3f}', 
                        transform=ax4.transAxes, fontsize=10, 
                        bbox=dict(boxstyle="round,pad=0.3", facecolor="yellow", alpha=0.7))
        
        # Overall title
        fig.suptitle(f'User-Game Relationship Analysis - {target_user["name"]} (ID: {user_id})\n'
                    f'Age: {target_user["age"]}, Gender: {target_user["gender"]}', 
                    fontsize=16, fontweight='bold')
        
        # Adjust layout
        plt.tight_layout()
        plt.subplots_adjust(top=0.9)
        
        # Save chart
        if not filename:
            filename = 'user_game_relationship.png'
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        print(f"User-Game relationship chart saved to: {filename}")
        
        # Close figure
        plt.close(fig)
        
        return filename
    
    def export_scores_to_txt(self, recommendations, user_data, keyword="", filename=None):
        """Xuất điểm số ra file txt với định dạng bảng"""
        if not filename:
            filename = "scores_table.txt"  # Tên file cố định
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                # Header thông tin user
                f.write("=" * 100 + "\n")
                f.write(f"GAME RECOMMENDATION SCORES - {user_data['name']} (ID: {user_data['id']})\n")
                f.write(f"Age: {user_data['age']}, Gender: {user_data['gender']}\n")
                if keyword:
                    f.write(f"Search Keyword: '{keyword}'\n")
                f.write("=" * 100 + "\n\n")
                
                # Hiển thị trọng số
                if keyword and keyword.strip():
                    weights = WEIGHTS_WITH_KEYWORD
                    f.write(f"WEIGHTS: SVD({weights['svd']:.0%}) + Content({weights['content']:.0%}) + ")
                    f.write(f"Demographic({weights['demographic']:.0%}) + Keyword({weights['keyword']:.0%})\n")
                else:
                    weights = WEIGHTS_NO_KEYWORD
                    f.write(f"WEIGHTS: SVD({weights['svd']:.0%}) + Content({weights['content']:.0%}) + ")
                    f.write(f"Demographic({weights['demographic']:.0%})\n")
                f.write("-" * 100 + "\n\n")
                
                # Header bảng
                f.write(f"{'Rank':<4} {'Game Name':<30} {'Hybrid':<8} {'SVD':<8} {'Content':<8} {'Demo':<8} {'Keyword':<8} {'Rating':<8} {'Price':<12} {'Downloads':<12}\n")
                f.write("-" * 120 + "\n")
                
                # Dữ liệu từng game
                for i, rec in enumerate(recommendations, 1):
                    game_name = rec['game_name'][:29]  # Cắt tên game nếu quá dài
                    hybrid_score = rec.get('hybrid_score', 0)
                    svd_score = rec.get('svd_score', 0)
                    content_score = rec.get('content_score', 0)
                    demographic_score = rec.get('demographic_score', 0)
                    keyword_score = rec.get('keyword_score', 0)
                    rating = rec.get('actual_rating', 0)
                    price = rec.get('price', 0)
                    downloads = rec.get('downloads', 0)
                    
                    f.write(f"{i:<4} {game_name:<30} {hybrid_score:<8.3f} {svd_score:<8.3f} ")
                    f.write(f"{content_score:<8.3f} {demographic_score:<8.3f} {keyword_score:<8.3f} ")
                    f.write(f"{rating:<8.1f} {price:<12,} {downloads:<12,}\n")
                
                f.write("-" * 100 + "\n")
                f.write(f"Total games: {len(recommendations)}\n")
                
                # Thống kê điểm số
                f.write("\n" + "=" * 50 + "\n")
                f.write("SCORE STATISTICS\n")
                f.write("=" * 50 + "\n")
                
                hybrid_scores = [rec.get('hybrid_score', 0) for rec in recommendations]
                svd_scores = [rec.get('svd_score', 0) for rec in recommendations if rec.get('svd_score', 0) > 0]
                content_scores = [rec.get('content_score', 0) for rec in recommendations if rec.get('content_score', 0) > 0]
                demo_scores = [rec.get('demographic_score', 0) for rec in recommendations if rec.get('demographic_score', 0) > 0]
                keyword_scores = [rec.get('keyword_score', 0) for rec in recommendations if rec.get('keyword_score', 0) > 0]
                
                f.write(f"Hybrid Score    - Max: {max(hybrid_scores):.3f}, Min: {min(hybrid_scores):.3f}, Avg: {sum(hybrid_scores)/len(hybrid_scores):.3f}\n")
                if svd_scores:
                    f.write(f"SVD Score       - Max: {max(svd_scores):.3f}, Min: {min(svd_scores):.3f}, Avg: {sum(svd_scores)/len(svd_scores):.3f}\n")
                if content_scores:
                    f.write(f"Content Score   - Max: {max(content_scores):.3f}, Min: {min(content_scores):.3f}, Avg: {sum(content_scores)/len(content_scores):.3f}\n")
                if demo_scores:
                    f.write(f"Demo Score      - Max: {max(demo_scores):.3f}, Min: {min(demo_scores):.3f}, Avg: {sum(demo_scores)/len(demo_scores):.3f}\n")
                if keyword_scores:
                    f.write(f"Keyword Score   - Max: {max(keyword_scores):.3f}, Min: {min(keyword_scores):.3f}, Avg: {sum(keyword_scores)/len(keyword_scores):.3f}\n")
                
                # Top games theo từng loại điểm
                f.write("\n" + "=" * 50 + "\n")
                f.write("TOP 5 GAMES BY SCORE TYPE\n")
                f.write("=" * 50 + "\n")
                
                # Top Hybrid
                f.write("Top 5 Hybrid Score:\n")
                top_hybrid = sorted(recommendations, key=lambda x: x.get('hybrid_score', 0), reverse=True)[:5]
                for i, rec in enumerate(top_hybrid, 1):
                    f.write(f"  {i}. {rec['game_name']} - {rec.get('hybrid_score', 0):.3f}\n")
                
                # Top SVD
                if svd_scores:
                    f.write("\nTop 5 SVD Score:\n")
                    top_svd = sorted([r for r in recommendations if r.get('svd_score', 0) > 0], 
                                   key=lambda x: x.get('svd_score', 0), reverse=True)[:5]
                    for i, rec in enumerate(top_svd, 1):
                        f.write(f"  {i}. {rec['game_name']} - {rec.get('svd_score', 0):.3f}\n")
                
                # Top Content
                if content_scores:
                    f.write("\nTop 5 Content Score:\n")
                    top_content = sorted([r for r in recommendations if r.get('content_score', 0) > 0], 
                                       key=lambda x: x.get('content_score', 0), reverse=True)[:5]
                    for i, rec in enumerate(top_content, 1):
                        f.write(f"  {i}. {rec['game_name']} - {rec.get('content_score', 0):.3f}\n")
                
                # Top Keyword (nếu có)
                if keyword_scores:
                    f.write("\nTop 5 Keyword Score:\n")
                    top_keyword = sorted([r for r in recommendations if r.get('keyword_score', 0) > 0], 
                                       key=lambda x: x.get('keyword_score', 0), reverse=True)[:5]
                    for i, rec in enumerate(top_keyword, 1):
                        f.write(f"  {i}. {rec['game_name']} - {rec.get('keyword_score', 0):.3f}\n")
                
                f.write("\n" + "=" * 100 + "\n")
                f.write("Generated by Game Recommendation System\n")
                f.write("=" * 100 + "\n")
            
            print(f"Scores table exported to: {filename}")
            return filename
            
        except Exception as e:
            print(f"Error exporting scores table: {e}")
            return None
    def export_recommendations_to_json(self, recommendations, user_data, keyword="", filename=None):
        """Xuất recommendations ra file JSON"""
        import json
        from datetime import datetime
        
        # Tạo tên file cố định (ghi đè mỗi lần)
        if not filename:
            filename = "recommendations.json"
        
        # Chuẩn bị dữ liệu xuất - chỉ games
        games_list = []
        
        # Thêm thông tin đầy đủ của từng game (bao gồm cả score)
        for rec in recommendations:
            # Tìm thông tin đầy đủ của game từ database
            game_full_info = next((g for g in self.games_data if g['id'] == rec['game_id']), None)
            
            game_info = {
                "id": rec['game_id'],
                "name": rec['game_name'],
                "description": game_full_info.get('description', '') if game_full_info else '',
                "rating": rec['actual_rating'],
                "release_date": game_full_info.get('release_date', '2020-01-01') if game_full_info else '2020-01-01',
                "publisher": game_full_info.get('publisher', '') if game_full_info else '',
                "genre": rec['genre'],
                "mode": game_full_info.get('mode', '') if game_full_info else '',
                "price": rec['price'],
                "downloads": rec.get('downloads', 0),
                "min_spec": {k: v for k, v in (game_full_info.get('min_spec', {}) if game_full_info else {}).items() if k != 'storage'},
                "rec_spec": {k: v for k, v in (game_full_info.get('rec_spec', {}) if game_full_info else {}).items() if k != 'storage'},
                "multiplayer": game_full_info.get('multiplayer', False) if game_full_info else False,
                "capacity": game_full_info.get('capacity', 0) if game_full_info else 0,
                "age_rating": game_full_info.get('age_rating', '') if game_full_info else '',
                "platform": game_full_info.get('platform', []) if game_full_info else [],
                "language": game_full_info.get('language', []) if game_full_info else [],
                "link_download": rec.get('link_download', ''),
                "image": game_full_info.get('image', '') if game_full_info else '',
                "score": rec.get('hybrid_score', 0)  # Thêm AI recommendation score
            }
            
            games_list.append(game_info)
        
        # Dữ liệu xuất chỉ có games
        export_data = {
            "games": games_list
        }
        
        # Xuất ra file JSON
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, ensure_ascii=False, indent=2)
            print(f"Da xuat {len(recommendations)} recommendations ra file: {filename}")
            return filename
        except Exception as e:
            print(f"Loi khi xuat file JSON: {e}")
            return None
    
    def display_recommendations(self, recommendations, title="Game Recommendations", keyword=""):
        """Hien thi recommendations"""
        print(f"\n{title}")
        print("=" * 60)
        
        # Hiển thị thông tin trọng số
        if keyword and keyword.strip():
            weights = WEIGHTS_WITH_KEYWORD
            print(f"Weights: SVD({weights['svd']:.0%}) + Content({weights['content']:.0%}) + Demographic({weights['demographic']:.0%}) + Keyword({weights['keyword']:.0%})")
        else:
            weights = WEIGHTS_NO_KEYWORD
            print(f"Weights: SVD({weights['svd']:.0%}) + Content({weights['content']:.0%}) + Demographic({weights['demographic']:.0%})")
        
        # Hiển thị top games có boost cao nhất
        boosted_recs = [rec for rec in recommendations if rec.get('boost_factor', 1.0) > 1.0]
        if boosted_recs:
            top_boosted = sorted(boosted_recs, key=lambda x: x.get('boost_factor', 1.0), reverse=True)[:3]
            print(f"\n🚀 Top Boosted Games (by user preferences):")
            for i, rec in enumerate(top_boosted, 1):
                boost = rec.get('boost_factor', 1.0)
                original = rec.get('original_score', rec.get('hybrid_score', 0))
                print(f"   {i}. {rec['game_name'][:30]} - Boost: {boost:.2f}x (Score: {original:.3f} → {rec.get('hybrid_score', 0):.3f})")
        
        print("=" * 60)
        
        if not recommendations:
            print("Khong co goi y nao duoc tim thay.")
            return
        
        # Hiển thị top 10 recommendations
        top_display = min(10, len(recommendations))
        for i, rec in enumerate(recommendations[:top_display], 1):
            boost_indicator = ""
            if rec.get('boost_factor', 1.0) > 1.0:
                boost_indicator = f" 🚀x{rec.get('boost_factor', 1.0):.2f}"
            
            print(f"\n{i}. {rec['game_name']}{boost_indicator}")
            print(f"   Rating: {rec['actual_rating']}/5.0")
            print(f"   Genre: {', '.join(rec['genre'])}")
            print(f"   Price: {rec['price']:,} VND")
            print(f"   Downloads: {rec.get('downloads', 0):,}")
            
            if 'hybrid_score' in rec:
                print(f"   Hybrid Score: {rec['hybrid_score']:.3f}", end="")
                if rec.get('original_score') and rec.get('boost_factor', 1.0) > 1.0:
                    print(f" (boosted from {rec.get('original_score', 0):.3f})")
                else:
                    print()
            if 'svd_score' in rec and rec['svd_score'] != 0:
                print(f"   SVD Score: {rec['svd_score']:.3f}")
            if 'content_score' in rec and rec['content_score'] != 0:
                print(f"   Content Score: {rec['content_score']:.3f}")
            if 'demographic_score' in rec:
                print(f"   Demographic Score: {rec['demographic_score']:.3f}")
            if 'keyword_score' in rec and rec['keyword_score'] > 0:
                print(f"   Keyword Score: {rec['keyword_score']:.3f}")
            
            print("-" * 40)
        
        if len(recommendations) > top_display:
            print(f"\n... và {len(recommendations) - top_display} games khác (xem trong file JSON)")

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
        print(f"Game da mua: {user_data.get('purchased_games', {})}")
        view_history = user_data.get('view_history', {})
        if view_history:
            view_str = ", ".join([f"Game {k}({v} lần)" for k, v in view_history.items()])
            print(f"Lich su xem: {view_str}")
        else:
            print("Lich su xem: []")
        
        # Lay tat ca games chua tuong tac
        view_history = user_data.get('view_history', {})
        interacted_games = set(user_data.get('favorite_games', []) + 
                             list(user_data.get('purchased_games', {}).keys()) +
                             list(view_history.keys()))
        total_games = len(recommender.games_data)
        available_games = total_games - len(interacted_games)
        
        print(f"So game co the goi y: {available_games}")
        
        # Nhap keyword tu nguoi dung
        keyword = input(f"\nNhap tu khoa tim kiem cho {user_data['name']} (Enter de bo qua): ").strip()
        
        # Lay recommendations (tat ca games chua tuong tac)
        recommendations = recommender.get_hybrid_recommendations(
            user_id=user_id,
            top_n=available_games,  # Lay tat ca
            keyword=keyword
        )
        
        # Hien thi ket qua
        recommender.display_recommendations(recommendations, f"DANH SACH GOI Y CHO {user_data['name']}", keyword)
        
        print("\n" + "-"*60)

def show_all_recommendations_with_query(recommender, query="", generate_charts=0, enable_adaptive=True):
    """Hien thi goi y cho tat ca users voi query"""
    print("\n" + "="*60)
    if query:
        print(f"GAME RECOMMENDATION SYSTEM - Keyword: '{query}'")
    else:
        print("GAME RECOMMENDATION SYSTEM - SVD Algorithm")
    if enable_adaptive:
        print(f"Adaptive Boosting: ENABLED ✓")
    else:
        print(f"Adaptive Boosting: DISABLED")
    print("="*60)
    
    # Hien thi goi y cho tat ca users
    for user_id in [1, 2, 3]:
        user_data = next((u for u in recommender.users_data if u['id'] == user_id), None)
        if not user_data:
            continue
            
        print(f"\n" + "="*60)
        print(f"GOI Y CHO: {user_data['name']} (ID: {user_id})")
        if query:
            print(f"Tim kiem: '{query}'")
        print("="*60)
        
        # Hien thi thong tin user
        print(f"Tuoi: {user_data['age']}, Gioi tinh: {user_data['gender']}")
        print(f"Game yeu thich: {user_data.get('favorite_games', [])}")
        print(f"Game da mua: {user_data.get('purchased_games', {})}")
        view_history = user_data.get('view_history', {})
        if view_history:
            view_str = ", ".join([f"Game {k}({v} lần)" for k, v in view_history.items()])
            print(f"Lich su xem: {view_str}")
        else:
            print("Lich su xem: []")
        
        # Lay tat ca games chua tuong tac
        view_history = user_data.get('view_history', {})
        interacted_games = set(user_data.get('favorite_games', []) + 
                             list(user_data.get('purchased_games', {}).keys()) +
                             list(view_history.keys()))
        total_games = len(recommender.games_data)
        available_games = total_games - len(interacted_games)
        
        print(f"So game co the goi y: {available_games}")
        
        # Lay recommendations
        recommendations = recommender.get_hybrid_recommendations(
            user_id=user_id,
            top_n=available_games,
            keyword=query,
            enable_adaptive=enable_adaptive
        )
        
        # Hien thi ket qua
        title = f"DANH SACH GOI Y CHO {user_data['name']}"
        if query:
            title += f" - Keyword: '{query}'"
        recommender.display_recommendations(recommendations, title, query)
        
        print("\n" + "-"*60)

def show_recommendations_for_user(recommender, user_id, query="", generate_charts=0, enable_adaptive=True):
    """Hien thi goi y cho 1 user cu the"""
    user_data = next((u for u in recommender.users_data if u['id'] == user_id), None)
    if not user_data:
        print(f"Khong tim thay user ID: {user_id}")
        return
    
    print(f"\n" + "="*60)
    print(f"GOI Y CHO: {user_data['name']} (ID: {user_id})")
    if query:
        print(f"Tim kiem: '{query}'")
    if enable_adaptive:
        print(f"Adaptive Boosting: ENABLED ✓")
    else:
        print(f"Adaptive Boosting: DISABLED")
    print("="*60)
    
    # Hien thi thong tin user
    print(f"Tuoi: {user_data['age']}, Gioi tinh: {user_data['gender']}")
    print(f"Game yeu thich: {user_data.get('favorite_games', [])}")
    print(f"Game da mua: {user_data.get('purchased_games', {})}")
    view_history = user_data.get('view_history', {})
    if view_history:
        view_str = ", ".join([f"Game {k}({v} lần)" for k, v in view_history.items()])
        print(f"Lich su xem: {view_str}")
    else:
        print("Lich su xem: []")
    
    # Lay tat ca games chua tuong tac (chỉ loại bỏ favorite và purchased)
    favorite_games = set(user_data.get('favorite_games', []))
    purchased_games = set(user_data.get('purchased_games', {}).keys())
    excluded_games = favorite_games.union(purchased_games)
    total_games = len(recommender.games_data)
    available_games = total_games - len(excluded_games)
    
    print(f"So game co the goi y: {available_games}")
    
    # Lay recommendations
    recommendations = recommender.get_hybrid_recommendations(
        user_id=user_id,
        top_n=available_games,  # Lay tat ca games co the goi y
        keyword=query,
        enable_adaptive=enable_adaptive
    )
    
    # Tạo biểu đồ và bảng điểm chỉ khi được yêu cầu (generate_charts=1)
    chart_file = None
    heatmap_file = None
    content_comparison_file = None
    relationship_file = None
    txt_file = None
    
    if generate_charts == 1:
        # Tạo biểu đồ trước khi xuất JSON
        print(f"\nCreating scores visualization chart...")
        chart_file = recommender.create_scores_chart(recommendations, user_data, query, top_n=15)
        
        # Tạo user similarity heatmap
        print(f"Creating user similarity heatmap...")
        heatmap_file = recommender.create_user_similarity_heatmap(user_id)
        
        # In phân tích user similarity
        recommender.print_user_similarity_analysis(user_id)
        
        # Tạo content comparison chart
        print(f"Creating content comparison chart...")
        content_comparison_file = recommender.create_content_comparison_chart(user_id, recommendations)
        
        # Tạo user-game relationship chart
        print(f"Creating user-game relationship chart...")
        relationship_file = recommender.create_user_game_relationship_chart(user_id, recommendations)
        
        # Xuất bảng điểm số ra file txt
        print(f"Exporting scores table to txt file...")
        txt_file = recommender.export_scores_to_txt(recommendations, user_data, query)
    else:
        print(f"\nSkipping chart generation (--chart 0)...")
    
    # Xuất kết quả ra JSON và hiển thị thông tin
    title = f"DANH SACH GOI Y CHO {user_data['name']}"
    if query:
        title += f" - Keyword: '{query}'"
    
    # Xuất ra file JSON
    json_file = recommender.export_recommendations_to_json(recommendations, user_data, query)
    
    # Vẫn hiển thị summary trên terminal
    print(f"\n{title}")
    print("="*60)
    print(f"User: {user_data['name']} (ID: {user_data['id']})")
    print(f"Age: {user_data['age']}, Gender: {user_data['gender']}")
    print(f"Total recommendations: {len(recommendations)}")
    if json_file:
        print(f"Results exported to: {json_file}")
    if txt_file:
        print(f"Scores table exported to: {txt_file}")
    if chart_file:
        print(f"Scores chart saved to: {chart_file}")
    if heatmap_file:
        print(f"User similarity heatmap saved to: {heatmap_file}")
    if content_comparison_file:
        print(f"Content comparison chart saved to: {content_comparison_file}")
    if relationship_file:
        print(f"User-game relationship chart saved to: {relationship_file}")
    print("="*60)

def main():
    """Ham main de chay he thong"""
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Game Recommendation System using SVD')
    parser.add_argument('--query', type=str, default='', help='Search keyword for games')
    parser.add_argument('--user', type=int, default=None, help='Specific user ID (1-3)')
    parser.add_argument('--chart', type=int, default=0, choices=[0, 1], help='Generate charts (0=No, 1=Yes). Default: 0')
    parser.add_argument('--adaptive', type=int, default=1, choices=[0, 1], help='Enable adaptive preference boosting (0=No, 1=Yes). Default: 1')
    args = parser.parse_args()
    
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
    
    # Hien thi ket qua cho tat ca users hoac user cu the
    enable_adaptive = bool(args.adaptive)
    if args.user:
        show_recommendations_for_user(recommender, args.user, args.query, generate_charts=args.chart, enable_adaptive=enable_adaptive)
    else:
        show_all_recommendations_with_query(recommender, args.query, generate_charts=args.chart, enable_adaptive=enable_adaptive)
    
    print("\nHoan thanh! He thong da tao goi y cho tat ca nguoi dung.")
    return recommender

if __name__ == "__main__":
    recommender = main()
