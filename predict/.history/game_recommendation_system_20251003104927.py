import json
import numpy as np
import pandas as pd
from scipy.sparse.linalg import svds
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# Import matplotlib for visualization
try:
    import matplotlib.pyplot as plt
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False
    print("Warning: matplotlib not available. Charts will be skipped.")

# ===== GLOBAL RATING CONFIGURATIONS =====
# Điểm số cho các loại tương tác
FAVORITE_RATING = 5.0      # Điểm cho games user thích
PURCHASED_RATING = 3.0     # Điểm cho games user đã mua
NOT_INTERACTED_RATING = 0.0 # Điểm cho games chưa tương tác

# ===== GLOBAL WEIGHT CONFIGURATIONS =====
# Trọng số khi KHÔNG có keyword
WEIGHTS_NO_KEYWORD = {
    'svd': 0.45,        # SVD là quan trọng nhất
    'content': 0.35,    # Content-based thứ 2
    'demographic': 0.20, # Demographic thứ 3
    'keyword': 0.0      # Không có keyword
}

# Trọng số khi CÓ keyword
WEIGHTS_WITH_KEYWORD = {
    'svd': 0.35,        # Giảm SVD để nhường chỗ cho keyword
    'content': 0.25,    # Giảm Content
    'demographic': 0.15, # Giảm Demographic
    'keyword': 0.25     # Keyword chiếm 25%
}

# Kiểm tra tổng trọng số = 1.0
assert sum(WEIGHTS_NO_KEYWORD.values()) == 1.0, "Tổng trọng số không có keyword phải = 1.0"
assert sum(WEIGHTS_WITH_KEYWORD.values()) == 1.0, "Tổng trọng số có keyword phải = 1.0"

def update_rating_scores(favorite_rating=None, purchased_rating=None, not_interacted_rating=None):
    """Cập nhật điểm số cho các loại tương tác"""
    global FAVORITE_RATING, PURCHASED_RATING, NOT_INTERACTED_RATING
    
    if favorite_rating is not None:
        FAVORITE_RATING = favorite_rating
    if purchased_rating is not None:
        PURCHASED_RATING = purchased_rating
    if not_interacted_rating is not None:
        NOT_INTERACTED_RATING = not_interacted_rating
    
    print(f"Đã cập nhật điểm số:")
    print(f"  Favorite Rating: {FAVORITE_RATING}")
    print(f"  Purchased Rating: {PURCHASED_RATING}")
    print(f"  Not Interacted Rating: {NOT_INTERACTED_RATING}")

def update_weights(weights_no_keyword=None, weights_with_keyword=None):
    """Cập nhật trọng số cho hybrid scoring"""
    global WEIGHTS_NO_KEYWORD, WEIGHTS_WITH_KEYWORD
    
    if weights_no_keyword is not None:
        WEIGHTS_NO_KEYWORD = weights_no_keyword
    if weights_with_keyword is not None:
        WEIGHTS_WITH_KEYWORD = weights_with_keyword
    
    print(f"Đã cập nhật trọng số:")
    print(f"  Weights No Keyword: {WEIGHTS_NO_KEYWORD}")
    print(f"  Weights With Keyword: {WEIGHTS_WITH_KEYWORD}")

