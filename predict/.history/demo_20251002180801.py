#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Demo script for Game Recommendation System
Hệ thống gợi ý game sử dụng thuật toán SVD
"""

import json
import numpy as np
import pandas as pd
from scipy.sparse.linalg import svds
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import warnings
warnings.filterwarnings('ignore')

def print_header(title):
    """In header đẹp"""
    print("\n" + "="*60)
    print(f" {title} ")
    print("="*60)

def print_game_info(game, index=None):
    """In thông tin game"""
    prefix = f"{index}. " if index else ""
    print(f"{prefix}{game['name']}")
    print(f"   Rating: {game.get('rating', 'N/A')}/5.0")
    print(f"   Genre: {', '.join(game.get('genre', []))}")
    print(f"   Price: {game.get('price', 0):,} VND")
    print(f"   Publisher: {game.get('publisher', 'N/A')}")
    print(f"   Release Year: {game.get('release_year', 'N/A')}")
    print("-" * 50)

class GameRecommendationDemo:
    def __init__(self):
        self.games_data = None
        self.users_data = None
        self.cpu_data = None
        self.gpu_data = None
        self.user_item_matrix = None
        self.svd_model = None
        self.content_similarity_matrix = None
        
    def load_data(self):
        """Load dữ liệu từ các file JSON"""
        try:
            print("Loading data...")
            
            with open('game.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.games_data = data['games']
                self.users_data = data['users']
            
            with open('cpu.json', 'r', encoding='utf-8') as f:
                self.cpu_data = json.load(f)
            
            with open('gpu.json', 'r', encoding='utf-8') as f:
                self.gpu_data = json.load(f)
                
            print(f"Loaded {len(self.games_data)} games and {len(self.users_data)} users")
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False
    
    def create_user_item_matrix(self):
        """Tạo ma trận user-item cho SVD"""
        print("Creating user-item matrix...")
        
        user_game_ratings = []
        
        for user in self.users_data:
            user_id = user['id']
            favorites = user.get('favorite_games', [])
            purchased = user.get('purchased_games', [])
            
            for game in self.games_data:
                game_id = game['id']
                if game_id in favorites:
                    rating = 5.0  # Favorite games get highest rating
                elif game_id in purchased:
                    rating = 3.0  # Purchased games get medium rating
                else:
                    rating = 0.0  # No interaction
                
                user_game_ratings.append({
                    'user_id': user_id,
                    'game_id': game_id,
                    'rating': rating
                })
        
        ratings_df = pd.DataFrame(user_game_ratings)
        self.user_item_matrix = ratings_df.pivot(index='user_id', columns='game_id', values='rating').fillna(0)
        
        print(f"User-Item Matrix shape: {self.user_item_matrix.shape}")
        print("Matrix created successfully!")
    
    def train_svd(self, k=2):
        """Huấn luyện mô hình SVD"""
        print(f"Training SVD model with k={k} factors...")
        
        try:
            # Normalize by subtracting user mean
            user_ratings_mean = np.mean(self.user_item_matrix.values, axis=1)
            ratings_demeaned = self.user_item_matrix.values - user_ratings_mean.reshape(-1, 1)
            
            # Apply SVD
            U, sigma, Vt = svds(ratings_demeaned, k=k)
            sigma = np.diag(sigma)
            
            # Reconstruct the rating matrix
            predicted_ratings = np.dot(np.dot(U, sigma), Vt) + user_ratings_mean.reshape(-1, 1)
            
            self.svd_model = {
                'U': U,
                'sigma': sigma,
                'Vt': Vt,
                'user_ratings_mean': user_ratings_mean,
                'predicted_ratings': predicted_ratings
            }
            
            print("SVD model trained successfully!")
            
            # Print some statistics
            print(f"User factors shape: {U.shape}")
            print(f"Item factors shape: {Vt.shape}")
            print(f"Singular values: {np.diag(sigma)}")
            
            return True
        except Exception as e:
            print(f"Error training SVD: {e}")
            return False
    
    def build_content_similarity(self):
        """Xây dựng ma trận tương đồng content-based"""
        print("Building content similarity matrix...")
        
        try:
            features = []
            for game in self.games_data:
                genre_str = ' '.join(game.get('genre', []))
                publisher = game.get('publisher', '')
                age_rating = game.get('age_rating', '')
                platform_str = ' '.join(game.get('platform', []))
                mode = game.get('mode', '')
                
                feature_text = f"{genre_str} {publisher} {age_rating} {platform_str} {mode}"
                features.append(feature_text)
            
            tfidf = TfidfVectorizer(stop_words='english', lowercase=True)
            tfidf_matrix = tfidf.fit_transform(features)
            
            self.content_similarity_matrix = cosine_similarity(tfidf_matrix)
            
            print("Content similarity matrix built successfully!")
            return True
        except Exception as e:
            print(f"Error building content similarity: {e}")
            return False
    
    def get_svd_recommendations(self, user_id, top_n=5):
        """Lấy gợi ý từ SVD"""
        if self.svd_model is None:
            return []
        
        try:
            user_idx = user_id - 1
            if user_idx >= len(self.svd_model['predicted_ratings']):
                return []
            
            user_predictions = self.svd_model['predicted_ratings'][user_idx]
            
            # Get games user has already interacted with
            user_data = next((u for u in self.users_data if u['id'] == user_id), None)
            if user_data:
                interacted_games = set(user_data.get('favorite_games', []) + 
                                     user_data.get('purchased_games', []))
            else:
                interacted_games = set()
            
            recommendations = []
            for game_idx, predicted_rating in enumerate(user_predictions):
                game_id = game_idx + 1
                if game_id not in interacted_games:
                    game = next((g for g in self.games_data if g['id'] == game_id), None)
                    if game:
                        recommendations.append({
                            'game': game,
                            'predicted_rating': predicted_rating,
                            'method': 'SVD'
                        })
            
            recommendations.sort(key=lambda x: x['predicted_rating'], reverse=True)
            return recommendations[:top_n]
            
        except Exception as e:
            print(f"Error getting SVD recommendations: {e}")
            return []
    
    def get_content_recommendations(self, user_id, top_n=5):
        """Lấy gợi ý từ content-based filtering"""
        if self.content_similarity_matrix is None:
            return []
        
        try:
            user_data = next((u for u in self.users_data if u['id'] == user_id), None)
            if not user_data:
                return []
            
            favorite_games = user_data.get('favorite_games', [])
            if not favorite_games:
                return []
            
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
            
            sorted_games = sorted(game_scores.items(), key=lambda x: x[1], reverse=True)
            
            recommendations = []
            for game_id, score in sorted_games[:top_n]:
                game = next((g for g in self.games_data if g['id'] == game_id), None)
                if game:
                    recommendations.append({
                        'game': game,
                        'similarity_score': score,
                        'method': 'Content-based'
                    })
            
            return recommendations
            
        except Exception as e:
            print(f"Error getting content recommendations: {e}")
            return []
    
    def demo_user_analysis(self):
        """Demo phân tích người dùng"""
        print_header("USER ANALYSIS")
        
        for user in self.users_data:
            print(f"\nUser: {user['name']} (ID: {user['id']})")
            print(f"Age: {user['age']}, Gender: {user['gender']}")
            print(f"Favorite Games: {user.get('favorite_games', [])}")
            print(f"Purchased Games: {user.get('purchased_games', [])}")
            
            # Show favorite games details
            if user.get('favorite_games'):
                print("\nFavorite Games Details:")
                for game_id in user['favorite_games']:
                    game = next((g for g in self.games_data if g['id'] == game_id), None)
                    if game:
                        print(f"  - {game['name']} ({', '.join(game.get('genre', []))})")
            print("-" * 50)
    
    def demo_svd_recommendations(self):
        """Demo SVD recommendations"""
        print_header("SVD COLLABORATIVE FILTERING RECOMMENDATIONS")
        
        for user in self.users_data:
            print(f"\nSVD Recommendations for {user['name']}:")
            recommendations = self.get_svd_recommendations(user['id'], top_n=3)
            
            if recommendations:
                for i, rec in enumerate(recommendations, 1):
                    print(f"{i}. {rec['game']['name']}")
                    print(f"   Predicted Score: {rec['predicted_rating']:.3f}")
                    print(f"   Actual Rating: {rec['game'].get('rating', 'N/A')}/5.0")
                    print(f"   Genre: {', '.join(rec['game'].get('genre', []))}")
                    print(f"   Price: {rec['game'].get('price', 0):,} VND")
                    print()
            else:
                print("   No recommendations found")
            print("-" * 50)
    
    def demo_content_recommendations(self):
        """Demo content-based recommendations"""
        print_header("CONTENT-BASED FILTERING RECOMMENDATIONS")
        
        for user in self.users_data:
            print(f"\nContent-based Recommendations for {user['name']}:")
            recommendations = self.get_content_recommendations(user['id'], top_n=3)
            
            if recommendations:
                for i, rec in enumerate(recommendations, 1):
                    print(f"{i}. {rec['game']['name']}")
                    print(f"   Similarity Score: {rec['similarity_score']:.3f}")
                    print(f"   Actual Rating: {rec['game'].get('rating', 'N/A')}/5.0")
                    print(f"   Genre: {', '.join(rec['game'].get('genre', []))}")
                    print(f"   Price: {rec['game'].get('price', 0):,} VND")
                    print()
            else:
                print("   No recommendations found")
            print("-" * 50)
    
    def demo_algorithm_comparison(self):
        """So sánh các thuật toán"""
        print_header("ALGORITHM COMPARISON")
        
        for user in self.users_data:
            print(f"\nComparison for {user['name']}:")
            
            svd_recs = self.get_svd_recommendations(user['id'], top_n=3)
            content_recs = self.get_content_recommendations(user['id'], top_n=3)
            
            print("SVD vs Content-based:")
            print("SVD Recommendations:")
            for i, rec in enumerate(svd_recs, 1):
                print(f"  {i}. {rec['game']['name']} (Score: {rec['predicted_rating']:.3f})")
            
            print("Content-based Recommendations:")
            for i, rec in enumerate(content_recs, 1):
                print(f"  {i}. {rec['game']['name']} (Score: {rec['similarity_score']:.3f})")
            
            print("-" * 50)
    
    def run_full_demo(self):
        """Chạy demo đầy đủ"""
        print_header("GAME RECOMMENDATION SYSTEM DEMO")
        print("Hệ thống gợi ý game sử dụng thuật toán SVD")
        print("Phát triển bởi: AI Assistant")
        
        # Load data
        if not self.load_data():
            return False
        
        # Preprocess
        self.create_user_item_matrix()
        
        # Train models
        if not self.train_svd(k=2):
            return False
        
        if not self.build_content_similarity():
            return False
        
        # Run demos
        self.demo_user_analysis()
        self.demo_svd_recommendations()
        self.demo_content_recommendations()
        self.demo_algorithm_comparison()
        
        print_header("DEMO COMPLETED SUCCESSFULLY")
        print("Hệ thống đã hoạt động thành công!")
        print("Bạn có thể chạy web interface bằng: python web_interface.py")
        
        return True

def main():
    """Main function"""
    demo = GameRecommendationDemo()
    demo.run_full_demo()

if __name__ == "__main__":
    main()