def show_current_config():
    """Hiển thị cấu hình hiện tại"""
    print("\n" + "="*60)
    print("CẤU HÌNH HỆ THỐNG HIỆN TẠI")
    print("="*60)
    print(f"Điểm số tương tác:")
    print(f"  Favorite Rating: {FAVORITE_RATING}")
    print(f"  Purchased Rating: {PURCHASED_RATING}")
    print(f"  Not Interacted Rating: {NOT_INTERACTED_RATING}")
    print(f"  Trùng lặp (Favorite + Purchased): {FAVORITE_RATING + PURCHASED_RATING}")
    print()
    print(f"Trọng số Hybrid Scoring:")
    print(f"  Không có keyword: {WEIGHTS_NO_KEYWORD}")
    print(f"  Có keyword: {WEIGHTS_WITH_KEYWORD}")
    print("="*60)

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
        
        # Tạo rating matrix từ favorite_games (implicit feedback)
        # Giả sử: favorite = 5, purchased but not favorite = 3, not purchased = 0
        user_game_ratings = []
        
        for user in self.users_data:
            user_id = user['id']
            favorites = user.get('favorite_games', [])
            purchased = user.get('purchased_games', [])
            
            for game in self.games_data:
                game_id = game['id']
                rating = 0.0
                
                # Tính điểm cộng dồn cho trường hợp trùng lặp
                if game_id in favorites:
                    rating += FAVORITE_RATING  # Favorite games
                if game_id in purchased:
                    rating += PURCHASED_RATING  # Purchased games
                
                # Nếu vừa favorite vừa purchased = FAVORITE_RATING + PURCHASED_RATING
                
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
        """Xây dựng ma trận tương đồng content-based với nhiều thuộc tính"""
        try:
            from sklearn.preprocessing import StandardScaler
            import numpy as np
            
            # Tạo features kết hợp text và số
            text_features = []
            numeric_features = []
            
            for game in self.games_data:
                # === TEXT FEATURES với trọng số cao cho GENRE ===
                # Tăng trọng số cho genre bằng cách lặp lại nhiều lần
                genre_list = game.get('genre', [])
                genre_str = ' '.join(genre_list)
                # Lặp lại genre 3 lần để tăng trọng số
                genre_weighted = ' '.join([genre_str] * 3)
                
                # Các thuộc tính khác với trọng số thấp hơn
                publisher = game.get('publisher', '')
                age_rating = game.get('age_rating', '')
                platform_str = ' '.join(game.get('platform', []))
                mode = game.get('mode', '')
                multiplayer = 'multiplayer' if game.get('multiplayer', False) else 'singleplayer'
                language_str = ' '.join(game.get('language', []))
                
                # Kết hợp với trọng số: Genre (3x), các thuộc tính khác (1x)
                text_feature = f"{genre_weighted} {publisher} {age_rating} {platform_str} {mode} {multiplayer} {language_str}"
                text_features.append(text_feature)
                
                # === NUMERIC FEATURES với trọng số thấp ===
                # Giảm trọng số cho technical specs bằng cách chia cho hệ số
                tech_weight_factor = 0.3  # Giảm trọng số technical specs xuống 30%
                
                # Price (chuẩn hóa về log scale)
                price = game.get('price', 0)
                price_normalized = np.log10(max(price, 1)) * tech_weight_factor
                
                # Capacity (GB) - giảm trọng số
                capacity = game.get('capacity', 0) * tech_weight_factor
                
                # CPU Score từ min_spec - giảm trọng số
                min_spec = game.get('min_spec', {})
                cpu_name = min_spec.get('cpu', '')
                cpu_score = self.get_cpu_score(cpu_name) * tech_weight_factor
                
                # GPU Score từ min_spec - giảm trọng số
                gpu_name = min_spec.get('gpu', '')
                gpu_score = self.get_gpu_score(gpu_name) * tech_weight_factor
                
                # RAM (GB) - giảm trọng số
                ram_str = min_spec.get('ram', '0GB')
                try:
                    ram_gb = int(ram_str.replace('GB', '')) * tech_weight_factor
                except:
                    ram_gb = 0
                
                numeric_feature = [price_normalized, capacity, cpu_score, gpu_score, ram_gb]
                numeric_features.append(numeric_feature)
            
            # Tính TF-IDF cho text features
            tfidf = TfidfVectorizer(stop_words='english', lowercase=True)
            text_matrix = tfidf.fit_transform(text_features)
            
            # Tạo riêng genre features với trọng số cao
            genre_features = []
            for game in self.games_data:
                genre_list = game.get('genre', [])
                # Tạo genre string với trọng số cao (lặp lại 5 lần)
                genre_weighted = ' '.join([genre for genre in genre_list for _ in range(5)])
                genre_features.append(genre_weighted)
            
            # TF-IDF cho genre features riêng biệt
            genre_tfidf = TfidfVectorizer(stop_words='english', lowercase=True)
            genre_matrix = genre_tfidf.fit_transform(genre_features)
            
            # Chuẩn hóa numeric features
            numeric_array = np.array(numeric_features)
            scaler = StandardScaler()
            numeric_matrix = scaler.fit_transform(numeric_array)
            
            # Kết hợp: Genre (5x weight) + Text + Numeric (0.3x weight)
            from scipy.sparse import hstack, csr_matrix
            numeric_sparse = csr_matrix(numeric_matrix)
            # Kết hợp với trọng số: Genre (5x), Text (1x), Numeric (0.3x)
            combined_matrix = hstack([genre_matrix, text_matrix, numeric_sparse])
            
            # Tính cosine similarity
            similarity_matrix = cosine_similarity(combined_matrix)
            
            # Chuẩn hóa similarity matrix về 0-1
            # Cosine similarity có thể từ -1 đến 1, chuẩn hóa về 0-1
            self.content_similarity_matrix = (similarity_matrix + 1) / 2
            
            print("Xay dung content similarity matrix voi nhieu thuoc tinh thanh cong!")
            print(f"Genre features: {genre_matrix.shape[1]} dimensions (5x weight)")
            print(f"Text features: {text_matrix.shape[1]} dimensions (1x weight)")
            print(f"Numeric features: {numeric_matrix.shape[1]} dimensions (0.3x weight)") 
            print(f"Total features: {combined_matrix.shape[1]} dimensions")
            print("Content similarity normalized to 0-1 range")
            print("Genre similarity now has 5x higher weight than technical specs!")
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
        """Mở rộng query bằng cách ánh xạ từ tiếng Việt sang tiếng Anh"""
        if not query or not hasattr(self, 'keyword_library'):
            return query
        
        query = query.lower().strip()
        expanded_keywords = set()
        
        # Thêm query gốc
        expanded_keywords.add(query)
        
        # Tìm kiếm trong library
        for english_key, vietnamese_synonyms in self.keyword_library.items():
            vietnamese_synonyms = vietnamese_synonyms.lower()
            
            # Tách query thành các từ
            query_words = query.split()
            
            for word in query_words:
                # Kiểm tra từ có trong synonyms không
                if word in vietnamese_synonyms:
                    expanded_keywords.add(english_key.lower())
                    # Thêm cả các từ đồng nghĩa khác
                    for synonym in vietnamese_synonyms.split():
                        if len(synonym) > 2:  # Bỏ qua từ quá ngắn
                            expanded_keywords.add(synonym)
        
        # Kết hợp tất cả keywords
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
            
            # Lấy tất cả games đã tương tác (GIỮ TRÙNG LẶP để tăng trọng số)
            favorite_games = user_data.get('favorite_games', [])
            purchased_games = user_data.get('purchased_games', [])
            # KHÔNG dùng set() để giữ trùng lặp - games vừa thích vừa mua sẽ xuất hiện 2 lần
            interacted_games = favorite_games + purchased_games
            
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
                    if interacted_game_id <= len(self.games_data):
                        sim_score = self.content_similarity_matrix[interacted_game_id - 1][game_id - 1]
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
            target_interacted = set(target_user.get('favorite_games', []) + 
                                  target_user.get('purchased_games', []))
            
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
                    other_purchased = other_user.get('purchased_games', [])
                    
                    if game_id in other_favorites:
                        rating = 5.0  # User tương tự thích game này
                    elif game_id in other_purchased:
                        rating = 3.0  # User tương tự đã mua game này
                    else:
                        rating = 0.0  # User tương tự không quan tâm
                    
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
                        'price': game.get('price', 0)
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
        
        if debug:
            if price_matched:
                print(f"  price (+1.0): {game.get('price', 0)} matches {keyword}")
            else:
                print(f"  price (0): {game.get('price', 0)} - no match")
            
            print(f"\nTotal raw score: {score}")
            final_score = min(score / 15.0, 1.0)
            print(f"Final score: {score} / 15.0 = {final_score:.3f}")
            print("=" * 50)
        
        # Chuẩn hóa score về 0-1 (max possible score ≈ 15.0)
        # 3.0 + 2.0 + 2.5 + 1.5 + 1.5 + 1.5 + 1.0 + 1.0 + (3 specs * 1.5) + 1.0 = 15.0
        return min(score / 15.0, 1.0)
    
    def get_hybrid_recommendations(self, user_id, top_n=10, keyword=""):
        """Gợi ý kết hợp SVD + Content-based + Demographic + Keyword"""
        
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
                    'demographic_score': 0,
                    'keyword_score': 0,
                    'actual_rating': rec['actual_rating'],
                    'genre': rec['genre'],
                    'price': rec['price']
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
                    'price': rec['price']
                }
        
        # Thêm tất cả games để tính keyword score
        for game in self.games_data:
            game_id = game['id']
            if game_id not in all_games:
                all_games[game_id] = {
                    'game_id': game_id,
                    'game_name': game['name'],
                    'svd_score': 0,
                    'content_score': 0,
                    'demographic_score': 0,
                    'keyword_score': 0,
                    'actual_rating': game.get('rating', 0),
                    'genre': game.get('genre', []),
                    'price': game.get('price', 0)
                }
        
        # Tính keyword score cho tất cả games
        for game_id in all_games:
            game = next((g for g in self.games_data if g['id'] == game_id), None)
            if game:
                keyword_score = self.get_keyword_score(game, keyword)
                all_games[game_id]['keyword_score'] = keyword_score
        
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
            content_score = all_games[game_id]['content_score']
            demographic_score = all_games[game_id]['demographic_score']
            keyword_score = all_games[game_id]['keyword_score']
            
            # Normalize scores to 0-1 range
            svd_normalized = (svd_score + 5) / 10 if svd_score != 0 else 0  # SVD scores can be negative
            content_normalized = content_score  # Already 0-1
            demographic_normalized = demographic_score / 5.0  # Normalize demographic (max = 5) to 0-1
            keyword_normalized = keyword_score  # Already 0-1
            
            # Cập nhật scores đã chuẩn hóa để hiển thị
            all_games[game_id]['svd_score'] = svd_normalized if svd_score != 0 else 0
            all_games[game_id]['demographic_score'] = demographic_normalized
            all_games[game_id]['keyword_score'] = keyword_normalized
            
            hybrid_score = (svd_weight * svd_normalized + 
                          content_weight * content_normalized + 
                          demographic_weight * demographic_normalized +
                          keyword_weight * keyword_normalized)
            all_games[game_id]['hybrid_score'] = hybrid_score
        
        # Sắp xếp theo hybrid score
        sorted_recommendations = sorted(all_games.values(), 
                                      key=lambda x: x['hybrid_score'], 
                                      reverse=True)
        
        return sorted_recommendations[:top_n]
    
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
                    user1_games = set(user1.get('favorite_games', []) + user1.get('purchased_games', []))
                    user2_games = set(user2.get('favorite_games', []) + user2.get('purchased_games', []))
                    
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
        
        print(f"\n" + "="*80)
        print(f"USER SIMILARITY ANALYSIS - {target_user['name']} (ID: {user_id})")
        print(f"Age: {target_user['age']}, Gender: {target_user['gender']}")
        print(f"Favorite games: {target_user.get('favorite_games', [])}")
        print(f"Purchased games: {target_user.get('purchased_games', [])}")
        print("="*80)
        
        # Tính similarity với tất cả users khác
        similarities = []
        target_games = set(target_user.get('favorite_games', []) + target_user.get('purchased_games', []))
        
        for other_user in self.users_data:
            if other_user['id'] == user_id:
                continue
            
            # Demographic similarity
            demo_sim = self.calculate_demographic_similarity(target_user, other_user)
            
            # Game similarity
            other_games = set(other_user.get('favorite_games', []) + other_user.get('purchased_games', []))
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
        """Tạo đồ thị so sánh top 5 games được gợi ý với từng game user đã thích/tải"""
        if not MATPLOTLIB_AVAILABLE:
            print("Matplotlib not available. Skipping content comparison chart creation.")
            return None
        
        # Lấy thông tin target user
        target_user = next((u for u in self.users_data if u['id'] == user_id), None)
        if not target_user:
            return None
        
        # Lấy games user đã tương tác
        favorite_games = target_user.get('favorite_games', [])
        purchased_games = target_user.get('purchased_games', [])
        interacted_games = favorite_games + purchased_games
        
        if not interacted_games:
            print("User chưa có game nào đã tương tác")
            return None
        
        # Lấy top 5 recommendations để phân tích
        top_5_recommendations = recommendations[:5]
        
        if not top_5_recommendations:
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
                    'interaction_type': ' + '.join(interaction_type),
                    'rating': game.get('rating', 0)
                })
        
        if not user_game_details:
            print("Không có dữ liệu games user đã tương tác")
            return None
        
        # Tạo figure với 1 subplot chính
        fig, ax = plt.subplots(1, 1, figsize=(16, 10))
        
        # Tạo dữ liệu cho grouped bar chart
        # Mỗi game được gợi ý sẽ có nhiều thanh (1 thanh cho mỗi game user đã tương tác)
        n_recommended = len(top_5_recommendations)
        n_user_games = len(user_game_details)
        
        # Tính similarity matrix
        similarity_data = []
        for i, rec in enumerate(top_5_recommendations):
            similarities = []
            for user_game in user_game_details:
                sim_score = self.content_similarity_matrix[rec['game_id'] - 1][user_game['game_id'] - 1]
                similarities.append(sim_score)
            similarity_data.append(similarities)
        
        # Tính tổng điểm content score cho mỗi game được gợi ý
        total_content_scores = []
        for i in range(n_recommended):
            avg_similarity = np.mean(similarity_data[i])
            total_content_scores.append(avg_similarity)
        
        # Tạo grouped bar chart với tổng điểm
        x = np.arange(n_recommended)
        width = 0.8 / (n_user_games + 1)  # +1 cho tổng điểm
        
        # Màu sắc cho từng user game + màu cho tổng điểm
        colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF']
        total_color = '#2C3E50'  # Màu đậm cho tổng điểm
        
        bars = []
        
        # Vẽ thanh cho từng user game
        for j, user_game in enumerate(user_game_details):
            similarities = [similarity_data[i][j] for i in range(n_recommended)]
            bar = ax.bar(x + j * width, similarities, width, 
                        label=f"{user_game['game_name'][:15]} ({user_game['interaction_type']})",
                        color=colors[j % len(colors)], alpha=0.8)
            bars.append(bar)
            
            # Add value labels cho từng similarity
            for i, sim in enumerate(similarities):
                ax.text(i + j * width, sim + 0.01, f'{sim:.3f}', 
                       ha='center', va='bottom', fontsize=7, fontweight='bold')
        
        # Vẽ thanh cho tổng điểm content score
        total_bar = ax.bar(x + n_user_games * width, total_content_scores, width, 
                          label="Total Content Score (Average)",
                          color=total_color, alpha=0.9, linewidth=2, edgecolor='black')
        bars.append(total_bar)
        
        # Add value labels cho tổng điểm
        for i, total_score in enumerate(total_content_scores):
            ax.text(i + n_user_games * width, total_score + 0.02, f'{total_score:.3f}', 
                   ha='center', va='bottom', fontsize=9, fontweight='bold', color='white',
                   bbox=dict(boxstyle="round,pad=0.2", facecolor=total_color, alpha=0.8))
        
        # Customize chart
        ax.set_xlabel('Top 5 Games Được Gợi Ý', fontsize=12, fontweight='bold')
        ax.set_ylabel('Content Similarity Score', fontsize=12, fontweight='bold')
        ax.set_title(f'Content Similarity: Top 5 Games vs User\'s Games + Total Score\n{target_user["name"]} (ID: {user_id})', 
                    fontsize=14, fontweight='bold', pad=20)
        
        # Set x-axis labels
        recommended_names = [rec['game_name'][:20] for rec in top_5_recommendations]
        ax.set_xticks(x + width * n_user_games / 2)  # Điều chỉnh để center với tổng điểm
        ax.set_xticklabels(recommended_names, rotation=45, ha='right')
        
        # Add legend
        ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        
        # Add grid for easier reading
        ax.grid(True, alpha=0.3, axis='y')
        ax.set_axisbelow(True)
        ax.set_ylim(0, 1.1)
        
        # Add explanation text
        user_games_list = ', '.join([game['game_name'][:10] for game in user_game_details])
        explanation = f"User Games: {user_games_list} | Dark bars = Total Content Score (Average)"
        ax.text(0.5, 0.02, explanation, ha='center', fontsize=10, 
                style='italic', bbox=dict(boxstyle="round,pad=0.3", facecolor="lightgray", alpha=0.5),
                transform=ax.transAxes)
        
        # Adjust layout
        plt.tight_layout()
        
        # Save chart
        if not filename:
            filename = 'content_comparison_chart.png'
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        print(f"Content comparison chart saved to: {filename}")
        
        # Close figure
        plt.close(fig)
        
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
                user_games = set(other_user.get('favorite_games', []) + other_user.get('purchased_games', []))
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
                user_games = set(other_user.get('favorite_games', []) + other_user.get('purchased_games', []))
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
                f.write(f"{'Rank':<4} {'Game Name':<30} {'Hybrid':<8} {'SVD':<8} {'Content':<8} {'Demo':<8} {'Keyword':<8} {'Rating':<8} {'Price':<12}\n")
                f.write("-" * 100 + "\n")
                
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
                    
                    f.write(f"{i:<4} {game_name:<30} {hybrid_score:<8.3f} {svd_score:<8.3f} ")
                    f.write(f"{content_score:<8.3f} {demographic_score:<8.3f} {keyword_score:<8.3f} ")
                    f.write(f"{rating:<8.1f} {price:<12,}\n")
                
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
        
        # Thêm thông tin đầy đủ của từng game (không có rank, scores)
        for rec in recommendations:
            # Tìm thông tin đầy đủ của game từ database
            game_full_info = next((g for g in self.games_data if g['id'] == rec['game_id']), None)
            
            game_info = {
                "id": rec['game_id'],
                "name": rec['game_name'],
                "description": game_full_info.get('description', '') if game_full_info else '',
                "rating": rec['actual_rating'],
                "release_year": game_full_info.get('release_year', 0) if game_full_info else 0,
                "publisher": game_full_info.get('publisher', '') if game_full_info else '',
                "genre": rec['genre'],
                "mode": game_full_info.get('mode', '') if game_full_info else '',
                "price": rec['price'],
                "min_spec": {k: v for k, v in (game_full_info.get('min_spec', {}) if game_full_info else {}).items() if k != 'storage'},
                "rec_spec": {k: v for k, v in (game_full_info.get('rec_spec', {}) if game_full_info else {}).items() if k != 'storage'},
                "multiplayer": game_full_info.get('multiplayer', False) if game_full_info else False,
                "capacity": game_full_info.get('capacity', 0) if game_full_info else 0,
                "age_rating": game_full_info.get('age_rating', '') if game_full_info else '',
                "platform": game_full_info.get('platform', []) if game_full_info else [],
                "language": game_full_info.get('language', []) if game_full_info else []
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
            if 'demographic_score' in rec:
                print(f"   Demographic Score: {rec['demographic_score']:.3f}")
            if 'keyword_score' in rec and rec['keyword_score'] > 0:
                print(f"   Keyword Score: {rec['keyword_score']:.3f}")
            
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

def show_all_recommendations_with_query(recommender, query=""):
    """Hien thi goi y cho tat ca users voi query"""
    print("\n" + "="*60)
    if query:
        print(f"GAME RECOMMENDATION SYSTEM - Keyword: '{query}'")
    else:
        print("GAME RECOMMENDATION SYSTEM - SVD Algorithm")
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
        print(f"Game da mua: {user_data.get('purchased_games', [])}")
        
        # Lay tat ca games chua tuong tac
        interacted_games = set(user_data.get('favorite_games', []) + 
                             user_data.get('purchased_games', []))
        total_games = len(recommender.games_data)
        available_games = total_games - len(interacted_games)
        
        print(f"So game co the goi y: {available_games}")
        
        # Lay recommendations
        recommendations = recommender.get_hybrid_recommendations(
            user_id=user_id,
            top_n=available_games,
            keyword=query
        )
        
        # Hien thi ket qua
        title = f"DANH SACH GOI Y CHO {user_data['name']}"
        if query:
            title += f" - Keyword: '{query}'"
        recommender.display_recommendations(recommendations, title, query)
        
        print("\n" + "-"*60)

def show_recommendations_for_user(recommender, user_id, query=""):
    """Hien thi goi y cho 1 user cu the"""
    user_data = next((u for u in recommender.users_data if u['id'] == user_id), None)
    if not user_data:
        print(f"Khong tim thay user ID: {user_id}")
        return
    
    print(f"\n" + "="*60)
    print(f"GOI Y CHO: {user_data['name']} (ID: {user_id})")
    if query:
        print(f"Tim kiem: '{query}'")
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
    
    # Lay recommendations
    recommendations = recommender.get_hybrid_recommendations(
        user_id=user_id,
        top_n=available_games,  # Lay tat ca games co the goi y
        keyword=query
    )
    
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
    if args.user:
        show_recommendations_for_user(recommender, args.user, args.query)
    else:
        show_all_recommendations_with_query(recommender, args.query)
    
    print("\nHoan thanh! He thong da tao goi y cho tat ca nguoi dung.")
    return recommender

if __name__ == "__main__":
    recommender = main()
